# Architecture Guide - Universal LLM Vision Node

This document describes the **actual architecture** used in the Universal LLM Vision n8n node, which uses a **programmatic pattern** with the **Strategy design pattern** for provider abstraction.

## Programmatic Node Architecture

This node implements a **programmatic node** (not declarative) using the `execute()` method for full control over request/response handling, image processing, and provider-specific logic.

### Why Programmatic?

- **Complex Logic**: Image processing, format detection, and validation
- **Multi-Provider Support**: Different request/response formats per provider
- **Custom Processing**: Smart MIME type detection with magic bytes
- **Fine-grained Control**: Complete control over HTTP requests and responses
- **Error Handling**: Detailed error messages with helpful debugging info

### Architecture Layers

```
UniversalLlmVision.node.ts (Main Node)
    ↓
┌─────────────────────────────┐
│   execute() Method          │
│ (Programmatic Orchestrator) │
└────────┬────────────────────┘
         │
    ┌────┴────┬───────────────┬──────────────┐
    ↓         ↓               ↓              ↓
ImageProcessor RequestHandler ResponseProcessor Handlers
  (Prepare)     (Build HTTP)    (Parse Results)   & Utils
    ↓         ↓               ↓              ↓
Config:      Strategy      GenericFunctions Config:
 SIZE_LIMIT  Pattern       (Extraction)    TIMEOUT
 FORMATS     (IProvider)    HEADERS         DEFAULTS
 BASE64      Implementations
```

## Strategy Pattern Implementation

This node uses the **Strategy design pattern** to handle different LLM vision providers without complex if/else logic.

### Core Concept

```
IProviderStrategy Interface
    ↓
    ├─ OpenAiStrategy (OpenAI, OpenRouter, Groq, Grok, Gemini)
    ├─ AnthropicStrategy (Anthropic Claude)
    └─ CustomOpenAiStrategy (Custom OpenAI-compatible endpoints)
```

### Strategy Interface

```typescript
export interface IProviderStrategy {
  name: string;
  displayName: string;
  baseUrl: string;
  apiEndpoint: string;
  requestFormat: 'openai' | 'anthropic';
  responseFormat: 'openai' | 'anthropic';
  supportsImageDetail: boolean;
  supportsJsonResponse: boolean;

  buildHeaders(apiKey: string): Record<string, string>;
  getApiUrl(customBaseUrl?: string): string;
  buildRequestBody(options: ProviderRequestOptions): Record<string, any>;
  extractAnalysis(response: any): string;
  extractMetadata(response: any): Record<string, any>;
}
```

### Benefits

- **No if/else chains**: Each provider is encapsulated in its own class
- **Easy to extend**: Add new providers by creating a new strategy class
- **Testable**: Each strategy can be tested independently
- **Maintainable**: Clear separation of concerns per provider
- **Reusable**: Strategies can be composed and extended

## Execution Flow

```
1. UniversalLlmVision.execute()
   ├─ Detect credentials (OpenRouter or Universal)
   ├─ For each item:
   │
   ├─> ImageProcessor.getPreparedImage()
   │   ├─ Determine image source (binary/URL/base64)
   │   ├─ Load and validate image data
   │   ├─ Detect MIME type with magic bytes
   │   ├─ Check size limits (20MB default)
   │   └─ Return PreparedImage { data, mimeType, size, source }
   │
   ├─> RequestHandler.executeRequest()
   │   ├─ buildRequest() via GenericFunctions
   │   │   ├─ getProviderStrategy() from ProviderRegistry
   │   │   ├─ Call strategy.buildRequestBody()
   │   │   └─ Return { url, body, headers }
   │   ├─ Inject API key via strategy.buildHeaders()
   │   ├─ Merge custom headers
   │   └─ Execute HTTP POST with timeout (60s default)
   │
   └─> ResponseProcessor.processResponse()
       ├─ Extract analysis via strategy.extractAnalysis()
       ├─ Extract metadata via strategy.extractMetadata()
       └─ Return { analysis, metadata? }
```

