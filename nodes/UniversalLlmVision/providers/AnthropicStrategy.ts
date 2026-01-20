/**
 * Anthropic Provider Strategy
 * Handles requests/responses for Anthropic Claude models
 */

import { BaseProviderStrategy, type ProviderRequestOptions } from './IProviderStrategy';

export class AnthropicStrategy extends BaseProviderStrategy {
  name = 'anthropic';
  displayName = 'Anthropic';
  baseUrl = 'https://api.anthropic.com/v1';
  apiEndpoint = '/messages';
  requestFormat = 'anthropic' as const;
  responseFormat = 'anthropic' as const;
  supportsImageDetail = false;
  supportsJsonResponse = false;
  documentationUrl = 'https://docs.anthropic.com';

  buildHeaders(apiKey: string): Record<string, string> {
    return {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    };
  }

  buildRequestBody(options: ProviderRequestOptions): Record<string, any> {
    const { model, prompt, image, temperature, maxTokens, topP, systemPrompt, additionalParameters } = options;

    const body: any = {
      model,
    };

    if (temperature !== undefined) body.temperature = temperature;
    if (maxTokens !== undefined) body.max_tokens = maxTokens;
    if (topP !== undefined) body.top_p = topP;

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const content: any[] = [];

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

    if (additionalParameters) {
      Object.assign(body, additionalParameters);
    }

    return body;
  }

  extractAnalysis(response: any): string {
    return response.content?.[0]?.text || '';
  }

  extractMetadata(response: any): Record<string, any> {
    const usage = response.usage || {};
    return {
      model: response.model,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
      },
      finish_reason: response.stop_reason,
    };
  }
}
