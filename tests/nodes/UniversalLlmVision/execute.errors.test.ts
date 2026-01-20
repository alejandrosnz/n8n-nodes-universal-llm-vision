/**
 * Error handling tests for UniversalLlmVision node execute() method
 * Tests various failure scenarios: API errors, validation errors, timeouts, etc.
 */

import nock from 'nock';
// import type { IExecuteFunctions } from 'n8n-workflow';
import { UniversalLlmVision } from '../../../nodes/UniversalLlmVision/UniversalLlmVision.node';
import {
  MOCK_CREDENTIALS,
  MOCK_ERROR_RESPONSES,
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
  helpers: {
    httpRequest: jest.fn(),
    request: jest.fn(), // Alias used by RequestHandler
    getBinaryDataBuffer: jest.fn(),
  },
});

describe('UniversalLlmVision Node - Error Handling Tests', () => {
  let node: UniversalLlmVision;
  let mockExecuteFunctions: any;

  beforeEach(() => {
    node = new UniversalLlmVision();
    mockExecuteFunctions = createMockExecuteFunctions();

    mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
    mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
    mockExecuteFunctions.getBinaryData.mockReturnValue({});
    mockExecuteFunctions.continueOnFail.mockReturnValue(false);
  });

  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  describe('API Authentication Errors', () => {
    it('should throw error on invalid API key (401)', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue({
        ...MOCK_CREDENTIALS.openai,
        apiKey: 'invalid-key',
      });

      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .reply(401, MOCK_ERROR_RESPONSES.UNAUTHORIZED.body);

      mockExecuteFunctions.helpers.request.mockRejectedValue({
        statusCode: 401,
        message: 'Invalid API key provided',
      });

      try {
        await node.execute.call(mockExecuteFunctions);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    });

    it('should handle 401 error with continueOnFail', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: { id: 'test' } }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .reply(401, MOCK_ERROR_RESPONSES.UNAUTHORIZED.body);

      mockExecuteFunctions.helpers.request.mockRejectedValue({
        statusCode: 401,
        message: 'Invalid API key provided',
      });

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toBeInstanceOf(Array);
      // With continueOnFail, error should be in output
      expect(result[0][0].json).toHaveProperty('error');
    });
  });

  describe('API Validation Errors', () => {
    it('should throw error on bad request (400)', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .reply(400, MOCK_ERROR_RESPONSES.BAD_REQUEST.body);

      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue({
        statusCode: 400,
        message: 'Request body is invalid',
      });

      try {
        await node.execute.call(mockExecuteFunctions);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    });

    it('should handle 400 error with continueOnFail', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: { id: 'test' } }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .reply(400, MOCK_ERROR_RESPONSES.BAD_REQUEST.body);

      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue({
        statusCode: 400,
        message: 'Request body is invalid',
      });

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('error');
    });
  });

  describe('Rate Limiting Errors', () => {
    it('should throw error on rate limit exceeded (429)', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .reply(429, MOCK_ERROR_RESPONSES.RATE_LIMIT.body);

      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue({
        statusCode: 429,
        message: 'Rate limit exceeded',
      });

      try {
        await node.execute.call(mockExecuteFunctions);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    });

    it('should handle 429 error with continueOnFail', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: { id: 'test' } }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .reply(429, MOCK_ERROR_RESPONSES.RATE_LIMIT.body);

      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue({
        statusCode: 429,
        message: 'Rate limit exceeded',
      });

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('error');
    });
  });

  describe('Server Errors', () => {
    it('should throw error on internal server error (500)', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .reply(500, MOCK_ERROR_RESPONSES.SERVER_ERROR.body);

      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue({
        statusCode: 500,
        message: 'Internal server error',
      });

      try {
        await node.execute.call(mockExecuteFunctions);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    });

    it('should throw error on service unavailable (503)', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .reply(503, MOCK_ERROR_RESPONSES.SERVICE_UNAVAILABLE.body);

      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue({
        statusCode: 503,
        message: 'Service temporarily unavailable',
      });

      try {
        await node.execute.call(mockExecuteFunctions);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    });

    it('should handle 500 error with continueOnFail', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: { id: 'test' } }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .reply(500, MOCK_ERROR_RESPONSES.SERVER_ERROR.body);

      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue({
        statusCode: 500,
        message: 'Internal server error',
      });

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('error');
    });
  });

  describe('Network Errors', () => {
    it('should throw error on network timeout', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).delayConnection(1000).reply(200);

      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'Request timeout',
      });

      try {
        await node.execute.call(mockExecuteFunctions);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    });

    it('should throw error on connection refused', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      try {
        await node.execute.call(mockExecuteFunctions);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    });

    it('should handle network error with continueOnFail', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: { id: 'test' } }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'Request timeout',
      });

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('error');
    });
  });

  describe('Partial Item Batch Failures', () => {
    it('should handle mixed success and failure in batch with continueOnFail', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      const items = [
        { json: { id: 1 } },
        { json: { id: 2 } },
        { json: { id: 3 } },
      ];

      mockExecuteFunctions.getInputData.mockReturnValue(items);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      let callCount = 0;

      mockExecuteFunctions.helpers.request = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          // Second request fails
          return Promise.reject({
            statusCode: 429,
            message: 'Rate limit exceeded',
          });
        }
        // First and third requests succeed
        return Promise.resolve({
          id: 'chatcmpl-test123',
          object: 'chat.completion',
          created: 1704067200,
          model: 'gpt-4-vision',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Test analysis',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
          },
        });
      });

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0]).toHaveLength(3);
      expect(result[0][0].json).toHaveProperty('analysis');
      expect(result[0][1].json).toHaveProperty('error'); // This one failed
      expect(result[0][2].json).toHaveProperty('analysis');
    });

    it('should stop on first error in batch without continueOnFail', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      const items = [
        { json: { id: 1 } },
        { json: { id: 2 } },
        { json: { id: 3 } },
      ];

      mockExecuteFunctions.getInputData.mockReturnValue(items);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      let callCount = 0;

      mockExecuteFunctions.helpers.request = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject({
            statusCode: 429,
            message: 'Rate limit exceeded',
          });
        }
        return Promise.resolve({
          id: 'chatcmpl-test123',
          object: 'chat.completion',
          created: 1704067200,
          model: 'gpt-4-vision',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Test analysis',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
          },
        });
      });

      try {
        await node.execute.call(mockExecuteFunctions);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    });
  });

  describe('Invalid Parameters', () => {
    it('should handle missing required image data', async () => {
      const params = {
        ...MOCK_NODE_PARAMS.basic,
        base64Data: '', // Empty image data
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      // Should validate before making API call
      try {
        await node.execute.call(mockExecuteFunctions);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    });

    it('should handle invalid base64 data', async () => {
      const params = {
        ...MOCK_NODE_PARAMS.basic,
        base64Data: 'not-valid-base64!!!',
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      // Should validate before making API call
      try {
        await node.execute.call(mockExecuteFunctions);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    });

    it('should handle missing required credentials', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(null);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      try {
        await node.execute.call(mockExecuteFunctions);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    });

    it('should handle invalid model parameter', async () => {
      const params = {
        ...MOCK_NODE_PARAMS.basic,
        model: '', // Empty model
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      try {
        await node.execute.call(mockExecuteFunctions);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    });
  });

  describe('Credential Test Endpoint', () => {
    it('should fail credential test with invalid API key', async () => {
      mockExecuteFunctions.getCredentials.mockResolvedValue({
        ...MOCK_CREDENTIALS.openai,
        apiKey: 'invalid-key',
      });

      nock(PROVIDER_BASE_URLS.openai)
        .get('/models')
        .reply(401, MOCK_ERROR_RESPONSES.UNAUTHORIZED.body);

      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue({
        statusCode: 401,
        message: 'Invalid API key provided',
      });

      try {
        await mockExecuteFunctions.helpers.request({
          url: '/models',
          headers: {
            Authorization: 'Bearer invalid-key',
          },
        });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    });
  });
});


