/**
 * Provider Strategy Registry and Factory
 * Manages all provider strategies and provides factory methods
 */

import type { IProviderStrategy } from './IProviderStrategy';
import {
  OpenAiStrategy,
  OpenRouterStrategy,
  GroqStrategy,
  GrokStrategy,
  GeminiStrategy,
  CustomOpenAiStrategy,
} from './OpenAiStrategy';
import { AnthropicStrategy } from './AnthropicStrategy';

/**
 * Provider registry mapping provider names to their strategy classes
 */
const PROVIDER_STRATEGIES: Record<string, new (baseUrl?: string) => IProviderStrategy> = {
  openai: OpenAiStrategy,
  openrouter: OpenRouterStrategy,
  groq: GroqStrategy,
  grok: GrokStrategy,
  gemini: GeminiStrategy,
  anthropic: AnthropicStrategy,
  custom: CustomOpenAiStrategy,
};

/**
 * Get provider strategy instance
 * @param providerName - Name of the provider
 * @param customBaseUrl - Optional custom base URL for custom providers
 * @returns IProviderStrategy - Strategy instance for the provider
 */
export function getProviderStrategy(providerName: string, customBaseUrl?: string): IProviderStrategy {
  const normalizedName = (providerName || 'openai').toLowerCase();
  const StrategyClass = PROVIDER_STRATEGIES[normalizedName] || CustomOpenAiStrategy;

  if (normalizedName === 'custom' && customBaseUrl) {
    return new StrategyClass(customBaseUrl);
  }

  return new StrategyClass();
}

/**
 * Get all available provider options for UI dropdowns
 * @returns Array of provider options with names and values
 */
export function getProviderOptions() {
  return [
    { name: 'OpenAI', value: 'openai', description: 'https://platform.openai.com/docs' },
    { name: 'OpenRouter', value: 'openrouter', description: 'https://openrouter.ai/docs' },
    { name: 'Groq', value: 'groq', description: 'https://console.groq.com/docs' },
    { name: 'Grok (X.AI)', value: 'grok', description: 'https://docs.x.ai' },
    { name: 'Google Gemini', value: 'gemini', description: 'https://ai.google.dev/gemini-api/docs/openai' },
    { name: 'Anthropic', value: 'anthropic', description: 'https://docs.anthropic.com' },
    { name: 'Custom Provider', value: 'custom', description: 'Configure a custom endpoint' },
  ];
}

/**
 * Get strategy by provider name (alias for getProviderStrategy)
 * @param providerName - Name of the provider
 * @param customBaseUrl - Optional custom base URL
 * @returns IProviderStrategy - Strategy instance
 */
export function getProvider(providerName: string, customBaseUrl?: string): IProviderStrategy {
  return getProviderStrategy(providerName, customBaseUrl);
}
