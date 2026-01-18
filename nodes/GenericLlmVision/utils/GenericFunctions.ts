/**
 * Generic helper functions for request building and response parsing
 */

import type { PreparedImage } from '../processors/ImageProcessor';
import { getHeaders, getApiUrl, getProvider } from './providers';

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
 * Build complete request for OpenAI-compatible providers
 * @param options - Request configuration options
 * @param baseUrl - Optional custom base URL
 * @param customHeaders - Additional headers to include
 * @returns RequestBuilt - Complete request configuration
 */
export function buildOpenAiRequest(
  options: RequestBuildOptions,
  baseUrl?: string,
  customHeaders?: Record<string, string>,
): RequestBuilt {
  const { provider, model, prompt, image, imageDetail, temperature, maxTokens, topP, systemPrompt, responseFormat, additionalParameters } = options;

  const headers = getHeaders(provider, '', customHeaders);
  const url = getApiUrl(provider, baseUrl);

  const providerConfig = getProvider(provider);
  const supportsDetail = providerConfig.supportsImageDetail;

  const body: any = {
    model,
  };

  // Add model parameters if specified
  if (temperature !== undefined) body.temperature = temperature;
  if (maxTokens !== undefined) body.max_tokens = maxTokens;
  if (topP !== undefined) body.top_p = topP;

  // Add response format if specified and supported
  if (responseFormat && providerConfig.supportsJsonResponse) {
    body.response_format = { type: responseFormat };
  }

  // Build messages
  const messages: any[] = [];

  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  // Build user message with image
  const userContent: any[] = [
    {
      type: 'text',
      text: prompt,
    },
  ];

  if (image.source === 'url') {
    // URL reference
    userContent.push({
      type: 'image_url',
      image_url: {
        url: image.data,
        ...(supportsDetail && imageDetail ? { detail: imageDetail } : {}),
      },
    });
  } else {
    // Base64 embedded
    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:${image.mimeType};base64,${image.data}`,
        ...(supportsDetail && imageDetail ? { detail: imageDetail } : {}),
      },
    });
  }

  messages.push({
    role: 'user',
    content: userContent,
  });

  body.messages = messages;

  // Add any additional parameters
  if (additionalParameters) {
    Object.assign(body, additionalParameters);
  }

  return { url, headers, body };
}

/**
 * Build complete request for Anthropic provider
 * @param options - Request configuration options
 * @param baseUrl - Optional custom base URL
 * @param customHeaders - Additional headers to include
 * @returns RequestBuilt - Complete request configuration
 */
export function buildAnthropicRequest(
  options: RequestBuildOptions,
  baseUrl?: string,
  customHeaders?: Record<string, string>,
): RequestBuilt {
  const { model, prompt, image, temperature, maxTokens, topP, systemPrompt, additionalParameters } = options;

  const headers = getHeaders(options.provider, '', customHeaders);
  const url = getApiUrl(options.provider, baseUrl);

  const body: any = {
    model,
  };

  // Add model parameters if specified
  if (temperature !== undefined) body.temperature = temperature;
  if (maxTokens !== undefined) body.max_tokens = maxTokens;
  if (topP !== undefined) body.top_p = topP;

  // Add system prompt if specified
  if (systemPrompt) {
    body.system = systemPrompt;
  }

  // Build messages with image
  const content: any[] = [];

  // Add image first
  if (image.source === 'url') {
    content.push({
      type: 'image',
      source: {
        type: 'url',
        url: image.data,
      },
    });
  } else {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: image.mimeType,
        data: image.data,
      },
    });
  }

  // Add text prompt
  content.push({
    type: 'text',
    text: prompt,
  });

  body.messages = [
    {
      role: 'user',
      content,
    },
  ];

  // Add any additional parameters
  if (additionalParameters) {
    Object.assign(body, additionalParameters);
  }

  return { url, headers, body };
}

/**
 * Build request based on provider type
 * @param options - Request configuration options
 * @param baseUrl - Optional custom base URL
 * @param customHeaders - Additional headers to include
 * @returns RequestBuilt - Complete request configuration
 */
export function buildRequest(
  options: RequestBuildOptions,
  baseUrl?: string,
  customHeaders?: Record<string, string>,
): RequestBuilt {
  const providerConfig = getProvider(options.provider);

  if (providerConfig.requestFormat === 'anthropic') {
    return buildAnthropicRequest(options, baseUrl, customHeaders);
  }

  return buildOpenAiRequest(options, baseUrl, customHeaders);
}

/**
 * Extract analysis from OpenAI response
 * @param response - Raw API response from OpenAI-compatible provider
 * @returns string - Extracted analysis text
 */
export function extractOpenAiAnalysis(response: any): string {
  return response.choices?.[0]?.message?.content || '';
}

/**
 * Extract analysis from Anthropic response
 * @param response - Raw API response from Anthropic
 * @returns string - Extracted analysis text
 */
export function extractAnthropicAnalysis(response: any): string {
  return response.content?.[0]?.text || '';
}

/**
 * Extract analysis based on provider response format
 * @param provider - Provider name (e.g., 'openai', 'anthropic')
 * @param response - Raw API response
 * @returns string - Extracted analysis text
 */
export function extractAnalysis(provider: string, response: any): string {
  const providerConfig = getProvider(provider);

  if (providerConfig.responseFormat === 'anthropic') {
    return extractAnthropicAnalysis(response);
  }

  return extractOpenAiAnalysis(response);
}

/**
 * Extract metadata from response
 * @param response - Raw API response
 * @returns Record<string, any> - Metadata object with usage stats and model info
 */
export function extractMetadata(response: any): Record<string, any> {
  const usage = response.usage || {};
  return {
    model: response.model,
    usage: {
      input_tokens: usage.prompt_tokens || usage.input_tokens,
      output_tokens: usage.completion_tokens || usage.output_tokens,
    },
    finish_reason: response.choices?.[0]?.finish_reason || response.stop_reason,
  };
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
  return getHeaders(provider, apiKey, customHeaders);
}
