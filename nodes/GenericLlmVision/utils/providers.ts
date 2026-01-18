/**
 * Provider Configuration Module
 * Centralized management of all LLM vision providers, their APIs, authentication, and request/response formats
 */

export type ProviderType = 'openrouter' | 'groq' | 'grok' | 'openai' | 'anthropic' | 'custom';

export interface ProviderConfig {
  name: string;
  displayName: string;
  baseUrl: string;
  apiEndpoint: string;
  headers: (apiKey: string) => Record<string, string>;
  requestFormat: 'openai' | 'anthropic';
  responseFormat: 'openai' | 'anthropic';
  supportsImageDetail: boolean;
  supportsJsonResponse: boolean;
  documentationUrl?: string;
}

// Provider configurations
export const PROVIDERS: Record<ProviderType, ProviderConfig> = {
  openrouter: {
    name: 'openrouter',
    displayName: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiEndpoint: '/chat/completions',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://n8n.io',
      'X-Title': 'n8n-generic-llm-vision',
    }),
    requestFormat: 'openai',
    responseFormat: 'openai',
    supportsImageDetail: true,
    supportsJsonResponse: true,
    documentationUrl: 'https://openrouter.ai/docs',
  },
  groq: {
    name: 'groq',
    displayName: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiEndpoint: '/chat/completions',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    requestFormat: 'openai',
    responseFormat: 'openai',
    supportsImageDetail: true,
    supportsJsonResponse: true,
    documentationUrl: 'https://console.groq.com/docs',
  },
  grok: {
    name: 'grok',
    displayName: 'Grok (X.AI)',
    baseUrl: 'https://api.x.ai/v1',
    apiEndpoint: '/chat/completions',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    requestFormat: 'openai',
    responseFormat: 'openai',
    supportsImageDetail: true,
    supportsJsonResponse: true,
    documentationUrl: 'https://docs.x.ai',
  },
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiEndpoint: '/chat/completions',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    requestFormat: 'openai',
    responseFormat: 'openai',
    supportsImageDetail: true,
    supportsJsonResponse: true,
    documentationUrl: 'https://platform.openai.com/docs',
  },
  anthropic: {
    name: 'anthropic',
    displayName: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    apiEndpoint: '/messages',
    headers: (apiKey: string) => ({
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    }),
    requestFormat: 'anthropic',
    responseFormat: 'anthropic',
    supportsImageDetail: false,
    supportsJsonResponse: false,
    documentationUrl: 'https://docs.anthropic.com',
  },
  custom: {
    name: 'custom',
    displayName: 'Custom Provider',
    baseUrl: '', // Will be provided by user
    apiEndpoint: '/chat/completions', // Default, can be overridden
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    requestFormat: 'openai',
    responseFormat: 'openai',
    supportsImageDetail: true,
    supportsJsonResponse: true,
  },
};

/**
 * Get provider configuration
 * @param provider - Provider name or type
 * @returns ProviderConfig - Configuration object for the provider
 */
export function getProvider(provider: ProviderType | string): ProviderConfig {
  const normalizedProvider = (provider || 'openai').toLowerCase() as ProviderType;
  return PROVIDERS[normalizedProvider] || PROVIDERS.custom;
}

/**
 * Get complete API endpoint URL
 * @param provider - Provider name
 * @param baseUrl - Optional custom base URL
 * @returns string - Full API endpoint URL
 */
export function getApiUrl(provider: ProviderType | string, baseUrl?: string): string {
  const config = getProvider(provider);
  const base = baseUrl || config.baseUrl;
  return base.replace(/\/$/, '') + config.apiEndpoint;
}

/**
 * Get headers for provider
 * @param provider - Provider name
 * @param apiKey - API key (will be injected into headers)
 * @param customHeaders - Additional custom headers
 * @returns Record<string, string> - Complete headers object
 */
export function getHeaders(provider: ProviderType | string, apiKey: string, customHeaders?: Record<string, string>): Record<string, string> {
  const config = getProvider(provider);
  const headers = config.headers(apiKey);

  // Add custom headers
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  return headers;
}

/**
 * Get provider list for options
 * @returns Array of provider options for UI dropdown
 */
export function getProviderOptions() {
  return Object.values(PROVIDERS)
    .filter(p => p.name !== 'custom')
    .map(provider => ({
      name: provider.displayName,
      value: provider.name,
      description: provider.documentationUrl ? `Docs: ${provider.documentationUrl}` : undefined,
    }))
    .concat([
      {
        name: 'Custom Provider',
        value: 'custom',
        description: 'Configure a custom endpoint',
      },
    ]);
}