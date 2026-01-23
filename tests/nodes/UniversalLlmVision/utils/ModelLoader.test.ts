/**
 * Unit tests for ModelLoader utility
 * Tests model loading logic for both custom and known providers
 */

import { loadModelsForDropdown } from '../../../../nodes/UniversalLlmVision/utils/ModelLoader';
import type { CredentialInfo } from '../../../../nodes/UniversalLlmVision/utils/GenericFunctions';
import * as GenericFunctions from '../../../../nodes/UniversalLlmVision/utils/GenericFunctions';

// Mock the GenericFunctions module
jest.mock('../../../../nodes/UniversalLlmVision/utils/GenericFunctions', () => ({
  fetchAllVisionModels: jest.fn(),
  fetchProviderModels: jest.fn(),
}));

describe('ModelLoader', () => {
  let mockHttpRequest: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpRequest = jest.fn();
  });

  describe('loadModelsForDropdown()', () => {
    describe('Custom Provider', () => {
      it('should fetch models from custom provider API successfully', async () => {
        const credInfo: CredentialInfo = {
          credentials: {
            provider: 'custom',
            apiKey: 'test-key',
            baseUrl: 'https://custom.api.com/v1',
          },
          credentialName: 'universalLlmVisionApi',
          provider: 'custom',
          apiKey: 'test-key',
          customBaseUrl: 'https://custom.api.com/v1',
        };

        const mockModels = [
          { id: 'model-1', name: 'Model 1', description: 'First model' },
          { id: 'model-2', name: 'Model 2', description: 'Second model' },
        ];

        (GenericFunctions.fetchProviderModels as jest.Mock).mockResolvedValue(mockModels);

        const result = await loadModelsForDropdown(credInfo, mockHttpRequest);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          name: 'Model 1',
          value: 'model-1',
          description: 'First model',
        });
        expect(result[1]).toEqual({
          name: 'Model 2',
          value: 'model-2',
          description: 'Second model',
        });
        expect(GenericFunctions.fetchProviderModels).toHaveBeenCalledWith(
          'custom',
          'test-key',
          'https://custom.api.com/v1',
          mockHttpRequest,
        );
      });

      it('should return error option when custom provider API fails', async () => {
        const credInfo: CredentialInfo = {
          credentials: {
            provider: 'custom',
            apiKey: 'test-key',
            baseUrl: 'https://custom.api.com/v1',
          },
          credentialName: 'universalLlmVisionApi',
          provider: 'custom',
          apiKey: 'test-key',
          customBaseUrl: 'https://custom.api.com/v1',
        };

        (GenericFunctions.fetchProviderModels as jest.Mock).mockRejectedValue(
          new Error('Connection timeout'),
        );

        const result = await loadModelsForDropdown(credInfo, mockHttpRequest);

        expect(result).toHaveLength(1);
        expect(result[0].name).toContain('Could not fetch models from custom provider');
        expect(result[0].value).toBe('');
        expect(result[0].description).toContain('Connection timeout');
        expect(result[0].description).toContain('Manual Model ID');
      });

      it('should return no models option when custom provider returns empty array', async () => {
        const credInfo: CredentialInfo = {
          credentials: {
            provider: 'custom',
            apiKey: 'test-key',
            baseUrl: 'https://custom.api.com/v1',
          },
          credentialName: 'universalLlmVisionApi',
          provider: 'custom',
          apiKey: 'test-key',
          customBaseUrl: 'https://custom.api.com/v1',
        };

        (GenericFunctions.fetchProviderModels as jest.Mock).mockResolvedValue([]);

        const result = await loadModelsForDropdown(credInfo, mockHttpRequest);

        expect(result).toHaveLength(1);
        expect(result[0].name).toContain('No models found');
        expect(result[0].value).toBe('');
        expect(result[0].description).toContain('Manual Model ID');
      });

      it('should return no models option when customBaseUrl is not provided', async () => {
        const credInfo: CredentialInfo = {
          credentials: {
            provider: 'custom',
            apiKey: 'test-key',
          },
          credentialName: 'universalLlmVisionApi',
          provider: 'custom',
          apiKey: 'test-key',
          customBaseUrl: undefined,
        };

        const result = await loadModelsForDropdown(credInfo, mockHttpRequest);

        expect(result).toHaveLength(1);
        expect(result[0].name).toContain('No models found');
        expect(result[0].value).toBe('');
        expect(GenericFunctions.fetchProviderModels).not.toHaveBeenCalled();
      });
    });

    describe('Known Providers', () => {
      it('should fetch models from models.dev for OpenAI provider', async () => {
        const credInfo: CredentialInfo = {
          credentials: {
            provider: 'openai',
            apiKey: 'test-key',
          },
          credentialName: 'universalLlmVisionApi',
          provider: 'openai',
          apiKey: 'test-key',
        };

        const mockModels = [
          { id: 'gpt-4o', name: 'GPT-4o', description: 'GPT-4 Omni model' },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'GPT-4 Turbo model' },
        ];

        (GenericFunctions.fetchAllVisionModels as jest.Mock).mockResolvedValue(mockModels);

        const result = await loadModelsForDropdown(credInfo, mockHttpRequest);

        expect(result).toHaveLength(2);
        expect(result[0].value).toBe('gpt-4o');
        expect(result[1].value).toBe('gpt-4-turbo');
        expect(GenericFunctions.fetchAllVisionModels).toHaveBeenCalledWith(
          mockHttpRequest,
          'openai',
        );
      });

      it('should return no models option when models.dev returns empty array', async () => {
        const credInfo: CredentialInfo = {
          credentials: {
            provider: 'anthropic',
            apiKey: 'test-key',
          },
          credentialName: 'universalLlmVisionApi',
          provider: 'anthropic',
          apiKey: 'test-key',
        };

        (GenericFunctions.fetchAllVisionModels as jest.Mock).mockResolvedValue([]);

        const result = await loadModelsForDropdown(credInfo, mockHttpRequest);

        expect(result).toHaveLength(1);
        expect(result[0].name).toContain('No models found');
        expect(result[0].value).toBe('');
      });

      it('should return error option when models.dev API fails', async () => {
        const credInfo: CredentialInfo = {
          credentials: {
            provider: 'openai',
            apiKey: 'test-key',
          },
          credentialName: 'universalLlmVisionApi',
          provider: 'openai',
          apiKey: 'test-key',
        };

        (GenericFunctions.fetchAllVisionModels as jest.Mock).mockRejectedValue(
          new Error('API rate limit exceeded'),
        );

        const result = await loadModelsForDropdown(credInfo, mockHttpRequest);

        expect(result).toHaveLength(1);
        expect(result[0].name).toContain('Error loading models from models.dev');
        expect(result[0].value).toBe('');
        expect(result[0].description).toContain('API rate limit exceeded');
        expect(result[0].description).toContain('Manual Model ID');
      });

      it('should handle Groq provider correctly', async () => {
        const credInfo: CredentialInfo = {
          credentials: {
            provider: 'groq',
            apiKey: 'test-key',
          },
          credentialName: 'universalLlmVisionApi',
          provider: 'groq',
          apiKey: 'test-key',
        };

        const mockModels = [
          { id: 'llama-vision', name: 'Llama Vision', description: 'Vision model' },
        ];

        (GenericFunctions.fetchAllVisionModels as jest.Mock).mockResolvedValue(mockModels);

        const result = await loadModelsForDropdown(credInfo, mockHttpRequest);

        expect(result).toHaveLength(1);
        expect(result[0].value).toBe('llama-vision');
        expect(GenericFunctions.fetchAllVisionModels).toHaveBeenCalledWith(
          mockHttpRequest,
          'groq',
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle custom provider with baseUrl but without custom in provider name', async () => {
        const credInfo: CredentialInfo = {
          credentials: {
            provider: 'openai',
            apiKey: 'test-key',
            baseUrl: 'https://custom.openai.com',
          },
          credentialName: 'universalLlmVisionApi',
          provider: 'openai',
          apiKey: 'test-key',
          customBaseUrl: 'https://custom.openai.com',
        };

        const mockModels = [
          { id: 'model-1', name: 'Model 1', description: 'Test model' },
        ];

        (GenericFunctions.fetchAllVisionModels as jest.Mock).mockResolvedValue(mockModels);

        const result = await loadModelsForDropdown(credInfo, mockHttpRequest);

        // Should use models.dev because provider !== 'custom'
        expect(result).toHaveLength(1);
        expect(GenericFunctions.fetchAllVisionModels).toHaveBeenCalledWith(
          mockHttpRequest,
          'openai',
        );
        expect(GenericFunctions.fetchProviderModels).not.toHaveBeenCalled();
      });
    });
  });
});
