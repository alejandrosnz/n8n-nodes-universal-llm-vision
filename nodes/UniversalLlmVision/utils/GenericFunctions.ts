/**
 * Generic helper functions for request building and response parsing
 * Uses the Strategy pattern for provider-specific logic
 */

import type { IHttpRequestMethods, IHttpRequestOptions } from 'n8n-workflow';
import type { PreparedImage } from '../processors/ImageProcessor';
import { getProvider } from '../providers/ProviderRegistry';
import type { IProviderStrategy, ProviderRequestOptions, ModelInfo } from '../providers/IProviderStrategy';

export interface CredentialInfo {
  credentials: any;
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
 * Detect and retrieve configured credentials
 * @param getCredentialsFn - Function to get credentials from n8n context
 * @returns Promise<CredentialInfo> - Credential information
 */
export async function detectCredentials(
  getCredentialsFn: (type: string) => Promise<any>,
): Promise<CredentialInfo> {
  // Try to get each credential type
  let openRouterCreds: any;
  let universalCreds: any;

  try {
    openRouterCreds = await getCredentialsFn('openRouterApi');
  } catch {
    openRouterCreds = null;
  }

  try {
    universalCreds = await getCredentialsFn('universalLlmVisionApi');
  } catch {
    universalCreds = null;
  }

  // Prefer OpenRouter credential if both are configured
  if (openRouterCreds?.apiKey) {
    return {
      credentials: openRouterCreds,
      credentialName: 'openRouterApi',
      provider: 'openrouter',
      apiKey: openRouterCreds.apiKey as string,
    };
  }

  if (universalCreds?.apiKey) {
    return {
      credentials: universalCreds,
      credentialName: 'universalLlmVisionApi',
      provider: (universalCreds.provider as string) || 'openai',
      apiKey: universalCreds.apiKey as string,
      customBaseUrl: (universalCreds.baseUrl as string) || undefined,
    };
  }

  throw new Error('No credentials configured. Please configure OpenRouter or Universal LLM Vision API credentials');
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
