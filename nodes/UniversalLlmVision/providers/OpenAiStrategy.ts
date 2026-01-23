/**
 * OpenAI Compatible Provider Strategy
 * Handles requests/responses for OpenAI and compatible providers
 * (OpenRouter, Groq, Grok, Gemini)
 */

import { BaseProviderStrategy, type ProviderRequestOptions, type ModelInfo } from './IProviderStrategy';

export class OpenAiStrategy extends BaseProviderStrategy {
  name = 'openai';
  displayName = 'OpenAI';
  baseUrl = 'https://api.openai.com/v1';
  apiEndpoint = '/chat/completions';
  requestFormat = 'openai' as const;
  responseFormat = 'openai' as const;
  supportsImageDetail = true;
  supportsJsonResponse = true;
  documentationUrl = 'https://platform.openai.com/docs';

  buildHeaders(apiKey: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  buildRequestBody(options: ProviderRequestOptions): Record<string, any> {
    const { model, prompt, image, imageDetail, temperature, maxTokens, topP, systemPrompt, responseFormat, additionalParameters } = options;

    const body: any = {
      model,
    };

    if (temperature !== undefined) body.temperature = temperature;
    if (maxTokens !== undefined) body.max_tokens = maxTokens;
    if (topP !== undefined) body.top_p = topP;

    if (responseFormat && this.supportsJsonResponse) {
      body.response_format = { type: responseFormat };
    }

    const messages: any[] = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    const userContent: any[] = [
      {
        type: 'text',
        text: prompt,
      },
    ];

    if (image.source === 'url') {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: image.data,
          ...(this.supportsImageDetail && imageDetail ? { detail: imageDetail } : {}),
        },
      });
    } else {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${image.mimeType};base64,${image.data}`,
          ...(this.supportsImageDetail && imageDetail ? { detail: imageDetail } : {}),
        },
      });
    }

    messages.push({
      role: 'user',
      content: userContent,
    });

    body.messages = messages;

    if (additionalParameters) {
      Object.assign(body, additionalParameters);
    }

    return body;
  }

  extractAnalysis(response: any): string {
    return response.choices?.[0]?.message?.content || '';
  }

  extractMetadata(response: any): Record<string, any> {
    const usage = response.usage || {};
    return {
      model: response.model,
      usage: {
        input_tokens: usage.prompt_tokens || usage.input_tokens,
        output_tokens: usage.completion_tokens || usage.output_tokens,
      },
      finish_reason: response.choices?.[0]?.finish_reason,
    };
  }

  getModelsEndpoint(): string {
    return '/models';
  }

  parseModelsResponse(response: any): ModelInfo[] {
    const models = response.data || [];
    
    // Sort by creation date (newest first)
    const sortedModels = [...models].sort((a: any, b: any) => {
      const dateA = a.created || 0;
      const dateB = b.created || 0;
      return dateB - dateA; // Descending order (newest first)
    });
    
    // Return only model IDs - no filtering or additional metadata
    return sortedModels.map((model: any) => ({
      id: model.id,
      name: model.id,
      description: model.id,
    }));
  }
}

export class OpenRouterStrategy extends OpenAiStrategy {
  name = 'openrouter';
  displayName = 'OpenRouter';
  baseUrl = 'https://openrouter.ai/api/v1';
  apiEndpoint = '/chat/completions';
  documentationUrl = 'https://openrouter.ai/docs';

  buildHeaders(apiKey: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/alejandrosnz/n8n-nodes-universal-llm-vision',
      'X-Title': 'Universal LLM Vision n8n Node',
    };
  }

  getModelsEndpoint(): string {
    return '/models';
  }

  parseModelsResponse(response: any): ModelInfo[] {
    const models = response.data || [];
    
    // Sort models alphabetically by name for better UX
    const sortedModels = [...models].sort((a: any, b: any) => {
      const nameA = (a.id || '').toLowerCase();
      const nameB = (b.id || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    // Return only model IDs - no filtering or additional metadata
    return sortedModels.map((model: any) => ({
      id: model.id,
      name: model.id,
      description: model.id,
    }));
  }
}

export class GroqStrategy extends OpenAiStrategy {
  name = 'groq';
  displayName = 'Groq';
  baseUrl = 'https://api.groq.com/openai/v1';
  apiEndpoint = '/chat/completions';
  documentationUrl = 'https://console.groq.com/docs';
}

export class GrokStrategy extends OpenAiStrategy {
  name = 'grok';
  displayName = 'Grok (X.AI)';
  baseUrl = 'https://api.x.ai/v1';
  apiEndpoint = '/chat/completions';
  documentationUrl = 'https://docs.x.ai';
}

export class GeminiStrategy extends OpenAiStrategy {
  name = 'gemini';
  displayName = 'Google Gemini';
  baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/';
  apiEndpoint = '/chat/completions';
  documentationUrl = 'https://ai.google.dev/gemini-api/docs/openai';
}

export class CustomOpenAiStrategy extends OpenAiStrategy {
  name = 'custom';
  displayName = 'Custom Provider (OpenAI Compatible)';
  baseUrl = '';
  apiEndpoint = '/chat/completions';

  constructor(baseUrl: string = '') {
    super();
    this.baseUrl = baseUrl;
  }
}
