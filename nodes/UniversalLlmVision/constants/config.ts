/**
 * Configuration Constants
 * Centralized constants for image processing, API requests, and model defaults
 */

/**
 * Image Size Limit in MB
 * Maximum allowed image size for processing
 */
export const IMAGE_SIZE_LIMIT_MB = 20;

/**
 * Image Size Limit in Bytes
 * Maximum allowed image size in bytes (20MB)
 */
export const IMAGE_SIZE_LIMIT_BYTES = IMAGE_SIZE_LIMIT_MB * 1024 * 1024;

/**
 * Request Timeout in Milliseconds
 * Maximum time to wait for API response
 */
export const REQUEST_TIMEOUT_MS = 60000; // 60 seconds

/**
 * Base64 Validation Regex
 * Pattern to validate base64 encoded strings
 */
export const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Default MIME Type for Binary Data
 * Fallback MIME type when detection fails
 */
export const DEFAULT_MIME_TYPE = 'application/octet-stream';

/**
 * Supported Image Formats with Magic Bytes
 * Used for format detection and validation
 */
export const SUPPORTED_IMAGE_FORMATS = {
  jpeg: {
    extension: 'jpg|jpeg',
    mimeType: 'image/jpeg',
    magicBytes: [0xff, 0xd8, 0xff], // JPEG magic bytes
  },
  png: {
    extension: 'png',
    mimeType: 'image/png',
    magicBytes: [0x89, 0x50, 0x4e, 0x47], // PNG magic bytes
  },
  webp: {
    extension: 'webp',
    mimeType: 'image/webp',
    magicBytes: [0x52, 0x49, 0x46, 0x46], // WEBP magic bytes (simplified)
  },
  gif: {
    extension: 'gif',
    mimeType: 'image/gif',
    magicBytes: [0x47, 0x49, 0x46], // GIF magic bytes
  },
} as const;

/**
 * Default Model Parameters
 * Standard values for model inference configuration
 */
export const DEFAULT_MODEL_PARAMETERS = {
  temperature: 0.2,
  maxTokens: 1024,
  topP: 0.9,
  imageDetail: 'auto', // 'auto', 'low', 'high' - provider dependent
} as const;

/**
 * Supported Model Capabilities
 * Define which capabilities each model supports
 */
export const MODEL_CAPABILITIES = {
  supportsImageDetail: ['openai', 'groq', 'grok', 'openrouter', 'gemini'],
  supportsJsonResponse: ['openai', 'groq', 'grok', 'openrouter', 'gemini'],
} as const;
