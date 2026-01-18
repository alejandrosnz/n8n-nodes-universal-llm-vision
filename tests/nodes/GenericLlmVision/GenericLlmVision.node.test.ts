import { GenericLlmVision } from '../../../nodes/GenericLlmVision/GenericLlmVision.node';
import { ImageProcessor } from '../../../nodes/GenericLlmVision/processors/ImageProcessor';
import { ResponseProcessor } from '../../../nodes/GenericLlmVision/processors/ResponseProcessor';
import {
  detectMimeTypeFromExtension,
  detectMimeTypeFromBase64,
  isSupportedMimeType,
  isValidBase64,
  getSupportedMimeTypes,
  prepareImage,
} from '../../../nodes/GenericLlmVision/processors/ImageProcessor';
import { getProvider, getHeaders, getProviderOptions } from '../../../nodes/GenericLlmVision/utils/providers';
import { buildRequest, extractAnalysis, extractMetadata, getHeadersWithAuth } from '../../../nodes/GenericLlmVision/utils/GenericFunctions';

describe('GenericLlmVision Node', () => {
  let node: GenericLlmVision;

  beforeEach(() => {
    node = new GenericLlmVision();
  });

  it('should be defined with correct metadata', () => {
    expect(node).toBeDefined();
    expect(node.description.displayName).toBe('Generic LLM Vision');
    expect(node.description.name).toBe('genericLlmVision');
    expect(node.description.version).toBe(1);
  });

  it('should have image source parameter with binary, url, and base64 options', () => {
    const imageSourceParam = node.description.properties.find(p => p.name === 'imageSource');
    expect(imageSourceParam).toBeDefined();
    expect(imageSourceParam?.type).toBe('options');
    const options = (imageSourceParam as any).options;
    expect(options.map((o: any) => o.value)).toContain('binary');
    expect(options.map((o: any) => o.value)).toContain('url');
    expect(options.map((o: any) => o.value)).toContain('base64');
  });
});

describe('MIME Type Detection', () => {
  describe('detectMimeTypeFromExtension', () => {
    it('should detect JPEG from .jpg extension', () => {
      expect(detectMimeTypeFromExtension('image.jpg')).toBe('image/jpeg');
      expect(detectMimeTypeFromExtension('image.jpeg')).toBe('image/jpeg');
      expect(detectMimeTypeFromExtension('PHOTO.JPG')).toBe('image/jpeg');
    });

    it('should detect PNG from .png extension', () => {
      expect(detectMimeTypeFromExtension('image.png')).toBe('image/png');
      expect(detectMimeTypeFromExtension('SCREENSHOT.PNG')).toBe('image/png');
    });

    it('should detect WebP from .webp extension', () => {
      expect(detectMimeTypeFromExtension('image.webp')).toBe('image/webp');
    });

    it('should detect GIF from .gif extension', () => {
      expect(detectMimeTypeFromExtension('animation.gif')).toBe('image/gif');
    });

    it('should return null for unknown extension', () => {
      expect(detectMimeTypeFromExtension('image.bmp')).toBeNull();
      expect(detectMimeTypeFromExtension('document.pdf')).toBeNull();
    });

    it('should handle filenames without extension', () => {
      expect(detectMimeTypeFromExtension('image')).toBeNull();
    });
  });

  describe('detectMimeTypeFromBase64', () => {
    it('should detect JPEG from magic bytes', () => {
      // JPEG magic bytes: FF D8 FF
      const jpegBase64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString('base64');
      expect(detectMimeTypeFromBase64(jpegBase64)).toBe('image/jpeg');
    });

    it('should detect PNG from magic bytes', () => {
      // PNG magic bytes: 89 50 4E 47
      const pngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString('base64');
      expect(detectMimeTypeFromBase64(pngBase64)).toBe('image/png');
    });

    it('should detect GIF from magic bytes', () => {
      // GIF magic bytes: 47 49 46
      const gifBase64 = Buffer.from([0x47, 0x49, 0x46]).toString('base64');
      expect(detectMimeTypeFromBase64(gifBase64)).toBe('image/gif');
    });

    it('should return null for invalid base64', () => {
      expect(detectMimeTypeFromBase64('not-valid-base64!!!')).toBeNull();
    });

    it('should return null for unrecognized magic bytes', () => {
      const unknownBase64 = Buffer.from([0x00, 0x00, 0x00, 0x00]).toString('base64');
      expect(detectMimeTypeFromBase64(unknownBase64)).toBeNull();
    });
  });

  describe('isSupportedMimeType', () => {
    it('should return true for supported MIME types', () => {
      expect(isSupportedMimeType('image/jpeg')).toBe(true);
      expect(isSupportedMimeType('image/png')).toBe(true);
      expect(isSupportedMimeType('image/webp')).toBe(true);
      expect(isSupportedMimeType('image/gif')).toBe(true);
    });

    it('should return false for unsupported MIME types', () => {
      expect(isSupportedMimeType('image/bmp')).toBe(false);
      expect(isSupportedMimeType('image/tiff')).toBe(false);
      expect(isSupportedMimeType('video/mp4')).toBe(false);
    });
  });

  describe('isValidBase64', () => {
    it('should validate correct base64 strings', () => {
      expect(isValidBase64('aGVsbG8gd29ybGQ=')).toBe(true);
      expect(isValidBase64('SGVsbG8gV29ybGQ=')).toBe(true);
      expect(isValidBase64('YQ==')).toBe(true);
    });

    it('should reject invalid base64 strings', () => {
      expect(isValidBase64('invalid!!!base64')).toBe(false);
      expect(isValidBase64('not-base64')).toBe(false);
    });
  });

  describe('getSupportedMimeTypes', () => {
    it('should return all supported MIME types', () => {
      const types = getSupportedMimeTypes();
      expect(types).toContain('image/jpeg');
      expect(types).toContain('image/png');
      expect(types).toContain('image/webp');
      expect(types).toContain('image/gif');
      expect(types.length).toBe(4);
    });
  });
});

