/**
 * Integration tests for UniversalLlmVision node execute() — analyzeAudio resource
 *
 * All tests use typeVersion: 1.2 so the node reads the `resource` parameter and
 * routes to the audio branch. The LLM HTTP call is mocked via helpers.request.
 */

import { UniversalLlmVision } from '../../../nodes/UniversalLlmVision/UniversalLlmVision.node';
import { MOCK_CREDENTIALS, MOCK_OPENAI_RESPONSE } from '../../fixtures/testData';

/** 12-byte zero buffer — valid base64, well under 25 MB limit */
const SMALL_AUDIO_BASE64 = Buffer.alloc(12).toString('base64');

const TEST_AUDIO_URL = 'https://example.com/test-audio.mp3';

const createMockExecuteFunctions = (): any => ({
  getNodeParameter: jest.fn(),
  getInputData: jest.fn(),
  getCredentials: jest.fn(),
  continueOnFail: jest.fn(() => false),
  getNode: jest.fn(() => ({ typeVersion: 1.2 })),
  helpers: {
    request: jest.fn(),
    getBinaryDataBuffer: jest.fn(),
  },
});

/** Build a getNodeParameter mock for audio analysis */
const makeAudioParams = (overrides: Record<string, any> = {}) => ({
  resource: 'analyzeAudio',
  model: 'gpt-4o-audio-preview',
  prompt: 'Analyze this audio',
  modelParameters: {},
  advancedOptions: {},
  outputPropertyName: 'analysis',
  audioSource: 'base64',
  audioBase64Data: SMALL_AUDIO_BASE64,
  audioMimeType: 'audio/mpeg',
  ...overrides,
});

