/**
 * Model loading utilities for dropdown population
 * Handles fetching models from different sources (models.dev API, provider APIs)
 */

import type { INodePropertyOptions } from 'n8n-workflow';
import type { ModelInfo } from '../providers/IProviderStrategy';
import type { CredentialInfo } from './GenericFunctions';
import { fetchAllVisionModels, fetchProviderModels } from './GenericFunctions';

/**
 * Error message option for when no models are found
 */
const NO_MODELS_OPTION: INodePropertyOptions = {
  name: '⚠️ No models found for this provider',
  value: '',
  description: 'Add "Manual Model ID" in Advanced Options and enter the model ID directly (e.g., gpt-4-vision, claude-3-opus)',
};

/**
 * Error message option for models.dev API failures
 */
function getModelsDevErrorOption(error: Error): INodePropertyOptions {
  return {
    name: '⚠️ Error loading models from models.dev',
    value: '',
    description: `${error.message}. Add "Manual Model ID" in Advanced Options and enter the model ID directly (e.g., gpt-4-vision, claude-3-opus)`,
  };
}

/**
 * Error message option for custom provider failures
 */
function getCustomProviderErrorOption(error: Error): INodePropertyOptions {
  return {
    name: '⚠️ Could not fetch models from custom provider',
    value: '',
    description: `${error.message}. Use "Manual Model ID" in Advanced Options to enter the model ID directly (e.g., gpt-4-vision-preview).`,
  };
}

/**
 * Convert ModelInfo array to INodePropertyOptions array
 */
function modelsToOptions(models: ModelInfo[]): INodePropertyOptions[] {
  return models.map((model) => ({
    name: model.name,
    value: model.id,
    description: model.description,
  }));
}

/**
 * Fetch models from custom provider's API endpoint
 * @param credInfo - Credential information including provider, apiKey, and customBaseUrl
 * @param httpRequest - HTTP request function from n8n context
 * @returns Promise<INodePropertyOptions[]> - Array of model options or error message
 */
async function fetchCustomProviderModels(
  credInfo: CredentialInfo,
  httpRequest: (requestOptions: any) => Promise<any>,
): Promise<INodePropertyOptions[]> {
  const { provider, apiKey, customBaseUrl } = credInfo;

  if (!customBaseUrl) {
    return [NO_MODELS_OPTION];
  }

  try {
    const models = await fetchProviderModels(
      provider,
      apiKey,
      customBaseUrl,
      httpRequest,
    );

    if (models.length > 0) {
      return modelsToOptions(models);
    }

    return [NO_MODELS_OPTION];
  } catch (error) {
    return [getCustomProviderErrorOption(error as Error)];
  }
}

/**
 * Fetch models from models.dev API for known providers
 * @param provider - Provider name (openai, anthropic, etc.)
 * @param httpRequest - HTTP request function from n8n context
 * @returns Promise<INodePropertyOptions[]> - Array of model options or error message
 */
async function fetchKnownProviderModels(
  provider: string,
  httpRequest: (requestOptions: any) => Promise<any>,
): Promise<INodePropertyOptions[]> {
  try {
    const models = await fetchAllVisionModels(httpRequest, provider);

    if (models.length === 0) {
      return [NO_MODELS_OPTION];
    }

    return modelsToOptions(models);
  } catch (error) {
    return [getModelsDevErrorOption(error as Error)];
  }
}

/**
 * Load models for dropdown based on provider type
 * Routes to custom provider API or models.dev depending on configuration
 * @param credInfo - Credential information including provider and baseUrl
 * @param httpRequest - HTTP request function from n8n context
 * @returns Promise<INodePropertyOptions[]> - Array of model options for dropdown
 */
export async function loadModelsForDropdown(
  credInfo: CredentialInfo,
  httpRequest: (requestOptions: any) => Promise<any>,
): Promise<INodePropertyOptions[]> {
  const { provider } = credInfo;

  // For custom providers, attempt to fetch from their API (requires baseUrl)
  if (provider === 'custom') {
    return fetchCustomProviderModels(credInfo, httpRequest);
  }

  // For known providers, use models.dev API
  return fetchKnownProviderModels(provider, httpRequest);
}