describe('Provider Configuration', () => {
  describe('getProvider', () => {
    it('should return OpenAI provider by default', () => {
      const provider = getProvider('openai');
      expect(provider.displayName).toBe('OpenAI');
      expect(provider.baseUrl).toBe('https://api.openai.com/v1');
      expect(provider.apiEndpoint).toBe('/chat/completions');
      expect(provider.requestFormat).toBe('openai');
    });

    it('should return Anthropic provider', () => {
      const provider = getProvider('anthropic');
      expect(provider.displayName).toBe('Anthropic');
      expect(provider.baseUrl).toBe('https://api.anthropic.com/v1');
      expect(provider.apiEndpoint).toBe('/messages');
      expect(provider.requestFormat).toBe('anthropic');
    });

    it('should return Groq provider', () => {
      const provider = getProvider('groq');
      expect(provider.displayName).toBe('Groq');
      expect(provider.baseUrl).toBe('https://api.groq.com/openai/v1');
      expect(provider.apiEndpoint).toBe('/chat/completions');
      expect(provider.requestFormat).toBe('openai');
      expect(provider.documentationUrl).toBe('https://console.groq.com/docs');
    });

    it('should handle provider normalization', () => {
      const provider = getProvider('OPENAI');
      expect(provider.displayName).toBe('OpenAI');
    });

    it('should support custom provider', () => {
      const provider = getProvider('custom');
      expect(provider.displayName).toBe('Custom Provider');
    });
  });

  describe('getHeaders', () => {
    it('should return Bearer token for OpenAI', () => {
      const headers = getHeaders('openai', 'test-key');
      expect(headers['Authorization']).toBe('Bearer test-key');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should return x-api-key for Anthropic', () => {
      const headers = getHeaders('anthropic', 'test-key');
      expect(headers['x-api-key']).toBe('test-key');
      expect(headers['anthropic-version']).toBe('2023-06-01');
    });

    it('should include custom headers', () => {
      const customHeaders = { 'X-Custom': 'value' };
      const headers = getHeaders('openai', 'test-key', customHeaders);
      expect(headers['X-Custom']).toBe('value');
    });
  });

  describe('getProviderOptions', () => {
    it('should return provider options for UI dropdown', () => {
      const options = getProviderOptions();

      // Should not include 'custom' in main list
      const customOption = options.find((opt: any) => opt.value === 'custom');
      expect(customOption).toBeDefined();
      expect(customOption?.name).toBe('Custom Provider');

      // Should include main providers
      const openaiOption = options.find((opt: any) => opt.value === 'openai');
      expect(openaiOption).toBeDefined();
      expect(openaiOption?.name).toBe('OpenAI');
    });
  });
});

