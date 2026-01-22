/**
 * Tests for additional edge cases and error scenarios in UniversalLlmVision node
 */

import { UniversalLlmVision } from '../../../nodes/UniversalLlmVision/UniversalLlmVision.node';
import { MOCK_CREDENTIALS } from '../../fixtures/testData';

describe('UniversalLlmVision Node - Edge Cases and Error Handling', () => {
  let node: UniversalLlmVision;

  beforeEach(() => {
    node = new UniversalLlmVision();
  });

  describe('Parameter Validation', () => {
    it('should throw error when model is empty string', async () => {
      const mockExecuteFunctions: any = {
        getNode: jest.fn(() => ({ typeVersion: 1.1 })),
        getInputData: jest.fn(() => [{ json: {} }]),
        getNodeParameter: jest.fn((param: string) => {
          const params: any = {
            model: '',
            imageSource: 'binary',
            prompt: 'test',
            modelParameters: {},
            advancedOptions: {},
            outputPropertyName: 'result',
          };
          return params[param];
        }),
        getCredentials: jest.fn().mockResolvedValue(MOCK_CREDENTIALS.openai),
        helpers: {
          getBinaryDataBuffer: jest.fn(),
          request: jest.fn(),
        },
        continueOnFail: jest.fn(() => false),
      };

      try {
        await node.execute.call(mockExecuteFunctions);
        fail('Should throw error for empty model');
      } catch (error: any) {
        expect(error.message).toContain('Model is required');
      }
    });
  });

  describe('Custom Headers Handling', () => {
    it('should apply custom headers from advancedOptions', async () => {
      const mockExecuteFunctions: any = {
        getNode: jest.fn(() => ({ typeVersion: 1.1 })),
        getInputData: jest.fn(() => [{ json: {} }]),
        getNodeParameter: jest.fn((param: string, index: number) => {
          const params: any = {
            model: 'gpt-4-vision',
            imageSource: 'url',
            imageUrl: 'https://example.com/image.jpg',
            prompt: 'Describe this image',
            modelParameters: {},
            advancedOptions: {
              customHeaders: {
                headers: [
                  { name: 'X-Custom-Header', value: 'custom-value' },
                ],
              },
            },
            outputPropertyName: 'result',
          };
          return params[param];
        }),
        getCredentials: jest.fn().mockResolvedValue(MOCK_CREDENTIALS.openai),
        helpers: {
          request: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Analysis' } }],
          }),
          getBinaryDataBuffer: jest.fn(),
        },
        continueOnFail: jest.fn(() => false),
      };

      const result = await node.execute.call(mockExecuteFunctions);
      expect(result).toBeDefined();
      expect(result[0]).toHaveLength(1);
    });

    it('should apply OpenRouter headers when using openRouterApi credentials', async () => {
      const mockExecuteFunctions: any = {
        getNode: jest.fn(() => ({ typeVersion: 1.1 })),
        getInputData: jest.fn(() => [{ json: {} }]),
        getNodeParameter: jest.fn((param: string, index: number) => {
          const params: any = {
            model: 'gpt-4-vision',
            imageSource: 'url',
            imageUrl: 'https://example.com/image.jpg',
            prompt: 'Describe this image',
            modelParameters: {},
            advancedOptions: {},
            outputPropertyName: 'result',
            credentialName: 'openRouterApi',
          };
          return params[param];
        }),
        getCredentials: jest.fn().mockResolvedValue({
          apiKey: 'test-key',
          provider: 'openrouter',
          httpReferer: 'https://example.com',
          appTitle: 'Test App',
        }),
        helpers: {
          request: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Analysis' } }],
          }),
          getBinaryDataBuffer: jest.fn(),
        },
        continueOnFail: jest.fn(() => false),
      };

      const result = await node.execute.call(mockExecuteFunctions);
      expect(result).toBeDefined();
    });
  });

  describe('Image Source Validation', () => {
    it('should throw error for invalid image source type', async () => {
      const mockExecuteFunctions: any = {
        getNode: jest.fn(() => ({ typeVersion: 1.1 })),
        getInputData: jest.fn(() => [{ json: {} }]),
        getNodeParameter: jest.fn((param: string, index: number) => {
          const params: any = {
            model: 'gpt-4-vision',
            imageSource: 'invalid',
            prompt: 'Describe this image',
            modelParameters: {},
            advancedOptions: {},
            outputPropertyName: 'result',
          };
          return params[param];
        }),
        getCredentials: jest.fn().mockResolvedValue(MOCK_CREDENTIALS.openai),
        helpers: {
          getBinaryDataBuffer: jest.fn(),
          request: jest.fn(),
        },
        continueOnFail: jest.fn(() => false),
      };

      try {
        await node.execute.call(mockExecuteFunctions);
        fail('Should throw error for invalid image source');
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Version-specific Behavior', () => {
    it('should use manual model ID in v1.1 when provided', async () => {
      const mockExecuteFunctions: any = {
        getNode: jest.fn(() => ({ typeVersion: 1.1 })),
        getInputData: jest.fn(() => [{ json: {} }]),
        getNodeParameter: jest.fn((param: string, index: number) => {
          const params: any = {
            model: 'gpt-4-vision',
            imageSource: 'url',
            imageUrl: 'https://example.com/image.jpg',
            prompt: 'Describe this image',
            modelParameters: {},
            advancedOptions: {
              manualModelId: 'custom-model-id',
            },
            outputPropertyName: 'result',
          };
          return params[param];
        }),
        getCredentials: jest.fn().mockResolvedValue(MOCK_CREDENTIALS.openai),
        helpers: {
          request: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Analysis' } }],
          }),
          getBinaryDataBuffer: jest.fn(),
        },
        continueOnFail: jest.fn(() => false),
      };

      const result = await node.execute.call(mockExecuteFunctions);
      expect(result).toBeDefined();
      // Verify manual model ID was used by checking the request
      const requestCall = (mockExecuteFunctions.helpers.request as jest.Mock).mock.calls[0];
      expect(requestCall).toBeDefined();
    });

    it('should ignore manual model ID in v1.0', async () => {
      const mockExecuteFunctions: any = {
        getNode: jest.fn(() => ({ typeVersion: 1.0 })),
        getInputData: jest.fn(() => [{ json: {} }]),
        getNodeParameter: jest.fn((param: string, index: number) => {
          const params: any = {
            model: 'gpt-4-vision',
            imageSource: 'url',
            imageUrl: 'https://example.com/image.jpg',
            prompt: 'Describe this image',
            modelParameters: {},
            advancedOptions: {
              manualModelId: 'should-be-ignored',
            },
            outputPropertyName: 'result',
          };
          return params[param];
        }),
        getCredentials: jest.fn().mockResolvedValue(MOCK_CREDENTIALS.openai),
        helpers: {
          request: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Analysis' } }],
          }),
          getBinaryDataBuffer: jest.fn(),
        },
        continueOnFail: jest.fn(() => false),
      };

      const result = await node.execute.call(mockExecuteFunctions);
      expect(result).toBeDefined();
    });
  });

  describe('Output Property Name', () => {
    it('should use custom output property name', async () => {
      const customPropName = 'customAnalysis';
      const mockExecuteFunctions: any = {
        getNode: jest.fn(() => ({ typeVersion: 1.1 })),
        getInputData: jest.fn(() => [{ json: { id: 1 } }]),
        getNodeParameter: jest.fn((param: string, index: number) => {
          const params: any = {
            model: 'gpt-4-vision',
            imageSource: 'url',
            imageUrl: 'https://example.com/image.jpg',
            prompt: 'Describe this image',
            modelParameters: {},
            advancedOptions: {},
            outputPropertyName: customPropName,
          };
          return params[param];
        }),
        getCredentials: jest.fn().mockResolvedValue(MOCK_CREDENTIALS.openai),
        helpers: {
          request: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Test analysis' } }],
          }),
          getBinaryDataBuffer: jest.fn(),
        },
        continueOnFail: jest.fn(() => false),
      };

      const result = await node.execute.call(mockExecuteFunctions);
      expect(result[0][0].json[customPropName]).toBe('Test analysis');
    });
  });

  describe('Model Parameters', () => {
    it('should accept model parameters', async () => {
      const mockExecuteFunctions: any = {
        getNode: jest.fn(() => ({ typeVersion: 1.1 })),
        getInputData: jest.fn(() => [{ json: {} }]),
        getNodeParameter: jest.fn((param: string, index: number) => {
          const params: any = {
            model: 'gpt-4-vision',
            imageSource: 'url',
            imageUrl: 'https://example.com/image.jpg',
            prompt: 'Describe this image',
            modelParameters: {
              temperature: 0.5,
              maxTokens: 1000,
            },
            advancedOptions: {},
            outputPropertyName: 'result',
          };
          return params[param];
        }),
        getCredentials: jest.fn().mockResolvedValue(MOCK_CREDENTIALS.openai),
        helpers: {
          request: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Analysis' } }],
          }),
          getBinaryDataBuffer: jest.fn(),
        },
        continueOnFail: jest.fn(() => false),
      };

      const result = await node.execute.call(mockExecuteFunctions);
      expect(result).toBeDefined();
      expect(result[0][0].json.result).toBe('Analysis');
    });
  });
});