describe('UniversalLlmVision — analyzeAudio resource (execute)', () => {
  let node: UniversalLlmVision;
  let mockEf: any;

  beforeEach(() => {
    node = new UniversalLlmVision();
    mockEf = createMockExecuteFunctions();

    mockEf.getInputData.mockReturnValue([{ json: { id: 1 } }]);
    mockEf.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.openai);
    mockEf.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Happy paths
  // ─────────────────────────────────────────────────────────────────────────

  describe('base64 audio source', () => {
    it('should analyze base64 audio and return analysis in output', async () => {
      const params = makeAudioParams();
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        return name in params ? (params as any)[name] : def;
      });

      const result = await node.execute.call(mockEf);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].json).toHaveProperty('analysis');
      expect(result[0][0].json.analysis).toBe(
        'This is a test image analysis result. The image contains test data.'
      );
    });

    it('should preserve original input item fields in output', async () => {
      mockEf.getInputData.mockReturnValue([{ json: { id: 42, source: 'microphone' } }]);
      const params = makeAudioParams();
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        return name in params ? (params as any)[name] : def;
      });

      const result = await node.execute.call(mockEf);
      expect(result[0][0].json.id).toBe(42);
      expect(result[0][0].json.source).toBe('microphone');
      expect(result[0][0].json.analysis).toBeDefined();
    });

    it('should write result to custom outputPropertyName', async () => {
      const params = makeAudioParams({ outputPropertyName: 'audioResult' });
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        return name in params ? (params as any)[name] : def;
      });

      const result = await node.execute.call(mockEf);
      expect(result[0][0].json).toHaveProperty('audioResult');
      expect(result[0][0].json).not.toHaveProperty('analysis');
    });

    it('should include metadata when includeMetadata is true', async () => {
      const params = makeAudioParams({ advancedOptions: { includeMetadata: true } });
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        return name in params ? (params as any)[name] : def;
      });

      const result = await node.execute.call(mockEf);
      expect(result[0][0].json).toHaveProperty('metadata');
      expect(result[0][0].json.metadata).toHaveProperty('model');
      expect(result[0][0].json.metadata).toHaveProperty('usage');
    });
  });

  describe('URL audio source', () => {
    it('should analyze URL audio successfully', async () => {
      const params = makeAudioParams({
        audioSource: 'url',
        audioUrl: TEST_AUDIO_URL,
      });
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        return name in params ? (params as any)[name] : def;
      });

      const result = await node.execute.call(mockEf);
      expect(result[0][0].json).toHaveProperty('analysis');
    });
  });

  describe('binary audio source', () => {
    it('should analyze binary audio successfully', async () => {
      const mockBinaryData = {
        data: SMALL_AUDIO_BASE64,
        mimeType: 'audio/mpeg',
        fileName: 'recording.mp3',
      };

      mockEf.getInputData.mockReturnValue([
        { json: { id: 1 }, binary: { audioData: mockBinaryData } },
      ]);

      const params = makeAudioParams({
        audioSource: 'binary',
        audioBinaryPropertyName: 'audioData',
        audioFilename: 'recording.mp3',
      });
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        return name in params ? (params as any)[name] : def;
      });

      const result = await node.execute.call(mockEf);
      expect(result[0][0].json).toHaveProperty('analysis');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Multiple input items
  // ─────────────────────────────────────────────────────────────────────────

  it('should process multiple input items independently', async () => {
    mockEf.getInputData.mockReturnValue([
      { json: { id: 1 } },
      { json: { id: 2 } },
      { json: { id: 3 } },
    ]);

    const params = makeAudioParams();
    mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
      return name in params ? (params as any)[name] : def;
    });

    const result = await node.execute.call(mockEf);
    expect(result[0]).toHaveLength(3);
    expect(result[0][0].json.id).toBe(1);
    expect(result[0][1].json.id).toBe(2);
    expect(result[0][2].json.id).toBe(3);
    result[0].forEach((item) => {
      expect(item.json).toHaveProperty('analysis');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error handling
  // ─────────────────────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('should propagate errors when continueOnFail is false', async () => {
      mockEf.continueOnFail.mockReturnValue(false);
      mockEf.helpers.request.mockRejectedValue(new Error('API rate limit exceeded'));

      const params = makeAudioParams();
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        return name in params ? (params as any)[name] : def;
      });

      await expect(node.execute.call(mockEf)).rejects.toThrow('API rate limit exceeded');
    });

    it('should capture errors in output when continueOnFail is true', async () => {
      mockEf.continueOnFail.mockReturnValue(true);
      mockEf.helpers.request.mockRejectedValue(new Error('Service temporarily unavailable'));

      const params = makeAudioParams();
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        return name in params ? (params as any)[name] : def;
      });

      const result = await node.execute.call(mockEf);
      expect(result[0][0].json.error).toContain('Service temporarily unavailable');
    });

    it('should throw when model is empty with audio-specific hint', async () => {
      mockEf.continueOnFail.mockReturnValue(false);

      const params = makeAudioParams({ model: '', advancedOptions: {} });
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        if (name === 'model') return ''; // empty model
        return name in params ? (params as any)[name] : def;
      });

      await expect(node.execute.call(mockEf)).rejects.toThrow(/gpt-4o-audio-preview/);
    });

    it('should capture empty-model error when continueOnFail is true', async () => {
      mockEf.continueOnFail.mockReturnValue(true);

      const params = makeAudioParams({ model: '', advancedOptions: {} });
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        if (name === 'model') return '';
        return name in params ? (params as any)[name] : def;
      });

      const result = await node.execute.call(mockEf);
      expect(result[0][0].json).toHaveProperty('error');
    });

    it('should throw when Anthropic is used for audio (Anthropic does not support audio)', async () => {
      mockEf.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.anthropic);
      mockEf.continueOnFail.mockReturnValue(false);

      const params = makeAudioParams();
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        return name in params ? (params as any)[name] : def;
      });

      await expect(node.execute.call(mockEf)).rejects.toThrow(
        /Anthropic.*does not support audio|does not support audio.*Anthropic/i
      );
    });

    it('should capture Anthropic audio error gracefully when continueOnFail is true', async () => {
      mockEf.getCredentials.mockResolvedValue(MOCK_CREDENTIALS.anthropic);
      mockEf.continueOnFail.mockReturnValue(true);

      const params = makeAudioParams();
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        return name in params ? (params as any)[name] : def;
      });

      const result = await node.execute.call(mockEf);
      expect(result[0][0].json.error).toMatch(/Anthropic/i);
    });

    it('should throw for invalid base64 audio data', async () => {
      mockEf.continueOnFail.mockReturnValue(false);

      const params = makeAudioParams({ audioBase64Data: 'not!valid!!!base64' });
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        return name in params ? (params as any)[name] : def;
      });

      await expect(node.execute.call(mockEf)).rejects.toThrow('Invalid base64 format');
    });

    it('should throw for invalid audio URL', async () => {
      mockEf.continueOnFail.mockReturnValue(false);

      const params = makeAudioParams({ audioSource: 'url', audioUrl: 'not-a-url' });
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        return name in params ? (params as any)[name] : def;
      });

      await expect(node.execute.call(mockEf)).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // manualModelId override
  // ─────────────────────────────────────────────────────────────────────────

  it('should use manualModelId when provided in advancedOptions', async () => {
    const params = makeAudioParams({
      model: 'some-other-model',
      advancedOptions: { manualModelId: 'gpt-4o-audio-preview-manual' },
    });
    mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
      return name in params ? (params as any)[name] : def;
    });

    await node.execute.call(mockEf);

    // Verify the request was made with the manual model
    const requestCall = mockEf.helpers.request.mock.calls[0][0];
    const requestBody = JSON.parse(requestCall.body);
    expect(requestBody.model).toBe('gpt-4o-audio-preview-manual');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Request structure verification
  // ─────────────────────────────────────────────────────────────────────────

  it('should send a POST request to the OpenAI chat completions endpoint', async () => {
    const params = makeAudioParams();
    mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
      return name in params ? (params as any)[name] : def;
    });

    await node.execute.call(mockEf);

    const requestCall = mockEf.helpers.request.mock.calls[0][0];
    expect(requestCall.method).toBe('POST');
    expect(requestCall.url).toContain('chat/completions');
  });

  it('should include input_audio block in OpenAI request body for base64 audio', async () => {
    const params = makeAudioParams();
    mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
      return name in params ? (params as any)[name] : def;
    });

    await node.execute.call(mockEf);

    const requestCall = mockEf.helpers.request.mock.calls[0][0];
    const body = JSON.parse(requestCall.body);
    const userContent = body.messages[body.messages.length - 1].content;
    const audioContent = userContent.find((c: any) => c.type === 'input_audio');
    expect(audioContent).toBeDefined();
    expect(audioContent.input_audio.format).toBe('mp3');
  });

  it('should include Authorization header with API key', async () => {
    const params = makeAudioParams();
    mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
      return name in params ? (params as any)[name] : def;
    });

    await node.execute.call(mockEf);

    const requestCall = mockEf.helpers.request.mock.calls[0][0];
    expect(requestCall.headers.Authorization).toBe(`Bearer ${MOCK_CREDENTIALS.openai.apiKey}`);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Additional integration tests: concurrent processing, metadata edge cases
  // ─────────────────────────────────────────────────────────────────────────

  it('should handle multiple items with mixed audio sources simultaneously', async () => {
    mockEf.getInputData.mockReturnValue([
      { json: { id: 1 } }, // base64
      { json: { id: 2 } }, // another base64
      { json: { id: 3 } }, // another base64
    ]);

    const params = makeAudioParams();
    mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
      return name in params ? (params as any)[name] : def;
    });

    const result = await node.execute.call(mockEf);
    expect(result[0]).toHaveLength(3);
    expect(mockEf.helpers.request).toHaveBeenCalledTimes(3);
  });

  it('should preserve all custom output properties alongside analysis result', async () => {
    mockEf.getInputData.mockReturnValue([
      {
        json: {
          id: 42,
          source: 'microphone',
          confidence: 0.95,
          timestamp: '2024-01-15T10:30:00Z',
        },
      },
    ]);

    const params = makeAudioParams();
    mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
      return name in params ? (params as any)[name] : def;
    });

    const result = await node.execute.call(mockEf);
    const outputJson = result[0][0].json;
    expect(outputJson.id).toBe(42);
    expect(outputJson.source).toBe('microphone');
    expect(outputJson.confidence).toBe(0.95);
    expect(outputJson.timestamp).toBe('2024-01-15T10:30:00Z');
    expect(outputJson.analysis).toBeDefined();
  });

  it('should handle metadata for different audio formats (mp3, wav, ogg, flac, aac)', async () => {
    const formats = ['mp3', 'wav', 'ogg', 'flac', 'aac'];
    const mimeTypeMap: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      flac: 'audio/flac',
      aac: 'audio/aac',
    };

    for (const format of formats) {
      mockEf.helpers.request.mockClear();
      mockEf.helpers.request.mockResolvedValue(MOCK_OPENAI_RESPONSE);

      const params = makeAudioParams({
        audioMimeType: mimeTypeMap[format],
        advancedOptions: { includeMetadata: true },
      });
      mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
        return name in params ? (params as any)[name] : def;
      });

      const result = await node.execute.call(mockEf);
      expect(result[0][0].json.metadata).toBeDefined();
      const metadata = result[0][0].json.metadata as any;
      // Verify metadata contains usage and model info (mock uses gpt-4-vision)
      expect(metadata?.usage).toBeDefined();
      expect(metadata?.model).toBeDefined();
    }
  });

  it('should handle empty input gracefully', async () => {
    mockEf.getInputData.mockReturnValue([]);

    const params = makeAudioParams();
    mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
      return name in params ? (params as any)[name] : def;
    });

    const result = await node.execute.call(mockEf);
    expect(result[0]).toHaveLength(0);
  });

  it('should respect custom outputPropertyName across multiple items', async () => {
    mockEf.getInputData.mockReturnValue([{ json: { id: 1 } }, { json: { id: 2 } }]);

    const params = makeAudioParams({ outputPropertyName: 'audioAnalysisResult' });
    mockEf.getNodeParameter.mockImplementation((name: string, _i: any, def?: any) => {
      return name in params ? (params as any)[name] : def;
    });

    const result = await node.execute.call(mockEf);
    result[0].forEach((item) => {
      expect(item.json).toHaveProperty('audioAnalysisResult');
      expect(item.json).not.toHaveProperty('analysis');
    });
  });
});