describe('Image Preparation', () => {
  describe('prepareImage with binary source', () => {
    it('should prepare binary image successfully', async () => {
      const binaryData = {
        data: Buffer.from('test image').toString('base64'),
        mimeType: 'image/jpeg',
        fileType: 'jpg',
      };

      const result = await prepareImage('binary', binaryData, 'photo.jpg');

      expect(result.source).toBe('binary');
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.data).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
    });

    it('should detect MIME type from filename for binary', async () => {
      const binaryData = {
        data: Buffer.from('test image').toString('base64'),
        mimeType: 'application/octet-stream', // Wrong MIME type
      };

      const result = await prepareImage('binary', binaryData, 'photo.png');

      expect(result.mimeType).toBe('image/png'); // Should be corrected from filename
    });

    it('should throw error for unsupported MIME type', async () => {
      const binaryData = {
        data: 'test',
        mimeType: 'image/bmp',
      };

      await expect(prepareImage('binary', binaryData)).rejects.toThrow('Unsupported image format');
    });

    it('should throw error for oversized image', async () => {
      const largeBuffer = Buffer.alloc(21 * 1024 * 1024); // 21MB
      const binaryData = {
        data: largeBuffer.toString('base64'),
        mimeType: 'image/jpeg',
      };

      await expect(prepareImage('binary', binaryData)).rejects.toThrow('Image size exceeds maximum');
    });
  });

  describe('prepareImage with base64 source', () => {
    it('should prepare base64 image with auto-detection', async () => {
      const jpegBase64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x01]).toString('base64');
      const result = await prepareImage('base64', jpegBase64);

      expect(result.source).toBe('base64');
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.data).toBe(jpegBase64);
    });

    it('should detect MIME type from filename if magic bytes fail', async () => {
      const unknownBase64 = 'SGVsbG8gd29ybGQ='; // "Hello world" - no magic bytes
      const result = await prepareImage('base64', unknownBase64, 'image.png');

      expect(result.mimeType).toBe('image/png');
    });

    it('should throw error if MIME type cannot be detected', async () => {
      const unknownBase64 = 'SGVsbG8gd29ybGQ='; // "Hello world" - no magic bytes

      await expect(prepareImage('base64', unknownBase64)).rejects.toThrow(
        'Could not detect image format',
      );
    });

    it('should validate base64 format', async () => {
      await expect(prepareImage('base64', 'not-valid-base64!!!')).rejects.toThrow(
        'Invalid base64 format',
      );
    });
  });

  describe('prepareImage with url source', () => {
    it('should prepare URL image', async () => {
      const url = 'https://example.com/image.jpg';
      const result = await prepareImage('url', url);

      expect(result.source).toBe('url');
      expect(result.mimeType).toBe('url');
      expect(result.data).toBe(url);
    });

    it('should validate URL format', async () => {
      await expect(prepareImage('url', 'not a valid url')).rejects.toThrow('Invalid image URL');
    });

    it('should reject potentially unsafe URLs', async () => {
      await expect(prepareImage('url', 'javascript:alert(1)')).rejects.toThrow(
        'Potentially unsafe URL detected',
      );
    });

    it('should handle URLs with various protocols', async () => {
      const result = await prepareImage('url', 'https://secure-cdn.example.com/images/photo.png');
      expect(result.data).toBe('https://secure-cdn.example.com/images/photo.png');
    });
  });
});

