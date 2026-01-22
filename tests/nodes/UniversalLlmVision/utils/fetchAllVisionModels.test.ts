/**
 * Unit tests for fetchAllVisionModels function
 * Tests the new models.dev API integration for fetching vision-capable models
 */

import { fetchAllVisionModels } from '../../../../nodes/UniversalLlmVision/utils/GenericFunctions';

describe('fetchAllVisionModels', () => {
  // Mock response data based on models.dev API structure
  const mockModelsDevResponse = {
    'openai': {
      id: 'openai',
      name: 'OpenAI',
      env: ['OPENAI_API_KEY'],
      npm: '@ai-sdk/openai',
      doc: 'https://platform.openai.com/docs',
      models: {
        'gpt-4o': {
          id: 'gpt-4o',
          name: 'GPT-4o',
          attachment: true,
          reasoning: false,
          tool_call: true,
          structured_output: true,
          temperature: true,
          knowledge: '2023-10',
          release_date: '2024-05-13',
          last_updated: '2024-08-06',
          open_weights: false,
          cost: {
            input: 2.5,
            output: 10,
          },
          limit: {
            context: 128000,
            input: 124000,
            output: 16384,
          },
          modalities: {
            input: ['text', 'image', 'audio'],
            output: ['text'],
          },
        },
        'gpt-4-turbo': {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          attachment: true,
          reasoning: false,
          tool_call: true,
          structured_output: true,
          temperature: true,
          knowledge: '2023-12',
          release_date: '2024-04-09',
          last_updated: '2024-04-09',
          open_weights: false,
          cost: {
            input: 10,
            output: 30,
          },
          limit: {
            context: 128000,
            input: 124000,
            output: 4096,
          },
          modalities: {
            input: ['text', 'image'],
            output: ['text'],
          },
        },
        'gpt-4o-mini': {
          id: 'gpt-4o-mini',
          name: 'GPT-4o mini',
          attachment: true,
          reasoning: false,
          tool_call: true,
          structured_output: true,
          temperature: true,
          knowledge: '2023-10',
          release_date: '2024-07-18',
          last_updated: '2024-07-18',
          open_weights: false,
          cost: {
            input: 0.15,
            output: 0.6,
          },
          limit: {
            context: 128000,
            input: 124000,
            output: 16384,
          },
          modalities: {
            input: ['text', 'image'],
            output: ['text'],
          },
        },
        'text-davinci-003': {
          id: 'text-davinci-003',
          name: 'Text Davinci 003',
          attachment: false,
          reasoning: false,
          tool_call: false,
          structured_output: false,
          temperature: true,
          knowledge: '2021-06',
          release_date: '2022-11-28',
          last_updated: '2022-11-28',
          open_weights: false,
          cost: {
            input: 20,
            output: 20,
          },
          limit: {
            context: 4097,
            input: 4097,
            output: 4097,
          },
          modalities: {
            input: ['text'],
            output: ['text'],
          },
        },
      },
    },
    'anthropic': {
      id: 'anthropic',
      name: 'Anthropic',
      env: ['ANTHROPIC_API_KEY'],
      npm: '@ai-sdk/anthropic',
      doc: 'https://docs.anthropic.com',
      models: {
        'claude-3-5-sonnet-20241022': {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          attachment: true,
          reasoning: false,
          tool_call: true,
          structured_output: false,
          temperature: true,
          knowledge: '2024-04',
          release_date: '2024-10-22',
          last_updated: '2024-10-22',
          open_weights: false,
          cost: {
            input: 3,
            output: 15,
          },
          limit: {
            context: 200000,
            input: 200000,
            output: 8192,
          },
          modalities: {
            input: ['text', 'image', 'pdf'],
            output: ['text'],
          },
        },
      },
    },
  };

  it('should fetch and parse vision-capable models from models.dev API', async () => {
    const mockHttpRequest = jest.fn().mockResolvedValue(mockModelsDevResponse);

    const result = await fetchAllVisionModels(mockHttpRequest);

    // Verify HTTP request was made correctly
    expect(mockHttpRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://models.dev/api.json',
      headers: {
        'Accept': 'application/json',
      },
      json: true,
    });

    // Should return only models with image input support (4 models)
    expect(result).toHaveLength(4);

    // Verify all returned models support image input
    const modelIds = result.map(m => m.id);
    expect(modelIds).toContain('gpt-4o');
    expect(modelIds).toContain('gpt-4-turbo');
    expect(modelIds).toContain('gpt-4o-mini');
    expect(modelIds).toContain('claude-3-5-sonnet-20241022');

    // text-davinci-003 should NOT be included (no image support)
    expect(modelIds).not.toContain('text-davinci-003');
  });

  it('should filter models by provider when providerFilter is provided', async () => {
    const mockHttpRequest = jest.fn().mockResolvedValue(mockModelsDevResponse);

    // Filter only OpenAI models
    const result = await fetchAllVisionModels(mockHttpRequest, 'openai');

    // Should return only OpenAI models with image support (3 models)
    expect(result).toHaveLength(3);

    // Verify all returned models are from OpenAI, sorted by release_date newest first
    // gpt-4o-mini: 2024-07-18
    // gpt-4o: 2024-05-13
    // gpt-4-turbo: 2024-04-09
    const modelIds = result.map(m => m.id);
    expect(modelIds).toEqual([
      'gpt-4o-mini',
      'gpt-4o',
      'gpt-4-turbo',
    ]);

    // Should not include Anthropic models
    expect(modelIds).not.toContain('claude-3-5-sonnet-20241022');
  });

  it('should filter models by Anthropic provider', async () => {
    const mockHttpRequest = jest.fn().mockResolvedValue(mockModelsDevResponse);

    // Filter only Anthropic models
    const result = await fetchAllVisionModels(mockHttpRequest, 'anthropic');

    // Should return only Anthropic models with image support (1 model)
    expect(result).toHaveLength(1);

    // Verify all returned models are from Anthropic
    const modelIds = result.map(m => m.id);
    expect(modelIds).toEqual(['claude-3-5-sonnet-20241022']);

    // Should not include OpenAI models
    const openaiModels = modelIds.filter(m => m.includes('openai'));
    expect(openaiModels).toHaveLength(0);
  });

  it('should format model info correctly', async () => {
    const mockHttpRequest = jest.fn().mockResolvedValue(mockModelsDevResponse);

    const result = await fetchAllVisionModels(mockHttpRequest);

    // Find the GPT-4o model
    const gpt4o = result.find(m => m.id === 'gpt-4o');

    expect(gpt4o).toBeDefined();
    expect(gpt4o!.name).toBe('OpenAI: GPT-4o');
    expect(gpt4o!.description).toBe('$2.5 / $10 per 1M tokens (gpt-4o)');
  });

  it('should sort models by release_date newest first', async () => {
    const mockHttpRequest = jest.fn().mockResolvedValue(mockModelsDevResponse);

    const result = await fetchAllVisionModels(mockHttpRequest);

    // Verify models are sorted by date (newest first)
    // gpt-4o-mini: 2024-07-18
    // gpt-4-turbo: 2024-04-09
    // gpt-4o: 2024-05-13
    // claude-3-5-sonnet: 2024-10-22

    expect(result[0].id).toBe('claude-3-5-sonnet-20241022'); // 2024-10-22
    expect(result[1].id).toBe('gpt-4o-mini'); // 2024-07-18
    expect(result[2].id).toBe('gpt-4o'); // 2024-05-13
    expect(result[3].id).toBe('gpt-4-turbo'); // 2024-04-09
  });

  it('should handle models without complete metadata', async () => {
    const incompleteResponse = {
      'test-provider': {
        id: 'test-provider',
        name: 'Test Provider',
        models: {
          'incomplete-model': {
            id: 'incomplete-model',
            name: 'Incomplete Model',
            modalities: {
              input: ['image', 'text'],
            },
            // Missing cost and limit fields
          },
        },
      },
    };

    const mockHttpRequest = jest.fn().mockResolvedValue(incompleteResponse);

    const result = await fetchAllVisionModels(mockHttpRequest);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('incomplete-model');
    expect(result[0].description).toBe('$0 / $0 per 1M tokens (incomplete-model)');
  });

  it('should skip providers without models', async () => {
    const emptyProviderResponse = {
      'empty-provider': {
        id: 'empty-provider',
        name: 'Empty Provider',
        models: {},
      },
    };

    const mockHttpRequest = jest.fn().mockResolvedValue(emptyProviderResponse);

    const result = await fetchAllVisionModels(mockHttpRequest);

    expect(result).toHaveLength(0);
  });

  it('should skip models without image input support', async () => {
    const textOnlyResponse = {
      'text-provider': {
        id: 'text-provider',
        name: 'Text Provider',
        models: {
          'text-only-model': {
            id: 'text-only-model',
            name: 'Text Only Model',
            modalities: {
              input: ['text'],
              output: ['text'],
            },
          },
        },
      },
    };

    const mockHttpRequest = jest.fn().mockResolvedValue(textOnlyResponse);

    const result = await fetchAllVisionModels(mockHttpRequest);

    expect(result).toHaveLength(0);
  });

  it('should throw error when API request fails', async () => {
    const mockHttpRequest = jest.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetchAllVisionModels(mockHttpRequest)).rejects.toThrow(
      'Failed to fetch models from models.dev API: Network error'
    );
  });

  it('should throw error when API request fails with provider filter', async () => {
    const mockHttpRequest = jest.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetchAllVisionModels(mockHttpRequest, 'openai')).rejects.toThrow(
      'Failed to fetch models from models.dev API: Network error'
    );
  });

  it('should handle invalid response structure gracefully', async () => {
    const mockHttpRequest = jest.fn().mockResolvedValue(null);

    const result = await fetchAllVisionModels(mockHttpRequest);

    expect(result).toHaveLength(0);
  });

  it('should handle models with missing modalities field', async () => {
    const noModalitiesResponse = {
      'test-provider': {
        id: 'test-provider',
        name: 'Test Provider',
        models: {
          'no-modalities': {
            id: 'no-modalities',
            name: 'No Modalities Model',
            // Missing modalities field entirely
          },
        },
      },
    };

    const mockHttpRequest = jest.fn().mockResolvedValue(noModalitiesResponse);

    const result = await fetchAllVisionModels(mockHttpRequest);

    // Should not include model without modalities
    expect(result).toHaveLength(0);
  });

  it('should create correct provider/model ID format', async () => {
    const mockHttpRequest = jest.fn().mockResolvedValue(mockModelsDevResponse);

    const result = await fetchAllVisionModels(mockHttpRequest);

    // Verify ID format is just the model ID without provider prefix
    // and provider field contains the provider name
    result.forEach(model => {
      expect(model.id).toBeTruthy();
      expect(model.id).not.toMatch(/^[a-z]+\//); // Should NOT start with provider/
      expect(model.provider).toBeTruthy(); // Should have provider field
      expect(typeof model.provider).toBe('string');
    });
  });
});
