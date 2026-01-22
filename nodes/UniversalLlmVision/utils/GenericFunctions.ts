/**
 * Generic helper functions for request building and response parsing
 * Uses the Strategy pattern for provider-specific logic
 */

import type { IHttpRequestMethods, IHttpRequestOptions } from 'n8n-workflow';
import type { PreparedImage } from '../processors/ImageProcessor';
import { getProvider } from '../providers/ProviderRegistry';
import type { IProviderStrategy, ProviderRequestOptions, ModelInfo } from '../providers/IProviderStrategy';

export interface UniversalLlmVisionCredentials {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  httpReferer?: string;
  appTitle?: string;
}

export interface CredentialInfo {
  credentials: UniversalLlmVisionCredentials;
  credentialName: string;
  provider: string;
  apiKey: string;
  customBaseUrl?: string;
}

export interface RequestBuildOptions {
  provider: string;
  model: string;
  prompt: string;
  image: PreparedImage;
  imageDetail?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  responseFormat?: string;
  additionalParameters?: Record<string, any>;
}

export interface RequestBuilt {
  url: string;
  headers: Record<string, string>;
  body: Record<string, any>;
}

/**
 * Retrieve configured Universal LLM Vision API credentials
 * @param getCredentialsFn - Function to get credentials from n8n context
 * @returns Promise<CredentialInfo> - Credential information with provider type
 */
export async function detectCredentials(
  getCredentialsFn: (type: string) => Promise<any>,
): Promise<CredentialInfo> {
  // Get Universal LLM Vision API credentials
  const credentials = await getCredentialsFn('universalLlmVisionApi') as UniversalLlmVisionCredentials;

  // Extract provider type from credential selector
  const provider = credentials.provider || 'openai';
  const apiKey = credentials.apiKey;
  const customBaseUrl = credentials.baseUrl || undefined;

  return {
    credentials,
    credentialName: 'universalLlmVisionApi',
    provider,
    apiKey,
    customBaseUrl,
  };
}

/**
 * Build complete request for the specified provider
 * Delegates to provider-specific strategy
 * @param options - Request configuration options
 * @param apiKey - API key for authentication
 * @param customBaseUrl - Optional custom base URL
 * @param customHeaders - Additional custom headers to include
 * @returns RequestBuilt - Complete request configuration
 */
export function buildRequest(
  options: RequestBuildOptions,
  apiKey: string,
  customBaseUrl?: string,
  customHeaders?: Record<string, string>,
): RequestBuilt {
  const strategy = getProvider(options.provider, customBaseUrl);

  // Convert RequestBuildOptions to ProviderRequestOptions
  const providerOptions: ProviderRequestOptions = {
    model: options.model,
    prompt: options.prompt,
    image: options.image,
    imageDetail: options.imageDetail,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    topP: options.topP,
    systemPrompt: options.systemPrompt,
    responseFormat: options.responseFormat,
    additionalParameters: options.additionalParameters,
  };

  // Build request body using strategy
  const body = strategy.buildRequestBody(providerOptions);

  // Get API URL from strategy
  const url = strategy.getApiUrl(customBaseUrl);

  // Get headers with authentication
  const headers = strategy.buildHeaders(apiKey);

  // Merge custom headers (prevent overriding auth headers)
  if (customHeaders) {
    for (const [key, value] of Object.entries(customHeaders)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'authorization' && lowerKey !== 'x-api-key' && value) {
        headers[key] = value;
      }
    }
  }

  return { url, headers, body };
}

/**
 * Extract analysis from API response based on provider
 * @param provider - Provider name (e.g., 'openai', 'anthropic')
 * @param response - Raw API response
 * @returns string - Extracted analysis text
 */
export function extractAnalysis(provider: string, response: any): string {
  const strategy = getProvider(provider);
  return strategy.extractAnalysis(response);
}

/**
 * Extract metadata from response based on provider
 * @param provider - Provider name
 * @param response - Raw API response
 * @returns Record<string, any> - Metadata object with usage stats and model info
 */
export function extractMetadata(provider: string, response: any): Record<string, any> {
  const strategy = getProvider(provider);
  return strategy.extractMetadata(response);
}

/**
 * Get headers with API key injected
 * @param provider - Provider name
 * @param apiKey - API key for authentication
 * @param customHeaders - Additional custom headers
 * @returns Record<string, string> - Complete headers object
 */
export function getHeadersWithAuth(
  provider: string,
  apiKey: string,
  customHeaders?: Record<string, string>,
): Record<string, string> {
  const strategy = getProvider(provider);
  const headers = strategy.buildHeaders(apiKey);

  // Add custom headers but don't allow them to override authentication headers
  if (customHeaders) {
    for (const [key, value] of Object.entries(customHeaders)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'authorization' && lowerKey !== 'x-api-key' && value) {
        headers[key] = value;
      }
    }
  }

  return headers;
}

/**
 * Get provider strategy instance
 * @param providerName - Name of the provider
 * @param customBaseUrl - Optional custom base URL
 * @returns IProviderStrategy - Strategy instance for the provider
 */
export function getProviderStrategy(providerName: string, customBaseUrl?: string): IProviderStrategy {
  return getProvider(providerName, customBaseUrl);
}

/**
 * Sleep utility for retry backoff delays
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute HTTP request with retry logic and exponential backoff
 * @param httpRequest - HTTP request function
 * @param requestOptions - Request configuration
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @returns Promise<any> - Response from successful request
 */