describe('Request Building', () => {
  describe('buildRequest for OpenAI', () => {
    it('should build OpenAI format request', () => {
      const options = {
        provider: 'openai',
        model: 'gpt-4-vision',
        prompt: 'Describe this image',
        image: {
          data: Buffer.from('test').toString('base64'),
          mimeType: 'image/jpeg',
          size: 100,
          source: 'binary' as const,
        },
        imageDetail: 'high',
        temperature: 0.7,
        maxTokens: 512,
      };

      const request = buildRequest(options);

      expect(request.url).toContain('/chat/completions');
      expect(request.headers['Authorization']).toBe('Bearer ');
      expect(request.body.model).toBe('gpt-4-vision');
      expect(request.body.temperature).toBe(0.7);
      expect(request.body.max_tokens).toBe(512);
      expect(Array.isArray(request.body.messages)).toBe(true);
    });

    it('should include optional parameters in OpenAI request', () => {
      const options = {
        provider: 'openai',
        model: 'gpt-4-vision',
        prompt: 'Describe this image',
        image: {
          data: Buffer.from('test').toString('base64'),
          mimeType: 'image/jpeg',
          size: 100,
          source: 'binary' as const,
        },
        systemPrompt: 'You are a helpful assistant.',
        additionalParameters: { custom: 'value' },
      };

      const request = buildRequest(options);

      expect(request.body.messages).toHaveLength(2); // system + user message
      expect(request.body.messages[0].role).toBe('system');
      expect(request.body.messages[0].content).toBe('You are a helpful assistant.');
      expect(request.body.custom).toBe('value');
    });
  });

  describe('buildRequest for Anthropic', () => {
    it('should build Anthropic format request', () => {
      const options = {
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        prompt: 'Describe this image',
        image: {
          data: Buffer.from('test').toString('base64'),
          mimeType: 'image/jpeg',
          size: 100,
          source: 'binary' as const,
        },
      };

      const request = buildRequest(options);

      expect(request.url).toContain('/messages');
      expect(request.headers['x-api-key']).toBe('');
      expect(request.body.model).toBe('claude-3-sonnet');
      expect(Array.isArray(request.body.messages)).toBe(true);
      expect(request.body.messages[0].content).toBeDefined();
    });

    it('should include optional parameters in Anthropic request', () => {
      const options = {
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        prompt: 'Describe this image',
        image: {
          data: 'https://example.com/image.jpg',
          mimeType: 'image/jpeg',
          size: 100,
          source: 'url' as const,
        },
        maxTokens: 1000,
        additionalParameters: { custom: 'value' },
      };

      const request = buildRequest(options);

      expect(request.body.max_tokens).toBe(1000);
      expect(request.body.custom).toBe('value');
      // For URL source, should use image_url format
      const imageContent = request.body.messages[0].content.find((c: any) => c.type === 'image');
      expect(imageContent).toBeDefined();
      expect(imageContent.source.type).toBe('url');
      expect(imageContent.source.url).toBe('https://example.com/image.jpg');
    });
  });
});

