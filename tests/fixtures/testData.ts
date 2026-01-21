/**
 * Test fixtures and mock data for integration tests
 * Contains reusable test images, API payloads, and error scenarios
 */

/**
 * Tiny 1x1 JPEG image (smallest valid JPEG)
 * Can be used for all image source types
 */
export const TINY_JPEG_BASE64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

/**
 * Tiny 1x1 PNG image
 */
export const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Small test image URL for URL source testing
 */
export const TEST_IMAGE_URL = 'https://example.com/test-image.jpg';

/**
 * Mock credentials configuration
 */
export const MOCK_CREDENTIALS = {
  openRouter: {
    provider: 'openrouter',
    apiKey: 'test-openrouter-key-12345',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  groq: {
    provider: 'groq',
    apiKey: 'test-groq-key-12345',
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  grok: {
    provider: 'grok',
    apiKey: 'test-grok-key-12345',
    baseUrl: 'https://api.x.ai/v1',
  },
  openai: {
    provider: 'openai',
    apiKey: 'sk-test-12345',
    baseUrl: 'https://api.openai.com/v1',
  },
  anthropic: {
    provider: 'anthropic',
    apiKey: 'test-anthropic-key-12345',
    baseUrl: 'https://api.anthropic.com/v1',
  },
  gemini: {
    provider: 'gemini',
    apiKey: 'test-gemini-key-12345',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  },
};

/**
 * OpenAI/OpenRouter format response
 */
export const MOCK_OPENAI_RESPONSE = {
  id: 'chatcmpl-test123',
  object: 'chat.completion',
  created: 1704067200,
  model: 'gpt-4-vision',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: 'This is a test image analysis result. The image contains test data.',
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
  },
};

/**
 * Anthropic format response
 */
export const MOCK_ANTHROPIC_RESPONSE = {
  id: 'msg_test123',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: 'This is a test image analysis result. The image contains test data.',
    },
  ],
  model: 'claude-3-5-sonnet-20241022',
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: {
    input_tokens: 100,
    output_tokens: 50,
  },
};

/**
 * OpenAI format request body (what node sends to API)
 */
export const MOCK_OPENAI_REQUEST = {
  model: 'gpt-4-vision',
  messages: [
    {
      role: 'system',
      content: 'You are an AI assistant specialized in image understanding and visual analysis.',
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Analyze this test image' },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${TINY_JPEG_BASE64}`,
            detail: 'auto',
          },
        },
      ],
    },
  ],
  temperature: 0.2,
  max_tokens: 1024,
  top_p: 0.9,
};

/**
 * Anthropic format request body
 */
export const MOCK_ANTHROPIC_REQUEST = {
  model: 'claude-3-5-sonnet-20241022',
  system: 'You are an AI assistant specialized in image understanding and visual analysis.',
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: TINY_JPEG_BASE64,
          },
        },
        {
          type: 'text',
          text: 'Analyze this test image',
        },
      ],
    },
  ],
  temperature: 0.2,
  max_tokens: 1024,
  top_p: 0.9,
};

/**
 * Error responses for different API error scenarios
 */
export const MOCK_ERROR_RESPONSES = {
  UNAUTHORIZED: {
    status: 401,
    body: {
      error: {
        message: 'Invalid API key provided',
        type: 'invalid_request_error',
        param: 'Authorization',
        code: 'invalid_api_key',
      },
    },
  },
  BAD_REQUEST: {
    status: 400,
    body: {
      error: {
        message: 'Request body is invalid',
        type: 'invalid_request_error',
      },
    },
  },
  RATE_LIMIT: {
    status: 429,
    body: {
      error: {
        message: 'Rate limit exceeded',
        type: 'server_error',
        code: 'rate_limit_exceeded',
      },
    },
  },
  SERVER_ERROR: {
    status: 500,
    body: {
      error: {
        message: 'Internal server error',
        type: 'server_error',
      },
    },
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    body: {
      error: {
        message: 'Service temporarily unavailable',
        type: 'server_error',
      },
    },
  },
};

/**
 * Mock n8n item with binary data
 */
export const MOCK_ITEM_WITH_BINARY = {
  json: {
    fileName: 'test.jpg',
    size: 15000,
  },
  binary: {
    data: {
      data: Buffer.from(TINY_JPEG_BASE64, 'base64'),
      mimeType: 'image/jpeg',
      fileName: 'test.jpg',
    },
  },
};

/**
 * Mock n8n item with base64 data
 */
