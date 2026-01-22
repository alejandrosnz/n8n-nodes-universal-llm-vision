/**
 * Provider Strategy Pattern Implementation
 * Defines the strategy interface for different LLM vision providers
 */

import type { PreparedImage } from '../processors/ImageProcessor';

/**
 * Request format type for strategies
 */
export type RequestFormatType = 'openai' | 'anthropic';

/**
 * Response format type for strategies
 */
export type ResponseFormatType = 'openai' | 'anthropic';

/**
 * Strategy interface for LLM vision providers
 * Defines common operations for different provider implementations
 */
export interface IProviderStrategy {
  /**
   * Provider name identifier
   */
  name: string;

  /**
   * Display name for UI
   */
  displayName: string;

  /**
   * Base API URL
   */
  baseUrl: string;

  /**
   * API endpoint path
   */
  apiEndpoint: string;

  /**
   * Request format (openai or anthropic)
   */
  requestFormat: RequestFormatType;

  /**
   * Response format (openai or anthropic)
   */
  responseFormat: ResponseFormatType;

  /**
   * Whether provider supports image detail parameter (low/high/auto)
   */
  supportsImageDetail: boolean;

  /**
   * Whether provider supports JSON response format
   */
  supportsJsonResponse: boolean;

  /**
   * Documentation URL
   */
  documentationUrl?: string;

  /**
   * Build authentication headers
   * @param apiKey - API key for authentication
   * @returns Record<string, string> - Headers object with authentication
   */
  buildHeaders(apiKey: string): Record<string, string>;

  /**
   * Get the full API endpoint URL
   * @param customBaseUrl - Optional custom base URL override
   * @returns string - Full API endpoint URL
   */
  getApiUrl(customBaseUrl?: string): string;

  /**
   * Build the request body for this provider
   * @param options - Request building options
   * @returns Record<string, any> - Provider-specific request body
   */
  buildRequestBody(options: ProviderRequestOptions): Record<string, any>;

  /**
   * Extract analysis text from provider response
   * @param response - Raw API response
   * @returns string - Extracted analysis text
   */
  extractAnalysis(response: any): string;

  /**
   * Extract metadata from provider response
   * @param response - Raw API response
   * @returns Record<string, any> - Metadata including usage stats
   */
  extractMetadata(response: any): Record<string, any>;

  /**
   * Get the models endpoint for fetching available models (optional)
   * @returns string | undefined - Models API endpoint path
   */
  getModelsEndpoint?(): string;

  /**
   * Filter models to only include vision-capable models (optional)
   * @param models - Array of model objects from API
   * @returns any[] - Filtered array of vision-capable models
   */
  filterVisionModels?(models: any[]): any[];

  /**
   * Parse models API response into standardized format (optional)
   * @param response - Raw API response from models endpoint
   * @returns ModelInfo[] - Parsed model information
   */
  parseModelsResponse?(response: any): ModelInfo[];
}

/**
 * Model information structure
 */
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  releaseDate?: string;
  provider?: string;
}

/**
 * Options for building provider-specific request bodies
 */
export interface ProviderRequestOptions {
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

/**
 * Base strategy class with common functionality
 * Provides default implementations for common operations
 */
export abstract class BaseProviderStrategy implements IProviderStrategy {
  abstract name: string;
  abstract displayName: string;
  abstract baseUrl: string;
  abstract apiEndpoint: string;
  abstract requestFormat: RequestFormatType;
  abstract responseFormat: ResponseFormatType;
  abstract supportsImageDetail: boolean;
  abstract supportsJsonResponse: boolean;
  documentationUrl?: string;

  /**
   * Default header building - override in subclasses for custom auth
   */
  buildHeaders(apiKey: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get full API URL
   */
  getApiUrl(customBaseUrl?: string): string {
    const base = customBaseUrl || this.baseUrl;
    return base.replace(/\/$/, '') + this.apiEndpoint;
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  abstract buildRequestBody(options: ProviderRequestOptions): Record<string, any>;
  abstract extractAnalysis(response: any): string;
  abstract extractMetadata(response: any): Record<string, any>;
}