describe('Response Extraction', () => {
  describe('extractAnalysis', () => {
    it('should extract OpenAI format response', () => {
      const response = {
        choices: [{ message: { content: 'Analysis result' } }],
      };

      const analysis = extractAnalysis('openai', response);
      expect(analysis).toBe('Analysis result');
    });

    it('should extract Anthropic format response', () => {
      const response = {
        content: [{ text: 'Analysis result' }],
      };

      const analysis = extractAnalysis('anthropic', response);
      expect(analysis).toBe('Analysis result');
    });

    it('should handle missing content gracefully', () => {
      const openaiResponse = { choices: [{}] };
      expect(extractAnalysis('openai', openaiResponse)).toBe('');

      const anthropicResponse = { content: [] };
      expect(extractAnalysis('anthropic', anthropicResponse)).toBe('');
    });
  });

  describe('extractMetadata', () => {
    it('should extract metadata from response', () => {
      const response = {
        model: 'gpt-4-vision',
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
        },
        choices: [{ finish_reason: 'stop' }],
      };

      const metadata = extractMetadata(response);

      expect(metadata.model).toBe('gpt-4-vision');
      expect(metadata.usage).toBeDefined();
      expect(metadata.finish_reason).toBe('stop');
    });
  });

  describe('getHeadersWithAuth', () => {
    it('should get headers with API key for OpenAI', () => {
      const headers = getHeadersWithAuth('openai', 'sk-test123');

      expect(headers).toBeDefined();
      expect(headers['Authorization']).toBe('Bearer sk-test123');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should get headers with API key for Anthropic', () => {
      const headers = getHeadersWithAuth('anthropic', 'sk-ant-test123');

      expect(headers).toBeDefined();
      expect(headers['x-api-key']).toBe('sk-ant-test123');
      expect(headers['anthropic-version']).toBe('2023-06-01');
    });

    it('should include custom headers', () => {
      const customHeaders = { 'X-Custom': 'value', 'User-Agent': 'test' };
      const headers = getHeadersWithAuth('openai', 'sk-test123', customHeaders);

      expect(headers['X-Custom']).toBe('value');
      expect(headers['User-Agent']).toBe('test');
      expect(headers['Authorization']).toBe('Bearer sk-test123');
    });
  describe('prepareImage - error cases', () => {
    it('should throw error for oversized images', async () => {
      // Create a base64 string that represents more than 20MB
      const largeData = Buffer.alloc(21 * 1024 * 1024).toString('base64');

      await expect(prepareImage('base64', largeData)).rejects.toThrow(
        'Image size exceeds maximum of 20MB'
      );
    });

    it('should throw error for unsupported MIME types', async () => {
      // Create a fake image with BMP magic bytes but claim it's BMP
      const bmpData = {
        data: Buffer.from([0x42, 0x4D, ...Buffer.alloc(100)]).toString('base64'),
        mimeType: 'image/bmp',
        fileName: 'test.bmp',
      };

      await expect(prepareImage('binary', bmpData)).rejects.toThrow(
        'Unsupported image format: image/bmp'
      );
    });

    it('should throw error for invalid base64 in binary data', async () => {
      const invalidData = {
        data: 'invalid-base64!!!',
        mimeType: 'image/jpeg',
        fileName: 'test.jpg',
      };

      await expect(prepareImage('binary', invalidData)).rejects.toThrow(
        'Failed to decode binary data as base64'
      );
    });

    it('should throw error for empty binary data', async () => {
      const emptyData = {
        data: '',
        mimeType: 'image/jpeg',
        fileName: 'test.jpg',
      };

      await expect(prepareImage('binary', emptyData)).rejects.toThrow(
        'Binary data decoded to 0 bytes'
      );
    });

    it('should throw error for invalid base64 source', async () => {
      await expect(prepareImage('base64', 'invalid!!!')).rejects.toThrow(
        'Invalid base64 format'
      );
    });

    it('should throw error for unknown source type', async () => {
      await expect(prepareImage('unknown' as any, 'data')).rejects.toThrow(
        'Unknown image source type: unknown'
      );
    });

    it('should throw error for binary data missing MIME type', async () => {
      const dataWithoutMimeType = {
        data: Buffer.from('fake image data').toString('base64'),
        fileName: 'test.jpg',
        // missing mimeType
      };

      await expect(prepareImage('binary', dataWithoutMimeType)).rejects.toThrow(
        'Binary data object is missing \'mimeType\' property'
      );
    });

    it('should detect MIME type from filename when magic bytes fail', async () => {
      // Create data with unknown magic bytes but valid filename
      const unknownMagicBytes = Buffer.from([0x00, 0x00, 0x00, 0x00]).toString('base64');
      const data = {
        data: unknownMagicBytes,
        mimeType: 'image/jpeg', // This will be overridden
        fileName: 'test.png',
      };

      const result = await prepareImage('binary', data);
      expect(result.mimeType).toBe('image/png'); // Should use filename detection
    });

    it('should log warning when magic bytes MIME type differs from metadata', async () => {
      // Create PNG data but claim it's JPEG in metadata
      const pngData = Buffer.from([0x89, 0x50, 0x4e, 0x47, ...Buffer.alloc(100)]).toString('base64');
      const data = {
        data: pngData,
        mimeType: 'image/jpeg', // Wrong metadata
        fileName: 'test.jpg',
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = await prepareImage('binary', data);
      expect(result.mimeType).toBe('image/png'); // Should use magic bytes
      expect(consoleSpy).toHaveBeenCalledWith(
        'Warning: MIME type mismatch. Metadata says image/jpeg but magic bytes indicate image/png. Using magic bytes detection.'
      );
      
      consoleSpy.mockRestore();
    });

    it('should throw error for empty decoded base64 buffer', async () => {
      // Base64 that decodes to empty buffer
      const emptyBase64 = Buffer.from('').toString('base64');
      
      await expect(prepareImage('base64', emptyBase64)).rejects.toThrow(
        'Base64 data is empty'
      );
    });

    it('should throw error when MIME type cannot be detected', async () => {
      // Unknown magic bytes and no filename
      const unknownData = Buffer.from([0x00, 0x00, 0x00, 0x00]).toString('base64');
      const data = {
        data: unknownData,
        mimeType: 'application/octet-stream', // No MIME type detection possible
      };

      await expect(prepareImage('binary', data)).rejects.toThrow(
        'Unsupported image format: application/octet-stream'
      );
    });

    it('should throw error for invalid URL protocol', async () => {
      await expect(prepareImage('url', 'ftp://example.com/image.jpg')).rejects.toThrow(
        'URL must start with http:// or https://'
      );
    });
  });
});
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getInputData: jest.fn(),
      helpers: {
        getBinaryDataBuffer: jest.fn(),
      },
    };
  });

  it('should be defined', () => {
    const processor = new ImageProcessor(mockExecuteFunctions);
    expect(processor).toBeDefined();
  });

  describe('getPreparedImage - binary source', () => {
    it('should process binary image data successfully', async () => {
      const mockBuffer = Buffer.from('fake image data');
      const mockBinaryData = {
        data: mockBuffer.toString('base64'),
        mimeType: 'image/jpeg',
        fileName: 'test.jpg',
      };

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('binary') // imageSource
        .mockReturnValueOnce('data') // binaryPropertyName
        .mockReturnValueOnce('test.jpg'); // filename

      mockExecuteFunctions.getInputData.mockReturnValue([
        { binary: { data: mockBinaryData } }
      ]);

      mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(mockBuffer);

      const processor = new ImageProcessor(mockExecuteFunctions);
      const result = await processor.getPreparedImage(0);

      expect(result).toBeDefined();
      expect(result.source).toBe('binary');
      expect(result.mimeType).toBe('image/jpeg');
    });

    it('should throw error when binary data is missing', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('binary')
        .mockReturnValueOnce('data');

      mockExecuteFunctions.getInputData.mockReturnValue([
        { binary: {} }
      ]);

      const processor = new ImageProcessor(mockExecuteFunctions);

      await expect(processor.getPreparedImage(0)).rejects.toThrow(
        'No binary data found in property \'data\''
      );
    });
  });

  describe('getPreparedImage - URL source', () => {
    it('should process URL successfully', async () => {
      const testUrl = 'https://example.com/image.jpg';

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('url')
        .mockReturnValueOnce(testUrl);

      const processor = new ImageProcessor(mockExecuteFunctions);
      const result = await processor.getPreparedImage(0);

      expect(result).toBeDefined();
      expect(result.source).toBe('url');
      expect(result.data).toBe(testUrl);
      expect(result.mimeType).toBe('url');
    });

    it('should throw error for invalid URL', async () => {
      const invalidUrl = 'not-a-url';

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('url')
        .mockReturnValueOnce(invalidUrl);

      const processor = new ImageProcessor(mockExecuteFunctions);

      await expect(processor.getPreparedImage(0)).rejects.toThrow(
        'Invalid image URL'
      );
    });
  });

  describe('getPreparedImage - base64 source', () => {
    it('should process base64 data successfully', async () => {
      const base64Data = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/AB//2Q==';

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('base64')
        .mockReturnValueOnce(base64Data);

      const processor = new ImageProcessor(mockExecuteFunctions);
      const result = await processor.getPreparedImage(0);

      expect(result).toBeDefined();
      expect(result.source).toBe('base64');
      expect(result.mimeType).toBe('image/jpeg');
    });
  });
});