export const MOCK_ITEM_WITH_BASE64 = {
  json: {
    imageData: TINY_JPEG_BASE64,
    format: 'jpeg',
  },
};

/**
 * Mock n8n item with URL
 */
export const MOCK_ITEM_WITH_URL = {
  json: {
    imageUrl: TEST_IMAGE_URL,
    source: 'web',
  },
};

/**
 * Mock node parameters for typical analysis
 */
export const MOCK_NODE_PARAMS = {
  basic: {
    model: 'gpt-4-vision',
    imageSource: 'base64',
    prompt: 'Analyze this test image',
    base64Data: TINY_JPEG_BASE64,
    base64MimeType: 'image/jpeg',
    modelParameters: {
      temperature: 0.2,
      maxTokens: 1024,
      topP: 0.9,
      imageDetail: 'auto',
    },
    advancedOptions: {},
    outputPropertyName: 'analysis',
  },
  withMetadata: {
    model: 'gpt-4-vision',
    imageSource: 'base64',
    prompt: 'Analyze this test image',
    base64Data: TINY_JPEG_BASE64,
    base64MimeType: 'image/jpeg',
    modelParameters: {
      temperature: 0.2,
      maxTokens: 1024,
      topP: 0.9,
      imageDetail: 'auto',
    },
    advancedOptions: {
      includeMetadata: true,
    },
    outputPropertyName: 'analysis',
  },
  withCustomHeaders: {
    model: 'gpt-4-vision',
    imageSource: 'base64',
    prompt: 'Analyze this test image',
    base64Data: TINY_JPEG_BASE64,
    base64MimeType: 'image/jpeg',
    modelParameters: {
      temperature: 0.2,
      maxTokens: 1024,
      topP: 0.9,
      imageDetail: 'auto',
    },
    advancedOptions: {
      customHeaders: {
        headers: [
          { name: 'X-Custom-Header', value: 'custom-value' },
          { name: 'X-Request-ID', value: 'test-123' },
        ],
      },
    },
    outputPropertyName: 'analysis',
  },
  withJsonResponse: {
    model: 'gpt-4-vision',
    imageSource: 'base64',
    prompt: 'Extract data as JSON',
    base64Data: TINY_JPEG_BASE64,
    base64MimeType: 'image/jpeg',
    modelParameters: {
      temperature: 0.2,
      maxTokens: 1024,
      topP: 0.9,
      imageDetail: 'auto',
    },
    advancedOptions: {
      responseFormat: 'json_object',
    },
    outputPropertyName: 'analysis',
  },
  withSystemPrompt: {
    model: 'gpt-4-vision',
    imageSource: 'base64',
    prompt: 'Analyze this test image',
    base64Data: TINY_JPEG_BASE64,
    base64MimeType: 'image/jpeg',
    modelParameters: {
      temperature: 0.2,
      maxTokens: 1024,
      topP: 0.9,
      imageDetail: 'auto',
    },
    advancedOptions: {
      systemPrompt: 'You are an expert image analyst. Be very precise.',
    },
    outputPropertyName: 'analysis',
  },
};

/**
 * Mock output for testing response processing
 */
export const MOCK_OUTPUT = {
  analysis: 'This is a test image analysis result. The image contains test data.',
  metadata: {
    model: 'gpt-4-vision',
    usage: {
      input_tokens: 100,
      output_tokens: 50,
    },
    finish_reason: 'stop',
  },
};

/**
 * Provider-specific endpoint paths
 */
export const PROVIDER_ENDPOINTS = {
  openrouter: '/chat/completions',
  groq: '/chat/completions',
  grok: '/chat/completions',
  openai: '/chat/completions',
  anthropic: '/messages',
  gemini: '/chat/completions',
};

/**
 * Provider-specific base URLs for mocking
 */
export const PROVIDER_BASE_URLS = {
  openrouter: 'https://openrouter.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
  grok: 'https://api.x.ai/v1',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/',
};

/**
 * Test constants for timeout and retry scenarios
 */
export const TEST_CONSTANTS = {
  TIMEOUT_MS: 60000, // 60 seconds, matches node timeout
  SHORT_TIMEOUT_MS: 100, // For testing timeout errors
  REQUEST_DELAY_MS: 50, // Delay for async operations
};

/**
 * Headers commonly added by providers
 */
export const COMMON_HEADERS = {
  openRouter: {
    'HTTP-Referer': 'https://example.com',
    'X-Title': 'n8n Workflow',
  },
};