## File Structure

```
nodes/UniversalLlmVision/
├── UniversalLlmVision.node.ts         # Main node class (programmatic)
│
├── processors/                        # Data processing modules
│   ├── ImageProcessor.ts              # Image loading, validation, MIME detection
│   └── ResponseProcessor.ts           # Response parsing and extraction
│
├── handlers/                          # Request execution
│   └── RequestHandler.ts              # HTTP request orchestration
│
├── utils/
│   └── GenericFunctions.ts            # Helper functions for request/response
│
├── providers/                         # Strategy pattern implementation
│   ├── IProviderStrategy.ts           # Strategy interface & base class
│   ├── OpenAiStrategy.ts              # OpenAI-compatible strategies
│   │   ├─ OpenAiStrategy
│   │   ├─ OpenRouterStrategy
│   │   ├─ GroqStrategy
│   │   ├─ GrokStrategy
│   │   ├─ GeminiStrategy
│   │   └─ CustomOpenAiStrategy
│   ├── AnthropicStrategy.ts           # Anthropic-specific strategy
│   └── ProviderRegistry.ts            # Factory and provider registry
│
└── constants/                         # Centralized constants
    └── config.ts                      # IMAGE_SIZE_LIMIT, TIMEOUT, FORMATS, etc.
```

## Constants Management

All magic numbers and hardcoded values are centralized in `constants/config.ts`:

```typescript
// Image limits
export const IMAGE_SIZE_LIMIT_MB = 20;
export const IMAGE_SIZE_LIMIT_BYTES = IMAGE_SIZE_LIMIT_MB * 1024 * 1024;

// Request configuration
export const REQUEST_TIMEOUT_MS = 60000;

// Image format validation
export const SUPPORTED_IMAGE_FORMATS = {
  jpeg: { extension: 'jpg|jpeg', mimeType: 'image/jpeg', magicBytes: [0xff, 0xd8, 0xff] },
  png: { extension: 'png', mimeType: 'image/png', magicBytes: [0x89, 0x50, 0x4e, 0x47] },
  // ...
};

// Model defaults
export const DEFAULT_MODEL_PARAMETERS = {
  temperature: 0.2,
  maxTokens: 1024,
  topP: 0.9,
  imageDetail: 'auto',
};
```

**Benefits**:
- Single source of truth for configuration
- Easy to adjust limits without touching business logic
- Centralized constants support A/B testing and tuning
- Type-safe configuration

## Provider Implementations

### OpenAI-Compatible Providers

The `OpenAiStrategy` base class handles the OpenAI request/response format:

```typescript
class OpenAiStrategy extends BaseProviderStrategy {
  // Builds: { model, messages, temperature, max_tokens, top_p, response_format }
  buildRequestBody() {
    // Standard OpenAI format
  }

  extractAnalysis(response) {
    return response.choices?.[0]?.message?.content || '';
  }
}
```

Subclasses override only the **authentication headers** and **endpoints**:

- **OpenRouterStrategy**: Adds referer and title headers
- **GroqStrategy**: Uses Groq's API endpoint
- **GrokStrategy**: Uses X.AI's API endpoint
- **GeminiStrategy**: Uses Google's API endpoint

### Anthropic Provider

The `AnthropicStrategy` implements Claude-specific format:

```typescript
class AnthropicStrategy extends BaseProviderStrategy {
  // Builds: { model, messages.content, temperature, max_tokens, system }
  buildRequestBody() {
    // Claude-specific message format
  }

  extractAnalysis(response) {
    return response.content?.[0]?.text || '';
  }
}
```

## Image Processing Pipeline

### 1. Image Source Detection

Supports three image input methods:
- **Binary**: File uploads from previous nodes
- **URL**: Public HTTP(S) URLs
- **Base64**: Raw base64-encoded data

### 2. Format Validation

