/**
 * Tests for Model Fetching functionality
 */

import { OpenAiStrategy, OpenRouterStrategy } from '../../../../nodes/UniversalLlmVision/providers/OpenAiStrategy';

describe('Model Fetching', () => {
  describe('OpenAiStrategy', () => {
    let strategy: OpenAiStrategy;

    beforeEach(() => {
      strategy = new OpenAiStrategy();
    });

    it('should have getModelsEndpoint method', () => {
      expect(strategy.getModelsEndpoint).toBeDefined();
      expect(strategy.getModelsEndpoint!()).toBe('/models');
    });

    it('should parse models response correctly', () => {
      const mockResponse = {
        data: [
          { id: 'gpt-4o', description: 'GPT-4 Omni', created: 1234567890 },
          { id: 'gpt-4-vision-preview', created: 1234567880 },
        ],
      };

      const parsed = strategy.parseModelsResponse!(mockResponse);

      expect(parsed).toHaveLength(2);
      // Models are sorted by creation date (newest first)
      expect(parsed[0].id).toBe('gpt-4o');
      expect(parsed[0].name).toBe('gpt-4o');
      expect(parsed[0].description).toBe('gpt-4o');
      expect(parsed[1].id).toBe('gpt-4-vision-preview');
      expect(parsed[1].name).toBe('gpt-4-vision-preview');
      expect(parsed[1].description).toBe('gpt-4-vision-preview');
    });
  });

  describe('OpenRouterStrategy', () => {
    let strategy: OpenRouterStrategy;

    beforeEach(() => {
      strategy = new OpenRouterStrategy();
    });

    it('should have getModelsEndpoint method', () => {
      expect(strategy.getModelsEndpoint).toBeDefined();
      expect(strategy.getModelsEndpoint!()).toBe('/models');
    });

    it('should parse OpenRouter models response', () => {
      const mockResponse = {
        data: [
          {
            id: 'anthropic/claude-3-5-sonnet',
            name: 'Claude 3.5 Sonnet',
            description: 'Most powerful Claude model',
            context_length: 200000,
          },
          {
            id: 'openai/gpt-4o',
            name: 'GPT-4o',
            context_length: 128000,
          },
        ],
      };

      const parsed = strategy.parseModelsResponse!(mockResponse);

      expect(parsed).toHaveLength(2);
      // Models are sorted alphabetically by ID
      expect(parsed[0].name).toBe('anthropic/claude-3-5-sonnet');
      expect(parsed[0].id).toBe('anthropic/claude-3-5-sonnet');
      expect(parsed[0].description).toBe('anthropic/claude-3-5-sonnet');
      expect(parsed[1].name).toBe('openai/gpt-4o');
      expect(parsed[1].id).toBe('openai/gpt-4o');
      expect(parsed[1].description).toBe('openai/gpt-4o');
    });
  });
});