describe('ResponseProcessor', () => {
  let processor: ResponseProcessor;

  beforeEach(() => {
    processor = new ResponseProcessor();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('processResponse', () => {
    it('should process OpenAI response without metadata', () => {
      const mockResponse = {
        choices: [{
          message: { content: 'This is a cat' },
          finish_reason: 'stop'
        }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
        model: 'gpt-4-vision'
      };

      const result = processor.processResponse(mockResponse, 'openai', false, 'analysis');

      expect(result).toEqual({
        analysis: 'This is a cat'
      });
    });

    it('should process OpenAI response with metadata', () => {
      const mockResponse = {
        choices: [{
          message: { content: 'This is a dog' },
          finish_reason: 'stop'
        }],
        usage: { prompt_tokens: 15, completion_tokens: 8 },
        model: 'gpt-4-vision'
      };

      const result = processor.processResponse(mockResponse, 'openai', true, 'result');

      expect(result).toEqual({
        result: 'This is a dog',
        metadata: {
          model: 'gpt-4-vision',
          usage: { input_tokens: 15, output_tokens: 8 },
          finish_reason: 'stop'
        }
      });
    });

    it('should process Anthropic response', () => {
      const mockResponse = {
        content: [{ text: 'This is a bird' }],
        usage: { input_tokens: 20, output_tokens: 10 },
        model: 'claude-3-sonnet',
        stop_reason: 'end_turn'
      };

      const result = processor.processResponse(mockResponse, 'anthropic', false, 'analysis');

      expect(result).toEqual({
        analysis: 'This is a bird'
      });
    });
  });
});

describe('Integration Tests - Execute Method', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getInputData: jest.fn(),
      getCredentials: jest.fn(),
      getNodeParameter: jest.fn(),
      continueOnFail: jest.fn(),
      helpers: {
        getBinaryDataBuffer: jest.fn(),
        request: jest.fn(),
      },
    };
  });

  it('should process binary image successfully', async () => {
    // Mock credentials
    mockExecuteFunctions.getCredentials
      .mockResolvedValueOnce({ apiKey: 'sk-test', provider: 'openai' });

    // Mock input data
    mockExecuteFunctions.getInputData.mockReturnValue([
      { 
        json: { id: 1 }, 
        binary: { 
          data: {
            data: Buffer.from('fake image data').toString('base64'),
            mimeType: 'image/jpeg',
            fileName: 'test.jpg',
          }
        } 
      }
    ]);

    // Mock parameters
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'model': return 'gpt-4-vision';
        case 'imageSource': return 'binary';
        case 'prompt': return 'Describe this image';
        case 'modelParameters': return {};
        case 'advancedOptions': return { includeMetadata: false };
        case 'outputPropertyName': return 'analysis';
        case 'binaryPropertyName': return 'data';
        case 'filename': return 'test.jpg';
        default: return undefined;
      }
    });

    // Mock binary data
    const mockBuffer = Buffer.from('fake image data');
    mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(mockBuffer);

    // Mock API response
    const mockApiResponse = {
      choices: [{ message: { content: 'A beautiful landscape' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
      model: 'gpt-4-vision'
    };
    mockExecuteFunctions.helpers.request.mockResolvedValue(mockApiResponse);

    const node = new GenericLlmVision();
    const result = await node.execute.call(mockExecuteFunctions);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(1);
    expect(result[0][0].json).toEqual({
      id: 1,
      analysis: 'A beautiful landscape'
    });
  });

  it('should handle API errors gracefully when continueOnFail is true', async () => {
    // Mock credentials
    mockExecuteFunctions.getCredentials
      .mockResolvedValueOnce({ apiKey: 'sk-test', provider: 'openai' });

    // Mock input data
    mockExecuteFunctions.getInputData.mockReturnValue([
      { 
        json: { id: 1 }, 
        binary: { 
          data: {
            data: Buffer.from('fake image data').toString('base64'),
            mimeType: 'image/jpeg',
            fileName: 'test.jpg',
          }
        } 
      }
    ]);

    // Mock continueOnFail
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);

    // Mock parameters
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'model': return 'gpt-4-vision';
        case 'imageSource': return 'binary';
        case 'prompt': return 'Describe this image';
        case 'modelParameters': return {};
        case 'advancedOptions': return { includeMetadata: false };
        case 'outputPropertyName': return 'analysis';
        case 'binaryPropertyName': return 'data';
        case 'filename': return 'test.jpg';
        default: return undefined;
      }
    });

    // Mock binary data
    const mockBuffer = Buffer.from('fake image data');
    mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(mockBuffer);

    // Mock API error
    mockExecuteFunctions.helpers.request.mockRejectedValue(new Error('API rate limit exceeded'));

    const node = new GenericLlmVision();
    const result = await node.execute.call(mockExecuteFunctions);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(1);
    expect(result[0][0].json.error).toContain('API rate limit exceeded');
  });

  it('should throw error when continueOnFail is false', async () => {
    // Mock credentials
    mockExecuteFunctions.getCredentials
      .mockResolvedValueOnce({ apiKey: 'sk-test', provider: 'openai' });

    // Mock input data
    mockExecuteFunctions.getInputData.mockReturnValue([
      { 
        json: { id: 1 }, 
        binary: { 
          data: {
            data: Buffer.from('fake image data').toString('base64'),
            mimeType: 'image/jpeg',
            fileName: 'test.jpg',
          }
        } 
      }
    ]);

    // Mock continueOnFail
    mockExecuteFunctions.continueOnFail.mockReturnValue(false);

    // Mock parameters
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'model': return 'gpt-4-vision';
        case 'imageSource': return 'binary';
        case 'prompt': return 'Describe this image';
        case 'modelParameters': return {};
        case 'advancedOptions': return { includeMetadata: false };
        case 'outputPropertyName': return 'analysis';
        case 'binaryPropertyName': return 'data';
        case 'filename': return 'test.jpg';
        default: return undefined;
      }
    });

    // Mock binary data
    const mockBuffer = Buffer.from('fake image data');
    mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(mockBuffer);

    // Mock API error
    mockExecuteFunctions.helpers.request.mockRejectedValue(new Error('API rate limit exceeded'));

    const node = new GenericLlmVision();
    await expect(node.execute.call(mockExecuteFunctions)).rejects.toThrow('API rate limit exceeded');
  });

  it('should fall back to generic credentials when OpenRouter credentials are unavailable', async () => {
    // Mock getCredentials to reject for openRouterApi and resolve for genericLlmVisionApi
    mockExecuteFunctions.getCredentials
      .mockRejectedValueOnce(new Error('OpenRouter credentials not configured')) // First call for openRouterApi
      .mockResolvedValueOnce({ apiKey: 'sk-test', provider: 'openai' }); // Second call for genericLlmVisionApi

    // Mock input data
    mockExecuteFunctions.getInputData.mockReturnValue([
      { 
        json: { id: 1 }, 
        binary: { 
          data: {
            data: Buffer.from('fake image data').toString('base64'),
            mimeType: 'image/jpeg',
            fileName: 'test.jpg',
          }
        } 
      }
    ]);

    // Mock parameters
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'model': return 'gpt-4-vision';
        case 'imageSource': return 'binary';
        case 'prompt': return 'Describe this image';
        case 'modelParameters': return {};
        case 'advancedOptions': return { includeMetadata: false };
        case 'outputPropertyName': return 'analysis';
        
        case 'binaryPropertyName': return 'data';
        case 'filename': return 'test.jpg';
        default: return undefined;
      }
    });

    // Mock binary data
    const mockBuffer = Buffer.from('fake image data');
    mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(mockBuffer);

    // Mock API response
    const mockApiResponse = {
      choices: [{ message: { content: 'A beautiful landscape' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
      model: 'gpt-4-vision'
    };
    mockExecuteFunctions.helpers.request.mockResolvedValue(mockApiResponse);

    const node = new GenericLlmVision();
    const result = await node.execute.call(mockExecuteFunctions);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(1);
    expect(result[0][0].json).toEqual({
      id: 1,
      analysis: 'A beautiful landscape'
    });
  });

  it('should fall back to generic credentials when OpenRouter credentials are unavailable', async () => {
    // Mock getCredentials to reject for openRouterApi and resolve for genericLlmVisionApi
    mockExecuteFunctions.getCredentials
      .mockRejectedValueOnce(new Error('OpenRouter credentials not configured')) // First call for openRouterApi
      .mockResolvedValueOnce({ apiKey: 'sk-test', provider: 'openai' }); // Second call for genericLlmVisionApi

    // Mock input data
    mockExecuteFunctions.getInputData.mockReturnValue([
      { 
        json: { id: 1 }, 
        binary: { 
          data: {
            data: Buffer.from('fake image data').toString('base64'),
            mimeType: 'image/jpeg',
            fileName: 'test.jpg',
          }
        } 
      }
    ]);

    // Mock parameters
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'model': return 'gpt-4-vision';
        case 'imageSource': return 'binary';
        case 'prompt': return 'Describe this image';
        case 'modelParameters': return {};
        case 'advancedOptions': return { includeMetadata: false };
        case 'outputPropertyName': return 'analysis';
        
        case 'binaryPropertyName': return 'data';
        case 'filename': return 'test.jpg';
        default: return undefined;
      }
    });

    // Mock binary data
    const mockBuffer = Buffer.from('fake image data');
    mockExecuteFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(mockBuffer);

    // Mock API response
    const mockApiResponse = {
      choices: [{ message: { content: 'A beautiful landscape' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
      model: 'gpt-4-vision'
    };
    mockExecuteFunctions.helpers.request.mockResolvedValue(mockApiResponse);

    const node = new GenericLlmVision();
    const result = await node.execute.call(mockExecuteFunctions);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(1);
    expect(result[0][0].json).toEqual({
      id: 1,
      analysis: 'A beautiful landscape'
    });

    // Verify getCredentials was called twice: first for openRouterApi (rejected), then for genericLlmVisionApi (resolved)
    expect(mockExecuteFunctions.getCredentials).toHaveBeenCalledWith('openRouterApi');
    expect(mockExecuteFunctions.getCredentials).toHaveBeenCalledWith('genericLlmVisionApi');
  });
});
