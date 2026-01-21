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

    it('should filter vision models correctly', () => {
      const mockModels = [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-4-vision-preview', name: 'GPT-4 Vision' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        { id: 'text-davinci-003', name: 'Davinci' },
      ];

      const filtered = strategy.filterVisionModels!(mockModels);

      // Now returns all models (no filtering)
      expect(filtered).toHaveLength(5);
      expect(filtered).toEqual(mockModels);
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

    it('should filter vision models with multimodal modality', () => {
      const mockModels = [
        {
          id: 'anthropic/claude-3-5-sonnet',
          architecture: { modality: 'multimodal' },
        },
        {
          id: 'openai/gpt-4o',
          architecture: { modality: 'multimodal' },
        },
        {
          id: 'meta-llama/llama-2-70b-chat',
          architecture: { modality: 'text' },
        },
      ];

      const filtered = strategy.filterVisionModels!(mockModels);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(m => m.id)).toEqual([
        'anthropic/claude-3-5-sonnet',
        'openai/gpt-4o',
      ]);
    });

    it('should filter vision models with vision parameter', () => {
      const mockModels = [
        {
          id: 'openai/gpt-4-vision-preview',
          supported_parameters: { vision: true },
        },
        {
          id: 'openai/gpt-3.5-turbo',
          supported_parameters: { vision: false },
        },
      ];

      const filtered = strategy.filterVisionModels!(mockModels);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('openai/gpt-4-vision-preview');
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
      // Models are sorted alphabetically by name
      expect(parsed[0].name).toBe('Claude 3.5 Sonnet');
      expect(parsed[0].id).toBe('anthropic/claude-3-5-sonnet');
      expect(parsed[0].description).toBe('anthropic/claude-3-5-sonnet');
      expect(parsed[1].name).toBe('GPT-4o');
      expect(parsed[1].id).toBe('openai/gpt-4o');
      expect(parsed[1].description).toBe('openai/gpt-4o');
    });
  });
});
