import type { IExecuteFunctions } from 'n8n-workflow';
import type { PreparedImage } from '../processors/ImageProcessor';
import { buildRequest, getHeadersWithAuth } from '../utils/GenericFunctions';

/**
 * RequestHandler class manages API request building and execution
 * Handles different LLM providers with their specific request formats and authentication
 */
export class RequestHandler {
  private executeFunctions: IExecuteFunctions;

  constructor(executeFunctions: IExecuteFunctions) {
    this.executeFunctions = executeFunctions;
  }

  /**
   * Build and execute the API request to the LLM vision provider
   * @param provider - The provider name (e.g., 'openai', 'anthropic')
   * @param apiKey - The API key for authentication
   * @param customBaseUrl - Optional custom base URL for the API
   * @param customHeaders - Additional custom headers to include
   * @param model - The model identifier to use
   * @param preparedImage - The prepared image data
   * @param prompt - The text prompt for analysis
   * @param modelParameters - Optional model parameters (temperature, maxTokens, etc.)
   * @param advancedOptions - Advanced options like system prompt and response format
   * @returns Promise<any> - The raw API response from the provider
   * @throws Error if the request fails or times out
   */
  async executeRequest(
    provider: string,
    apiKey: string,
    customBaseUrl: string | undefined,
    customHeaders: Record<string, string>,
    model: string,
    preparedImage: PreparedImage,
    prompt: string,
    modelParameters: any,
    advancedOptions: any
  ): Promise<any> {
    // Build request options object with all parameters
    const requestOptions = {
      provider,
      model,
      prompt,
      image: preparedImage,
      imageDetail: modelParameters?.imageDetail,
      temperature: modelParameters?.temperature,
      maxTokens: modelParameters?.maxTokens,
      topP: modelParameters?.topP,
      systemPrompt: advancedOptions?.systemPrompt,
      responseFormat: advancedOptions?.responseFormat,
      additionalParameters: advancedOptions?.additionalParameters
        ? JSON.parse(advancedOptions.additionalParameters)
        : undefined,
    };

    // Build the request URL and body using provider-specific logic
    const { url, body } = buildRequest(requestOptions, customBaseUrl, customHeaders);

    // Get headers with API key authentication injected
    const headers = getHeadersWithAuth(provider, apiKey, customHeaders);

    // Execute the HTTP request with timeout and JSON parsing
    const response = await this.executeFunctions.helpers.request({
      method: 'POST',
      url,
      headers,
      body: JSON.stringify(body),
      json: true,
      timeout: 60000, // 60 second timeout for image processing
    });

    return response;
  }
}