import { OpenAiStrategy, OpenRouterStrategy, GroqStrategy } from '../../../../nodes/UniversalLlmVision/providers/OpenAiStrategy';
import { AnthropicStrategy } from '../../../../nodes/UniversalLlmVision/providers/AnthropicStrategy';
import { getProviderStrategy, getProviderOptions } from '../../../../nodes/UniversalLlmVision/providers/ProviderRegistry';
import type { ProviderRequestOptions } from '../../../../nodes/UniversalLlmVision/providers/IProviderStrategy';

describe('Provider Strategies', () => {
  const mockImage = {
    data: 'base64data',
    mimeType: 'image/jpeg',
    size: 1024,
    source: 'base64' as const,
  };

  const mockRequestOptions: ProviderRequestOptions = {
    model: 'gpt-4-vision',
    prompt: 'Describe this image',
    image: mockImage,
    temperature: 0.7,
    maxTokens: 1024,
  };

  describe('OpenAiStrategy', () => {
    let strategy: OpenAiStrategy;

    beforeEach(() => {
      strategy = new OpenAiStrategy();
    });

    it('should have correct properties', () => {
      expect(strategy.name).toBe('openai');
      expect(strategy.displayName).toBe('OpenAI');
      expect(strategy.baseUrl).toBe('https://api.openai.com/v1');
      expect(strategy.apiEndpoint).toBe('/chat/completions');
      expect(strategy.requestFormat).toBe('openai');
      expect(strategy.responseFormat).toBe('openai');
      expect(strategy.supportsImageDetail).toBe(true);
      expect(strategy.supportsJsonResponse).toBe(true);
    });

    it('should build correct headers with API key', () => {
      const headers = strategy.buildHeaders('test-key-123');
      expect(headers.Authorization).toBe('Bearer test-key-123');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should get correct API URL', () => {
      const url = strategy.getApiUrl();
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
    });

    it('should override URL with custom base URL', () => {
      const url = strategy.getApiUrl('https://custom.api.com/v1');
      expect(url).toBe('https://custom.api.com/v1/chat/completions');
    });

    it('should build OpenAI-format request body', () => {
      const body = strategy.buildRequestBody(mockRequestOptions);
      expect(body.model).toBe('gpt-4-vision');
      expect(body.temperature).toBe(0.7);
      expect(body.max_tokens).toBe(1024);
      expect(body.messages).toBeDefined();
      expect(body.messages[0].role).toBe('user');
      expect(body.messages[0].content).toBeInstanceOf(Array);
    });

    it('should handle URL images in request body', () => {
      const urlImage = { ...mockImage, source: 'url' as const, data: 'https://example.com/image.jpg' };
      const options = { ...mockRequestOptions, image: urlImage };
      const body = strategy.buildRequestBody(options);
      const content = body.messages[0].content;
      const imageContent = content.find((c: any) => c.type === 'image_url');
      expect(imageContent.image_url.url).toBe('https://example.com/image.jpg');
    });

    it('should extract analysis from OpenAI response', () => {
      const response = {
        choices: [{ message: { content: 'This is an analysis' } }],
      };
      expect(strategy.extractAnalysis(response)).toBe('This is an analysis');
    });

    it('should extract metadata from response', () => {
      const response = {
        model: 'gpt-4-vision',
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
        },
        choices: [{ finish_reason: 'stop' }],
      };
      const metadata = strategy.extractMetadata(response);
      expect(metadata.model).toBe('gpt-4-vision');
      expect(metadata.usage.input_tokens).toBe(100);
      expect(metadata.usage.output_tokens).toBe(50);
      expect(metadata.finish_reason).toBe('stop');
    });
  });

  describe('OpenRouterStrategy', () => {
    let strategy: OpenRouterStrategy;

    beforeEach(() => {
      strategy = new OpenRouterStrategy();
    });

    it('should have OpenRouter-specific properties', () => {
      expect(strategy.name).toBe('openrouter');
      expect(strategy.displayName).toBe('OpenRouter');
      expect(strategy.baseUrl).toBe('https://openrouter.ai/api/v1');
    });

    it('should include OpenRouter headers', () => {
      const headers = strategy.buildHeaders('test-key');
      expect(headers['HTTP-Referer']).toBe('https://github.com/alejandrosnz/n8n-nodes-universal-llm-vision');
      expect(headers['X-Title']).toBe('Universal LLM Vision n8n Node');
    });
  });

  describe('GroqStrategy', () => {
    let strategy: GroqStrategy;

    beforeEach(() => {
      strategy = new GroqStrategy();
    });

    it('should have Groq-specific properties', () => {
      expect(strategy.name).toBe('groq');
      expect(strategy.displayName).toBe('Groq');
      expect(strategy.baseUrl).toBe('https://api.groq.com/openai/v1');
    });
  });

  describe('AnthropicStrategy', () => {
    let strategy: AnthropicStrategy;

    beforeEach(() => {
      strategy = new AnthropicStrategy();
    });

    it('should have correct properties', () => {
      expect(strategy.name).toBe('anthropic');
      expect(strategy.displayName).toBe('Anthropic');
      expect(strategy.baseUrl).toBe('https://api.anthropic.com/v1');
      expect(strategy.apiEndpoint).toBe('/messages');
      expect(strategy.requestFormat).toBe('anthropic');
      expect(strategy.responseFormat).toBe('anthropic');
      expect(strategy.supportsImageDetail).toBe(false);
      expect(strategy.supportsJsonResponse).toBe(false);
    });

    it('should build correct headers with API key', () => {
      const headers = strategy.buildHeaders('test-key-123');
      expect(headers['x-api-key']).toBe('test-key-123');
      expect(headers['anthropic-version']).toBe('2023-06-01');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should build Anthropic-format request body', () => {
      const body = strategy.buildRequestBody(mockRequestOptions);
      expect(body.model).toBe('gpt-4-vision');
      expect(body.temperature).toBe(0.7);
      expect(body.max_tokens).toBe(1024);
      expect(body.messages).toBeDefined();
      expect(body.messages[0].role).toBe('user');
      expect(body.messages[0].content).toBeInstanceOf(Array);
    });

    it('should handle image content format for Anthropic', () => {
      const body = strategy.buildRequestBody(mockRequestOptions);
      const content = body.messages[0].content;
      const imageContent = content.find((c: any) => c.type === 'image');
      expect(imageContent.type).toBe('image');
      expect(imageContent.source.type).toBe('base64');
      expect(imageContent.source.media_type).toBe('image/jpeg');
    });

    it('should extract analysis from Anthropic response', () => {
      const response = {
        content: [{ text: 'Anthropic analysis' }],
      };
      expect(strategy.extractAnalysis(response)).toBe('Anthropic analysis');
    });

    it('should extract metadata from Anthropic response', () => {
      const response = {
        model: 'claude-3-sonnet',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
        stop_reason: 'end_turn',
      };
      const metadata = strategy.extractMetadata(response);
      expect(metadata.model).toBe('claude-3-sonnet');
      expect(metadata.usage.input_tokens).toBe(100);
      expect(metadata.usage.output_tokens).toBe(50);
      expect(metadata.finish_reason).toBe('end_turn');
    });
  });

  describe('Provider Registry', () => {
    it('should get OpenAI strategy by default', () => {
      const strategy = getProviderStrategy('openai');
      expect(strategy.name).toBe('openai');
    });

    it('should get Anthropic strategy', () => {
      const strategy = getProviderStrategy('anthropic');
      expect(strategy.name).toBe('anthropic');
    });

    it('should get OpenRouter strategy', () => {
      const strategy = getProviderStrategy('openrouter');
      expect(strategy.name).toBe('openrouter');
    });

    it('should return default OpenAI for unknown provider', () => {
      const strategy = getProviderStrategy('unknown-provider');
      expect(strategy.name).toBe('custom');
    });

    it('should support custom base URL for custom provider', () => {
      const strategy = getProviderStrategy('custom', 'https://custom.api.com/v1');
      expect(strategy.baseUrl).toBe('https://custom.api.com/v1');
    });

    it('should provide provider options for UI', () => {
      const options = getProviderOptions();
      expect(options.length).toBeGreaterThan(0);
      expect(options.map((o: any) => o.value)).toContain('openai');
      expect(options.map((o: any) => o.value)).toContain('anthropic');
      expect(options.map((o: any) => o.value)).toContain('openrouter');
    });
  });
});