async function fetchWithRetry(
  httpRequest: (requestOptions: IHttpRequestOptions) => Promise<any>,
  requestOptions: IHttpRequestOptions,
  maxAttempts: number = 3,
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await httpRequest(requestOptions);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on the last attempt
      if (attempt === maxAttempts - 1) {
        break;
      }

      // Exponential backoff: 1s, 2s
      const delayMs = 1000 * (attempt + 1);
      await sleep(delayMs);
    }
  }

  // If all attempts failed, throw the last error
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Fetch all vision-capable models from models.dev API
 * @param httpRequest - HTTP request function
 * @param providerFilter - Optional provider ID to filter models from a specific provider
 * @returns Promise<ModelInfo[]> - Array of available vision-capable models
 */
export async function fetchAllVisionModels(
  httpRequest: (requestOptions: IHttpRequestOptions) => Promise<any>,
  providerFilter?: string,
): Promise<ModelInfo[]> {
  try {
    const requestOptions: IHttpRequestOptions = {
      method: 'GET' as IHttpRequestMethods,
      url: 'https://models.dev/api.json',
      headers: {
        'Accept': 'application/json',
      },
      json: true,
      timeout: 15000, // 15 second timeout
    };

    // Use retry logic with 3 attempts (initial + 2 retries)
    const response = await fetchWithRetry(httpRequest, requestOptions, 3);

    // Handle invalid/null responses
    if (!response || typeof response !== 'object') {
      return [];
    }

    const visionModels: ModelInfo[] = [];

    // Iterate through all providers
    for (const [providerId, providerData] of Object.entries(response)) {
      // If filter is provided, skip providers that don't match
      if (providerFilter && providerId !== providerFilter && !providerId.includes(providerFilter)) {
        continue;
      }

      if (typeof providerData !== 'object' || !providerData) continue;

      const provider = providerData as any;
      const providerName = provider.name || providerId;
      const models = provider.models || {};

      // Iterate through all models from this provider
      for (const [modelId, modelData] of Object.entries(models)) {
        if (typeof modelData !== 'object' || !modelData) continue;

        const model = modelData as any;

        // Check if model supports image input
        const inputModalities = model.modalities?.input || [];
        if (inputModalities.includes('image')) {
          visionModels.push({
            id: modelId,
            name: `${providerName}: ${model.name || modelId}`,
            description: `$${model.cost?.input || 0} / $${model.cost?.output || 0} per 1M tokens (${modelId})`,
            releaseDate: model.release_date,
            provider: providerId,
          });
        }
      }
    }

    // Sort models by release_date (newest first), then by name
    visionModels.sort((a, b) => {
      // Compare dates in descending order (newest first)
      if (a.releaseDate && b.releaseDate) {
        const dateComparison = b.releaseDate.localeCompare(a.releaseDate);
        if (dateComparison !== 0) {
          return dateComparison;
        }
      } else if (a.releaseDate) {
        return -1; // a has date, b doesn't - a comes first
      } else if (b.releaseDate) {
        return 1; // b has date, a doesn't - b comes first
      }
      // If both have same date or neither has date, sort by name
      return a.name.localeCompare(b.name);
    });

    return visionModels;
  } catch (error) {
    throw new Error(`Failed to fetch models from models.dev API: ${error.message}`);
  }
}

/**
 * Fetch available models from provider API
 * @param provider - Provider name (e.g., 'openai', 'openrouter')
 * @param apiKey - API key for authentication
 * @param customBaseUrl - Optional custom base URL
 * @param httpRequest - HTTP request function
 * @returns Promise<ModelInfo[]> - Array of available vision-capable models
 */
export async function fetchProviderModels(
  provider: string,
  apiKey: string,
  customBaseUrl: string | undefined,
  httpRequest: (requestOptions: IHttpRequestOptions) => Promise<any>,
): Promise<ModelInfo[]> {
  try {
    const strategy = getProvider(provider, customBaseUrl);

    // Check if strategy supports model fetching
    if (!strategy.getModelsEndpoint || !strategy.parseModelsResponse) {
      throw new Error(`Provider ${provider} does not support automatic model listing`);
    }

    // Build models endpoint URL
    const baseUrl = customBaseUrl || strategy.baseUrl;
    const modelsEndpoint = strategy.getModelsEndpoint();
    const url = baseUrl.replace(/\/$/, '') + modelsEndpoint;

    // Build headers
    const headers = strategy.buildHeaders(apiKey);

    // Make request to fetch models
    const requestOptions: IHttpRequestOptions = {
      method: 'GET' as IHttpRequestMethods,
      url,
      headers,
      json: true,
    };

    const response = await httpRequest(requestOptions);

    // Parse response using strategy
    const parsedModels = strategy.parseModelsResponse(response);

    // Filter for vision-capable models if supported
    if (strategy.filterVisionModels) {
      // Filter already parsed models (they have ModelInfo format)
      const rawModels = response.data || response || [];
      const filteredRaw = strategy.filterVisionModels(rawModels);
      return strategy.parseModelsResponse(
        response.data ? { data: filteredRaw } : filteredRaw
      );
    }

    return parsedModels;
  } catch (error) {
    throw new Error(`Failed to fetch models from ${provider}: ${error.message}`);
  }
}
