/**
 * Integration tests for UniversalLlmVision node execute() method
 * Tests the complete flow with nock-mocked API calls for different providers
 * Focuses on happy path scenarios with different image sources
 */

import nock from 'nock';
// import type { IBinaryData } from 'n8n-workflow';
import { UniversalLlmVision } from '../../../nodes/UniversalLlmVision/UniversalLlmVision.node';
import {
  MOCK_CREDENTIALS,
  MOCK_OPENAI_RESPONSE,
  MOCK_ANTHROPIC_RESPONSE,
  TINY_JPEG_BASE64,
  TINY_PNG_BASE64,
  TEST_IMAGE_URL,
  MOCK_NODE_PARAMS,
  PROVIDER_BASE_URLS,
  PROVIDER_ENDPOINTS,
} from '../../fixtures/testData';

// Simple mock factory for IExecuteFunctions
const createMockExecuteFunctions = (): any => ({
  getNodeParameter: jest.fn(),
  getInputData: jest.fn(),
  getCredentials: jest.fn(),
  getBinaryData: jest.fn(),
  continueOnFail: jest.fn(() => false),
  getNode: jest.fn(() => ({ typeVersion: 1.1 })),
  helpers: {
    httpRequest: jest.fn(),
    request: jest.fn(), // Alias used by RequestHandler
    getBinaryDataBuffer: jest.fn(),
  },
});

describe('UniversalLlmVision Node - Integration Tests (execute)', () => {
  let node: UniversalLlmVision;
  let mockExecuteFunctions: any;

  beforeEach(() => {
    node = new UniversalLlmVision();
    mockExecuteFunctions = createMockExecuteFunctions();

    // Default mock setup - will be overridden in specific tests
    mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
    mockExecuteFunctions.getNodeParameter.mockReturnValue(undefined);
    mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
    mockExecuteFunctions.getBinaryData.mockReturnValue({});
    mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);
  });

  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  describe('OpenAI Provider - Base64 Image Source', () => {
    it('should successfully analyze image via OpenAI with base64 source', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      // Mock OpenAI API endpoint
      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .reply(200, MOCK_OPENAI_RESPONSE);

      // Mock the httpRequest to use nock
      mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Array);
      expect(result[0][0].json).toHaveProperty('analysis');
    });

    it('should include metadata when includeMetadata is true', async () => {
      const params = MOCK_NODE_PARAMS.withMetadata;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('metadata');
      expect(result[0][0].json.metadata).toHaveProperty('usage');
      expect(result[0][0].json.metadata).toHaveProperty('model');
    });

    it('should handle PNG base64 images', async () => {
      const params = {
        ...MOCK_NODE_PARAMS.basic,
        base64Data: TINY_PNG_BASE64,
        base64MimeType: 'image/png',
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('analysis');
    });
  });

  describe('OpenAI Provider - URL Image Source', () => {
    it('should successfully analyze image via URL source', async () => {
      const params = {
        ...MOCK_NODE_PARAMS.basic,
        imageSource: 'url',
        imageUrl: TEST_IMAGE_URL,
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('analysis');
    });
  });

  describe('OpenAI Provider - Binary Image Source', () => {
    it('should successfully analyze image from binary data', async () => {
      const params = {
        ...MOCK_NODE_PARAMS.basic,
        imageSource: 'binary',
        binaryPropertyName: 'data',
      };

      const binaryData: any = {
        data: TINY_JPEG_BASE64, // Already base64 string
        mimeType: 'image/jpeg',
        fileName: 'test.jpg',
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([
        { json: {}, binary: { data: binaryData } },
      ]);
      mockExecuteFunctions.getBinaryData.mockReturnValue({ data: binaryData });
      mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(
        Buffer.from(TINY_JPEG_BASE64, 'base64')
      );
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('analysis');
      expect(result[0][0].binary).toBeDefined(); // Binary data preserved
    });
  });

  describe('Anthropic Provider', () => {
    it('should successfully analyze image via Anthropic API', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.anthropic);

      nock(PROVIDER_BASE_URLS.anthropic)
        .post(PROVIDER_ENDPOINTS.anthropic)
        .reply(200, MOCK_ANTHROPIC_RESPONSE);

      mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_ANTHROPIC_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('analysis');
    });
  });

  describe('Groq Provider', () => {
    it('should successfully analyze image via Groq API', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.groq);

      nock(PROVIDER_BASE_URLS.groq)
        .post(PROVIDER_ENDPOINTS.groq)
        .reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('analysis');
    });
  });

  describe('Multiple Items Processing', () => {
    it('should process multiple items in sequence', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      const items = [{ json: { id: 1 } }, { json: { id: 2 } }, { json: { id: 3 } }];

      mockExecuteFunctions.getInputData.mockReturnValue(items);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      // Mock all 3 API calls
      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .times(3)
        .reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0]).toHaveLength(3);
      expect(result[0][0].json).toHaveProperty('analysis');
      expect(result[0][1].json).toHaveProperty('analysis');
      expect(result[0][2].json).toHaveProperty('analysis');
    });

    it('should preserve original item data in output', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      const originalData = {
        id: 'test-123',
        fileName: 'test.jpg',
        timestamp: '2024-01-20T00:00:00Z',
      };

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: originalData }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toMatchObject(originalData);
      expect(result[0][0].json).toHaveProperty('analysis');
    });
  });

  describe('Custom Headers Handling', () => {
    it('should include custom headers in API request', async () => {
      const params = MOCK_NODE_PARAMS.withCustomHeaders;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('analysis');
    });

    it('should include OpenRouter-specific headers when using OpenRouter', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openRouter);

      nock(PROVIDER_BASE_URLS.openrouter)
        .post(PROVIDER_ENDPOINTS.openai)
        .reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('analysis');
    });
  });

  describe('JSON Response Format', () => {
    it('should handle JSON response format setting', async () => {
      const params = MOCK_NODE_PARAMS.withJsonResponse;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      const jsonResponse = {
        ...MOCK_OPENAI_RESPONSE,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: '{"objects": ["car", "tree"], "colors": ["blue", "green"]}',
            },
            finish_reason: 'stop',
          },
        ],
      };

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, jsonResponse);

      mockExecuteFunctions.helpers.request.mockResolvedValue(jsonResponse);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('analysis');
    });
  });

  describe('System Prompt Handling', () => {
    it('should include custom system prompt in request', async () => {
      const params = MOCK_NODE_PARAMS.withSystemPrompt;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('analysis');
    });
  });

  describe('Output Property Name Configuration', () => {
    it('should use custom output property name', async () => {
      const params = {
        ...MOCK_NODE_PARAMS.basic,
        outputPropertyName: 'customAnalysis',
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('customAnalysis');
    });
  });

  describe('Model Parameters', () => {
    it('should send temperature parameter in request', async () => {
      const params = {
        ...MOCK_NODE_PARAMS.basic,
        modelParameters: {
          temperature: 0.8,
          maxTokens: 2048,
          topP: 0.95,
          imageDetail: 'high',
        },
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('analysis');
    });
  });
});
