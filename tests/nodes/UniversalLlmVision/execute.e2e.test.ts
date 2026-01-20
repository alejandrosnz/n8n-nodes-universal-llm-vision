/**
 * End-to-end workflow tests for UniversalLlmVision node
 * Tests complete real-world scenarios with all dependencies
 */

import nock from 'nock';
// import type { IBinaryData } from 'n8n-workflow';
import { UniversalLlmVision } from '../../../nodes/UniversalLlmVision/UniversalLlmVision.node';
import {
  MOCK_CREDENTIALS,
  MOCK_OPENAI_RESPONSE,
  MOCK_ANTHROPIC_RESPONSE,
  TINY_JPEG_BASE64,
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

describe('UniversalLlmVision Node - E2E Workflow Tests', () => {
  let node: UniversalLlmVision;
  let mockExecuteFunctions: any;

  beforeEach(() => {
    node = new UniversalLlmVision();
    mockExecuteFunctions = createMockExecuteFunctions();

    mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
    mockExecuteFunctions.getNodeParameter.mockReturnValue(undefined);
    mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
    mockExecuteFunctions.getBinaryData.mockReturnValue({});
    mockExecuteFunctions.continueOnFail.mockReturnValue(false);
  });

  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  describe('Complete Image Analysis Workflow', () => {
    it('should execute full workflow: load image -> prepare -> request -> parse response', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([
        {
          json: {
            fileName: 'document.jpg',
            uploadedAt: '2024-01-20T10:00:00Z',
          },
        },
      ]);

      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      // Mock the API call
      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request = jest
        .fn()
        .mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(1);

      const output = result[0][0].json;
      expect(output).toHaveProperty('fileName', 'document.jpg');
      expect(output).toHaveProperty('uploadedAt', '2024-01-20T10:00:00Z');
      expect(output).toHaveProperty('analysis');
      expect(typeof output.analysis).toBe('string');
    });
  });

  describe('Multi-Image Batch Processing', () => {
    it('should process 5 items sequentially with different image sources', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      const items = [
        {
          json: {
            id: 'img-001',
            source: 'base64',
            timestamp: '2024-01-20T10:00:00Z',
          },
        },
        {
          json: {
            id: 'img-002',
            source: 'base64',
            timestamp: '2024-01-20T10:05:00Z',
          },
        },
        {
          json: {
            id: 'img-003',
            source: 'base64',
            timestamp: '2024-01-20T10:10:00Z',
          },
        },
        {
          json: {
            id: 'img-004',
            source: 'base64',
            timestamp: '2024-01-20T10:15:00Z',
          },
        },
        {
          json: {
            id: 'img-005',
            source: 'base64',
            timestamp: '2024-01-20T10:20:00Z',
          },
        },
      ];

      mockExecuteFunctions.getInputData.mockReturnValue(items);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      // Mock all 5 API calls
      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .times(5)
        .reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request = jest
        .fn()
        .mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0]).toHaveLength(5);

      // Verify all items were processed and original data preserved
      result[0].forEach((item: any, index: number) => {
        expect(item.json).toHaveProperty('id', items[index].json.id);
        expect(item.json).toHaveProperty('source', 'base64');
        expect(item.json).toHaveProperty('timestamp', items[index].json.timestamp);
        expect(item.json).toHaveProperty('analysis');
      });
    });

    it('should preserve binary data through entire workflow', async () => {
      const params = {
        ...MOCK_NODE_PARAMS.basic,
        imageSource: 'binary',
        binaryPropertyName: 'data',
      };

      const binaryData: any = {
        data: TINY_JPEG_BASE64,
        mimeType: 'image/jpeg',
        fileName: 'photo.jpg',
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([
        {
          json: { id: 'photo-001', metadata: 'important' },
          binary: { data: binaryData },
        },
      ]);

      mockExecuteFunctions.getBinaryData.mockReturnValue({ data: binaryData });
      mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(
        Buffer.from(TINY_JPEG_BASE64, 'base64')
      );
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request = jest
        .fn()
        .mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      const output = result[0][0];
      expect(output.json).toHaveProperty('id', 'photo-001');
      expect(output.json).toHaveProperty('metadata', 'important');
      expect(output.json).toHaveProperty('analysis');
      expect(output.binary).toBeDefined();
      expect(output.binary?.data).toBeDefined();
    });
  });

  describe('Multi-Provider Workflows', () => {
    it('should work seamlessly with OpenAI provider', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: { id: 'openai-test' } }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request = jest
        .fn()
        .mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('analysis');
      expect(result[0][0].json.analysis).toContain('test image analysis');
    });

    it('should work seamlessly with Anthropic provider', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: { id: 'anthropic-test' } }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.anthropic);
      mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(
        Buffer.from(TINY_JPEG_BASE64, 'base64')
      );

      nock(PROVIDER_BASE_URLS.anthropic)
        .post(PROVIDER_ENDPOINTS.anthropic)
        .reply(200, MOCK_ANTHROPIC_RESPONSE);

      mockExecuteFunctions.helpers.request = jest
        .fn()
        .mockResolvedValue(MOCK_ANTHROPIC_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      // Verify it processed successfully with Anthropic provider
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toBeInstanceOf(Array);
      expect(result[0][0].json).toHaveProperty('analysis');
    });

    it('should work with Groq provider', async () => {
      const params = MOCK_NODE_PARAMS.basic;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: { id: 'groq-test' } }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.groq);

      nock(PROVIDER_BASE_URLS.groq).post(PROVIDER_ENDPOINTS.groq).reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request = jest
        .fn()
        .mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0][0].json).toHaveProperty('analysis');
    });
  });

  describe('Complex Parameter Combinations', () => {
    it('should handle metadata + custom headers + JSON response simultaneously', async () => {
      const params = {
        model: 'gpt-4-vision',
        imageSource: 'base64',
        prompt: 'Extract structured data from image',
        base64Data: TINY_JPEG_BASE64,
        base64MimeType: 'image/jpeg',
        modelParameters: {
          temperature: 0.2,
          maxTokens: 2048,
          topP: 0.9,
          imageDetail: 'high',
        },
        advancedOptions: {
          includeMetadata: true,
          responseFormat: 'json_object',
          customHeaders: {
            headers: [
              { name: 'X-Request-ID', value: 'workflow-123' },
              { name: 'X-Priority', value: 'high' },
            ],
          },
          systemPrompt: 'You are a structured data extraction expert.',
        },
        outputPropertyName: 'extractedData',
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([
        {
          json: {
            workflowId: 'workflow-123',
            timestamp: new Date().toISOString(),
          },
        },
      ]);

      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      const jsonResponse = {
        ...MOCK_OPENAI_RESPONSE,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: '{"items": ["item1", "item2"], "count": 2}',
            },
            finish_reason: 'stop',
          },
        ],
      };

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, jsonResponse);

      mockExecuteFunctions.helpers.request = jest.fn().mockResolvedValue(jsonResponse);

      const result = await node.execute.call(mockExecuteFunctions);

      const output = result[0][0].json;
      expect(output).toHaveProperty('extractedData');
      expect(output).toHaveProperty('metadata');
      expect(output.metadata).toHaveProperty('usage');
      expect(output.metadata).toHaveProperty('model');
      expect(output.metadata).toHaveProperty('finish_reason');
      expect(output).toHaveProperty('workflowId', 'workflow-123');
    });

    it('should handle custom system prompt + custom headers + metadata', async () => {
      const params = {
        model: 'gpt-4-vision',
        imageSource: 'base64',
        prompt: 'Analyze as a medical professional',
        base64Data: TINY_JPEG_BASE64,
        base64MimeType: 'image/jpeg',
        modelParameters: {
          temperature: 0.1,
          maxTokens: 1024,
          topP: 0.9,
          imageDetail: 'high',
        },
        advancedOptions: {
          includeMetadata: true,
          systemPrompt: 'You are a medical imaging specialist with 20 years of experience.',
          customHeaders: {
            headers: [
              { name: 'X-Medical-Assessment', value: 'true' },
              { name: 'X-Confidential', value: 'true' },
            ],
          },
        },
        outputPropertyName: 'medicalAnalysis',
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      mockExecuteFunctions.getInputData.mockReturnValue([
        {
          json: {
            patientId: 'PAT-001',
            scanType: 'MRI',
          },
        },
      ]);

      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request = jest
        .fn()
        .mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      const output = result[0][0].json;
      expect(output).toHaveProperty('medicalAnalysis');
      expect(output).toHaveProperty('patientId', 'PAT-001');
      expect(output).toHaveProperty('scanType', 'MRI');
      expect(output).toHaveProperty('metadata');
    });
  });

  describe('Data Integrity Throughout Pipeline', () => {
    it('should preserve all input data types through transformation', async () => {
      const params = MOCK_NODE_PARAMS.withMetadata;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      const complexInputData = {
        id: 123,
        name: 'Test',
        active: true,
        tags: ['tag1', 'tag2'],
        metadata: { nested: { deep: 'value' } },
        decimal: 3.14159,
      };

      mockExecuteFunctions.getInputData.mockReturnValue([{ json: complexInputData }]);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai).post(PROVIDER_ENDPOINTS.openai).reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request = jest
        .fn()
        .mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      const output = result[0][0].json;

      // Verify all original data is preserved with correct types
      expect(output.id).toBe(123);
      expect(output.name).toBe('Test');
      expect(output.active).toBe(true);
      expect(Array.isArray(output.tags)).toBe(true);
      expect(output.tags).toEqual(['tag1', 'tag2']);
      expect(output.decimal).toBe(3.14159);

      // Verify new analysis was added
      expect(output).toHaveProperty('analysis');
      expect(typeof output.analysis).toBe('string');
    });
  });

  describe('Realistic Workflow Scenarios', () => {
    it('should handle document analysis workflow', async () => {
      const params = MOCK_NODE_PARAMS.withMetadata;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      const documentItems = [
        {
          json: {
            documentId: 'DOC-001',
            fileName: 'invoice.jpg',
            uploadedBy: 'user@example.com',
            uploadedAt: '2024-01-20T10:00:00Z',
          },
        },
        {
          json: {
            documentId: 'DOC-002',
            fileName: 'receipt.jpg',
            uploadedBy: 'user@example.com',
            uploadedAt: '2024-01-20T10:05:00Z',
          },
        },
        {
          json: {
            documentId: 'DOC-003',
            fileName: 'contract.jpg',
            uploadedBy: 'admin@example.com',
            uploadedAt: '2024-01-20T10:10:00Z',
          },
        },
      ];

      mockExecuteFunctions.getInputData.mockReturnValue(documentItems);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .times(3)
        .reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request = jest
        .fn()
        .mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0]).toHaveLength(3);

      result[0].forEach((item: any, index: number) => {
        expect(item.json).toHaveProperty('documentId', documentItems[index].json.documentId);
        expect(item.json).toHaveProperty('fileName', documentItems[index].json.fileName);
        expect(item.json).toHaveProperty('uploadedBy', documentItems[index].json.uploadedBy);
        expect(item.json).toHaveProperty('uploadedAt', documentItems[index].json.uploadedAt);
        expect(item.json).toHaveProperty('analysis');
        expect(item.json).toHaveProperty('metadata');
      });
    });

    it('should handle image library enrichment workflow', async () => {
      const params = MOCK_NODE_PARAMS.withMetadata;

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      const imageItems = [
        {
          json: {
            galleryId: 'gallery-1',
            imageIndex: 1,
            size: 1024 * 50, // 50KB
            format: 'jpg',
          },
        },
        {
          json: {
            galleryId: 'gallery-1',
            imageIndex: 2,
            size: 1024 * 45,
            format: 'jpg',
          },
        },
      ];

      mockExecuteFunctions.getInputData.mockReturnValue(imageItems);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .times(2)
        .reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request = jest
        .fn()
        .mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      expect(result[0]).toHaveLength(2);

      result[0].forEach((item: any) => {
        expect(item.json).toHaveProperty('galleryId');
        expect(item.json).toHaveProperty('imageIndex');
        expect(item.json).toHaveProperty('analysis');
        expect(item.json).toHaveProperty('metadata');
      });
    });
  });

  describe('Output Property Name Configuration', () => {
    it('should respect custom output property names across batch', async () => {
      const params = {
        ...MOCK_NODE_PARAMS.basic,
        outputPropertyName: 'customOutput',
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        return (params as any)[paramName];
      });

      const items = [
        { json: { id: 1 } },
        { json: { id: 2 } },
      ];

      mockExecuteFunctions.getInputData.mockReturnValue(items);
      mockExecuteFunctions.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);

      nock(PROVIDER_BASE_URLS.openai)
        .post(PROVIDER_ENDPOINTS.openai)
        .times(2)
        .reply(200, MOCK_OPENAI_RESPONSE);

      mockExecuteFunctions.helpers.request = jest
        .fn()
        .mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const result = await node.execute.call(mockExecuteFunctions);

      result[0].forEach((item: any) => {
        expect(item.json).toHaveProperty('customOutput');
        expect(item.json).not.toHaveProperty('analysis');
      });
    });
  });
});
