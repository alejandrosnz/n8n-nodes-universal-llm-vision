/**
 * Unit tests for getModels() loadOptions method
 * Tests the dropdown population logic including error handling and fallback scenarios
 */

import type { ILoadOptionsFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { UniversalLlmVision } from '../../../nodes/UniversalLlmVision/UniversalLlmVision.node';

describe('UniversalLlmVision Node - LoadOptions', () => {
  let node: UniversalLlmVision;

  beforeEach(() => {
    node = new UniversalLlmVision();
  });

  describe('getModels()', () => {
    it('should successfully fetch and format models for OpenAI provider', async () => {
      // Mock models.dev API response
      const mockResponse = {
        'openai': {
          id: 'openai',
          name: 'OpenAI',
          models: {
            'gpt-4o': {
              id: 'gpt-4o',
              name: 'GPT-4o',
              release_date: '2024-05-13',
              cost: { input: 2.5, output: 10 },
              modalities: { input: ['text', 'image'], output: ['text'] },
            },
            'gpt-4-turbo': {
              id: 'gpt-4-turbo',
              name: 'GPT-4 Turbo',
              release_date: '2024-01-25',
              cost: { input: 10, output: 30 },
              modalities: { input: ['text', 'image'], output: ['text'] },
            },
          },
        },
      };

      // Mock ILoadOptionsFunctions
      const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
        getCredentials: jest.fn().mockResolvedValue({
          provider: 'openai',
          apiKey: 'test-api-key',
        }),
        helpers: {
          httpRequest: jest.fn().mockResolvedValue(mockResponse),
        } as any,
      };

      // Call getModels
      const result = await node.methods?.loadOptions?.getModels?.call(
        mockLoadOptionsFunctions as ILoadOptionsFunctions,
      );

      // Verify results
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result?.[0]).toMatchObject({
        name: 'OpenAI: GPT-4o',
        value: 'gpt-4o',
        description: '$2.5 / $10 per 1M tokens (gpt-4o)',
      });
      expect(result?.[1]).toMatchObject({
        name: 'OpenAI: GPT-4 Turbo',
        value: 'gpt-4-turbo',
        description: '$10 / $30 per 1M tokens (gpt-4-turbo)',
      });
    });

    it('should filter models by provider (Anthropic)', async () => {
      // Mock models.dev API response with multiple providers
      const mockResponse = {
        'openai': {
          id: 'openai',
          name: 'OpenAI',
          models: {
            'gpt-4o': {
              id: 'gpt-4o',
              name: 'GPT-4o',
              release_date: '2024-05-13',
              cost: { input: 2.5, output: 10 },
              modalities: { input: ['text', 'image'], output: ['text'] },
            },
          },
        },
        'anthropic': {
          id: 'anthropic',
          name: 'Anthropic',
          models: {
            'claude-3-5-sonnet-20241022': {
              id: 'claude-3-5-sonnet-20241022',
              name: 'Claude 3.5 Sonnet',
              release_date: '2024-10-22',
              cost: { input: 3, output: 15 },
              modalities: { input: ['text', 'image'], output: ['text'] },
            },
          },
        },
      };

      const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
        getCredentials: jest.fn().mockResolvedValue({
          provider: 'anthropic',
          apiKey: 'test-api-key',
        }),
        helpers: {
          httpRequest: jest.fn().mockResolvedValue(mockResponse),
        } as any,
      };

      const result = await node.methods?.loadOptions?.getModels?.call(
        mockLoadOptionsFunctions as ILoadOptionsFunctions,
      );

      // Should only return Anthropic models
      expect(result).toHaveLength(1);
      expect(result?.[0]).toMatchObject({
        name: 'Anthropic: Claude 3.5 Sonnet',
        value: 'claude-3-5-sonnet-20241022',
      });
    });

    it('should handle models.dev API down (network error)', async () => {
      const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
        getCredentials: jest.fn().mockResolvedValue({
          provider: 'openai',
          apiKey: 'test-api-key',
        }),
        helpers: {
          httpRequest: jest.fn().mockRejectedValue(new Error('ECONNREFUSED: Connection refused')),
        } as any,
      };

      const result = await node.methods?.loadOptions?.getModels?.call(
        mockLoadOptionsFunctions as ILoadOptionsFunctions,
      );

      // Should return error message as option
      expect(result).toHaveLength(1);
      expect(result?.[0].name).toContain('Error loading models');
      expect(result?.[0].value).toBe('');
      expect(result?.[0].description).toContain('Manual Model ID');
    });

    it('should handle timeout error from models.dev API', async () => {
      const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
        getCredentials: jest.fn().mockResolvedValue({
          provider: 'openai',
          apiKey: 'test-api-key',
        }),
        helpers: {
          httpRequest: jest.fn().mockRejectedValue(new Error('Request timeout after 15000ms')),
        } as any,
      };

      const result = await node.methods?.loadOptions?.getModels?.call(
        mockLoadOptionsFunctions as ILoadOptionsFunctions,
      );

      // Should return error message with timeout info
      expect(result).toHaveLength(1);
      expect(result?.[0].name).toContain('Error loading models');
      expect(result?.[0].description).toContain('timeout');
      expect(result?.[0].description).toContain('Manual Model ID');
    });

    it('should handle empty models array (no vision models for provider)', async () => {
      // Mock response with provider that has no vision-capable models
      const mockResponse = {
        'custom-provider': {
          id: 'custom-provider',
          name: 'Custom Provider',
          models: {
            'text-model': {
              id: 'text-model',
              name: 'Text Only Model',
              modalities: { input: ['text'], output: ['text'] }, // No image support
            },
          },
        },
      };

      const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
        getCredentials: jest.fn().mockResolvedValue({
          provider: 'custom-provider',
          apiKey: 'test-api-key',
        }),
        helpers: {
          httpRequest: jest.fn().mockResolvedValue(mockResponse),
        } as any,
      };

      const result = await node.methods?.loadOptions?.getModels?.call(
        mockLoadOptionsFunctions as ILoadOptionsFunctions,
      );

      // Should return "No models found" message
      expect(result).toHaveLength(1);
      expect(result?.[0].name).toContain('No models found');
      expect(result?.[0].value).toBe('');
      expect(result?.[0].description).toContain('Manual Model ID');
    });

    describe('Custom Provider Model Fetching', () => {
      it('should successfully fetch models from custom provider /models endpoint', async () => {
        // Mock OpenAI-compatible /models response
        const mockModelsResponse = {
          data: [
            {
              id: 'llama-3-70b-vision',
              object: 'model',
              created: 1709856000,
              owned_by: 'custom',
            },
            {
              id: 'gpt-4-vision',
              object: 'model',
              created: 1699488000,
              owned_by: 'custom',
            },
          ],
        };

        const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
          getCredentials: jest.fn().mockResolvedValue({
            provider: 'custom',
            apiKey: 'test-custom-key',
            baseUrl: 'https://custom.api.com/v1',
          }),
          helpers: {
            httpRequest: jest.fn().mockResolvedValue(mockModelsResponse),
          } as any,
        };

        const result = await node.methods?.loadOptions?.getModels?.call(
          mockLoadOptionsFunctions as ILoadOptionsFunctions,
        );

        // Should return models from custom provider
        expect(result).toHaveLength(2);
        expect(result?.[0].value).toBe('llama-3-70b-vision');
        expect(result?.[1].value).toBe('gpt-4-vision');
        expect(mockLoadOptionsFunctions.helpers?.httpRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            url: expect.stringContaining('/models'),
            timeout: 10000,
          }),
        );
      });

      it('should show error message when custom provider /models endpoint fails', async () => {
        const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
          getCredentials: jest.fn().mockResolvedValue({
            provider: 'custom',
            apiKey: 'test-custom-key',
            baseUrl: 'https://custom.api.com/v1',
          }),
          helpers: {
            httpRequest: jest.fn().mockRejectedValue(new Error('Network timeout')),
          } as any,
        };

        const result = await node.methods?.loadOptions?.getModels?.call(
          mockLoadOptionsFunctions as ILoadOptionsFunctions,
        );

        // Should return error message with Manual Model ID instruction
        expect(result).toHaveLength(1);
        expect(result?.[0].name).toContain('Could not fetch models from custom provider');
        expect(result?.[0].value).toBe('');
        expect(result?.[0].description).toContain('Manual Model ID');
        expect(result?.[0].description).toContain('Network timeout');
      });

      it('should handle custom provider with invalid response structure', async () => {
        const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
          getCredentials: jest.fn().mockResolvedValue({
            provider: 'custom',
            apiKey: 'test-custom-key',
            baseUrl: 'https://custom.api.com/v1',
          }),
          helpers: {
            httpRequest: jest.fn().mockResolvedValue({ invalid: 'response' }), // Invalid structure
          } as any,
        };

        const result = await node.methods?.loadOptions?.getModels?.call(
          mockLoadOptionsFunctions as ILoadOptionsFunctions,
        );

        // Should return error or empty models message
        expect(result).toHaveLength(1);
        expect(result?.[0].value).toBe('');
        expect(result?.[0].description).toContain('Manual Model ID');
      });
    });

    it('should handle malformed JSON response from models.dev', async () => {
      const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
        getCredentials: jest.fn().mockResolvedValue({
          provider: 'openai',
          apiKey: 'test-api-key',
        }),
        helpers: {
          httpRequest: jest.fn().mockResolvedValue(null), // Invalid response
        } as any,
      };

      const result = await node.methods?.loadOptions?.getModels?.call(
        mockLoadOptionsFunctions as ILoadOptionsFunctions,
      );

      // Should return "No models found" for invalid response
      expect(result).toHaveLength(1);
      expect(result?.[0].name).toContain('No models found');
      expect(result?.[0].value).toBe('');
    });

    it('should handle missing modalities field gracefully', async () => {
      const mockResponse = {
        'openai': {
          id: 'openai',
          name: 'OpenAI',
          models: {
            'model-without-modalities': {
              id: 'model-without-modalities',
              name: 'Model Without Modalities',
              release_date: '2024-01-01',
              // No modalities field
            },
            'gpt-4o': {
              id: 'gpt-4o',
              name: 'GPT-4o',
              release_date: '2024-05-13',
              cost: { input: 2.5, output: 10 },
              modalities: { input: ['text', 'image'], output: ['text'] },
            },
          },
        },
      };

      const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
        getCredentials: jest.fn().mockResolvedValue({
          provider: 'openai',
          apiKey: 'test-api-key',
        }),
        helpers: {
          httpRequest: jest.fn().mockResolvedValue(mockResponse),
        } as any,
      };

      const result = await node.methods?.loadOptions?.getModels?.call(
        mockLoadOptionsFunctions as ILoadOptionsFunctions,
      );

      // Should only return model with proper modalities
      expect(result).toHaveLength(1);
      expect(result?.[0].value).toBe('gpt-4o');
    });

    it('should retry on transient network failure and succeed on second attempt', async () => {
      const mockResponse = {
        'openai': {
          id: 'openai',
          name: 'OpenAI',
          models: {
            'gpt-4o': {
              id: 'gpt-4o',
              name: 'GPT-4o',
              release_date: '2024-05-13',
              cost: { input: 2.5, output: 10 },
              modalities: { input: ['text', 'image'], output: ['text'] },
            },
          },
        },
      };

      // Mock httpRequest to fail once, then succeed
      let callCount = 0;
      const mockHttpRequest = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(mockResponse);
      });

      const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
        getCredentials: jest.fn().mockResolvedValue({
          provider: 'openai',
          apiKey: 'test-api-key',
        }),
        helpers: {
          httpRequest: mockHttpRequest,
        } as any,
      };

      const result = await node.methods?.loadOptions?.getModels?.call(
        mockLoadOptionsFunctions as ILoadOptionsFunctions,
      );

      // Should successfully return models after retry
      expect(result).toHaveLength(1);
      expect(result?.[0].value).toBe('gpt-4o');
      expect(mockHttpRequest).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    it('should fail after all retry attempts are exhausted', async () => {
      // Mock httpRequest to always fail
      const mockHttpRequest = jest.fn().mockRejectedValue(new Error('Persistent network error'));

      const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
        getCredentials: jest.fn().mockResolvedValue({
          provider: 'openai',
          apiKey: 'test-api-key',
        }),
        helpers: {
          httpRequest: mockHttpRequest,
        } as any,
      };

      const result = await node.methods?.loadOptions?.getModels?.call(
        mockLoadOptionsFunctions as ILoadOptionsFunctions,
      );

      // Should return error message after all retries
      expect(result).toHaveLength(1);
      expect(result?.[0].name).toContain('Error loading models');
      expect(mockHttpRequest).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle API rate limiting (429) error', async () => {
      const error: any = new Error('Too Many Requests');
      error.statusCode = 429;

      const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
        getCredentials: jest.fn().mockResolvedValue({
          provider: 'openai',
          apiKey: 'test-api-key',
        }),
        helpers: {
          httpRequest: jest.fn().mockRejectedValue(error),
        } as any,
      };

      const result = await node.methods?.loadOptions?.getModels?.call(
        mockLoadOptionsFunctions as ILoadOptionsFunctions,
      );

      // Should return error message for rate limiting
      expect(result).toHaveLength(1);
      expect(result?.[0].name).toContain('Error loading models');
      expect(result?.[0].description).toContain('Manual Model ID');
    });

    it('should handle credential detection failure', async () => {
      const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
        getCredentials: jest.fn().mockRejectedValue(new Error('Credentials not found')),
        helpers: {
          httpRequest: jest.fn(),
        } as any,
      };

      const result = await node.methods?.loadOptions?.getModels?.call(
        mockLoadOptionsFunctions as ILoadOptionsFunctions,
      );

      // Should return error message
      expect(result).toHaveLength(1);
      expect(result?.[0].name).toContain('Error loading models');
      expect(result?.[0].description).toContain('Credentials not found');
    });

    it('should pass timeout configuration to httpRequest', async () => {
      const mockResponse = {
        'openai': {
          id: 'openai',
          name: 'OpenAI',
          models: {
            'gpt-4o': {
              id: 'gpt-4o',
              name: 'GPT-4o',
              release_date: '2024-05-13',
              cost: { input: 2.5, output: 10 },
              modalities: { input: ['text', 'image'], output: ['text'] },
            },
          },
        },
      };

      const mockHttpRequest = jest.fn().mockResolvedValue(mockResponse);

      const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
        getCredentials: jest.fn().mockResolvedValue({
          provider: 'openai',
          apiKey: 'test-api-key',
        }),
        helpers: {
          httpRequest: mockHttpRequest,
        } as any,
      };

      await node.methods?.loadOptions?.getModels?.call(
        mockLoadOptionsFunctions as ILoadOptionsFunctions,
      );

      // Verify timeout was passed to httpRequest
      expect(mockHttpRequest).toHaveBeenCalled();
      const requestOptions = mockHttpRequest.mock.calls[0][0] as IHttpRequestOptions;
      expect(requestOptions.timeout).toBe(15000); // 15 seconds
    });

    it('should sort models by release date (newest first)', async () => {
      const mockResponse = {
        'openai': {
          id: 'openai',
          name: 'OpenAI',
          models: {
            'old-model': {
              id: 'old-model',
              name: 'Old Model',
              release_date: '2023-01-01',
              cost: { input: 1, output: 3 },
              modalities: { input: ['text', 'image'], output: ['text'] },
            },
            'new-model': {
              id: 'new-model',
              name: 'New Model',
              release_date: '2024-10-01',
              cost: { input: 2, output: 5 },
              modalities: { input: ['text', 'image'], output: ['text'] },
            },
            'newer-model': {
              id: 'newer-model',
              name: 'Newer Model',
              release_date: '2024-12-01',
              cost: { input: 3, output: 8 },
              modalities: { input: ['text', 'image'], output: ['text'] },
            },
          },
        },
      };

      const mockLoadOptionsFunctions: Partial<ILoadOptionsFunctions> = {
        getCredentials: jest.fn().mockResolvedValue({
          provider: 'openai',
          apiKey: 'test-api-key',
        }),
        helpers: {
          httpRequest: jest.fn().mockResolvedValue(mockResponse),
        } as any,
      };

      const result = await node.methods?.loadOptions?.getModels?.call(
        mockLoadOptionsFunctions as ILoadOptionsFunctions,
      );

      // Verify models are sorted by date (newest first)
      expect(result).toHaveLength(3);
      expect(result?.[0].value).toBe('newer-model'); // 2024-12-01
      expect(result?.[1].value).toBe('new-model'); // 2024-10-01
      expect(result?.[2].value).toBe('old-model'); // 2023-01-01
    });
  });
});
