import { extractAnalysis, extractMetadata } from '../utils/GenericFunctions';

/**
 * ResponseProcessor class handles API response parsing and result formatting
 * Extracts analysis text and optional metadata from LLM provider responses
 */
export class ResponseProcessor {
  /**
   * Process API response and format the final result
   * @param response - The raw API response from the LLM provider
   * @param provider - The provider name (e.g., 'openai', 'anthropic')
   * @param includeMetadata - Whether to include usage stats and metadata in the output
   * @param outputPropertyName - The property name for the analysis result (default: 'analysis')
   * @returns Object with analysis and optional metadata
   */
  processResponse(
    response: any,
    provider: string,
    includeMetadata: boolean,
    outputPropertyName: string
  ): Record<string, any> {
    // Extract the main analysis text from the response
    const analysis = extractAnalysis(provider, response);

    if (includeMetadata) {
      // Include analysis and metadata at the top level
      return {
        [outputPropertyName]: analysis,
        metadata: extractMetadata(response),
      };
    } else {
      // Return only the analysis text
      return {
        [outputPropertyName]: analysis,
      };
    }
  }
}