Uses **magic bytes** for reliable format detection:

```
JPEG: FF D8 FF
PNG:  89 50 4E 47
WEBP: 52 49 46 46
GIF:  47 49 46 87
```

This prevents accepting corrupted files or misidentified formats.

### 3. Size Checking

Validates images against `IMAGE_SIZE_LIMIT_BYTES` (20MB default):
- Provides helpful error messages when exceeded
- Suggests compression strategies

### 4. MIME Type Detection

Smart detection hierarchy:
1. Magic bytes (most reliable)
2. Filename extension (fallback)
3. Metadata from binary source (n8n binary data)
4. User-provided MIME type (last resort)

## Error Handling Strategy

The node provides **detailed, actionable error messages**:

```typescript
// Clear error messages with context
throw new Error(
  `Image size exceeds maximum of ${IMAGE_SIZE_LIMIT_BYTES / 1024 / 1024}MB ` +
  `(got ${(buffer.length / 1024 / 1024).toFixed(2)}MB). ` +
  `Try compressing the image or using a smaller resolution.`
);

// Help users identify available properties
throw new Error(
  `Available binary properties: [${availableBinaryProps}]. ` +
  `Make sure the property name is correct (default: 'data')`
);
```

**Benefits**:
- Users can fix issues without contacting support
- Clear debugging information
- Prevents cryptic API errors
- Supports `continueOnFail()` for error recovery

## Performance Considerations

1. **Request Timeout**: 60 seconds (configurable via `REQUEST_TIMEOUT_MS`)
2. **Image Size Limit**: 20MB (configurable via `IMAGE_SIZE_LIMIT_BYTES`)
3. **Connection Pooling**: Uses n8n's built-in HTTP helper
4. **Provider Selection**: Minimal overhead via strategy pattern
5. **Memory Management**: Images are processed as buffers, not loaded into memory entirely

## Testing Architecture

Tests follow the same structure:

```
tests/
├── nodes/
│   └── UniversalLlmVision/
│       ├── UniversalLlmVision.node.test.ts      # Main node tests
│       ├── providers/
│       │   ├── OpenAiStrategy.test.ts           # Strategy tests
│       │   └── AnthropicStrategy.test.ts
│       └── processors/
│           ├── ImageProcessor.test.ts            # Processor tests
│           └── ResponseProcessor.test.ts
└── credentials/
    └── UniversalLlmVisionApi.credentials.test.ts
```

## Extending the Architecture

### Adding a New Provider

1. Create a new strategy class in `providers/`
2. Extend `BaseProviderStrategy` or implement `IProviderStrategy`
3. Implement the abstract methods (buildRequestBody, extractAnalysis, etc.)
4. Register in `ProviderRegistry.ts`
5. Add tests for the new strategy

### Modifying Request Format

Override `buildRequestBody()` in your strategy to support custom formats.

### Adding New Constants

Add to `constants/config.ts` and import where needed:
- Ensures consistency across the codebase
- Makes tuning easy without code changes

## Design Principles

1. **Single Responsibility**: Each class has one reason to change
2. **Open/Closed Principle**: Open for extension (new strategies), closed for modification
3. **Dependency Inversion**: Depends on abstractions (IProviderStrategy), not concrete implementations
4. **DRY (Don't Repeat Yourself)**: Constants centralized, common logic in base classes
5. **Explicit Over Implicit**: Clear error messages, obvious data flow

## Trade-offs vs. Declarative

| Aspect | Programmatic | Declarative |
|--------|-------------|------------|
| **Complexity** | Higher | Lower |
| **Flexibility** | Very High | Limited |
| **Error Messages** | Custom & Detailed | Generic n8n |
| **Image Processing** | Full Control | Not Supported |
| **Provider Support** | Easy to Add | Difficult |
| **Code Volume** | More | Less |
| **Learning Curve** | Steeper | Gentle |

This node uses **programmatic** because the complexity and customization requirements justify it.
