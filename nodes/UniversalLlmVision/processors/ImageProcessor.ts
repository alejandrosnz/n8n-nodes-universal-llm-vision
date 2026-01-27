import type { IExecuteFunctions } from 'n8n-workflow';
import { IMAGE_SIZE_LIMIT_BYTES, BASE64_REGEX, SUPPORTED_IMAGE_FORMATS, ERROR_MESSAGES } from '../constants/config';
import { getImageFromSource } from '../utils/ImageSourceHelpers';

/**
 * Image processing utilities and types
 */

export interface MimeTypeConfig {
  extension: string;
  mimeType: string;
  magicBytes: number[];
}

export interface PreparedImage {
  data: string; // Base64 encoded or URL
  mimeType: string;
  size: number;
  source: 'binary' | 'base64' | 'url';
}

// MIME type definitions with magic bytes for detection
export const SUPPORTED_MIME_TYPES: Record<string, MimeTypeConfig> = SUPPORTED_IMAGE_FORMATS as any;

/**
 * Detect MIME type from file extension
 * @param filename - Filename with extension
 * @returns string | null - MIME type or null if not detected
 */
export function detectMimeTypeFromExtension(filename: string): string | null {
  if (!filename) return null;

  const ext = filename.toLowerCase().split('.').pop();
  if (!ext) return null;

  // eslint-disable-next-line no-unused-vars
  for (const [_, mimeConfig] of Object.entries(SUPPORTED_MIME_TYPES)) {
    const extensions = mimeConfig.extension.split('|');
    if (extensions.includes(ext)) {
      return mimeConfig.mimeType;
    }
  }

  return null;
}

/**
 * Detect MIME type from base64 magic bytes
 * @param base64Data - Base64 encoded image data
 * @returns string | null - MIME type or null if not detected
 */
export function detectMimeTypeFromBase64(base64Data: string): string | null {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Check magic bytes for each MIME type
    // eslint-disable-next-line no-unused-vars
    for (const [_, mimeConfig] of Object.entries(SUPPORTED_MIME_TYPES)) {
      const magicBytes = mimeConfig.magicBytes;
      let match = true;

      for (let i = 0; i < magicBytes.length; i++) {
        if (buffer[i] !== magicBytes[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        return mimeConfig.mimeType;
      }
    }
  } catch {
    // Invalid base64 data
    return null;
  }

  return null;
}

/**
 * Validate if MIME type is supported
 * @param mimeType - MIME type to check
 * @returns boolean - True if supported
 */
export function isSupportedMimeType(mimeType: string): boolean {
  return Object.values(SUPPORTED_MIME_TYPES).some(config => config.mimeType === mimeType);
}

/**
 * Get all supported MIME types
 * @returns string[] - Array of supported MIME types
 */
export function getSupportedMimeTypes(): string[] {
  return Object.values(SUPPORTED_MIME_TYPES).map(config => config.mimeType);
}

/**
 * Validate base64 format
 * @param data - String to validate
 * @returns boolean - True if valid base64
 */
export function isValidBase64(data: string): boolean {
  try {
    return Buffer.from(data, 'base64').toString('base64') === data;
  } catch {
    return false;
  }
}

/**
 * Prepare image from different sources (binary, base64, URL)
 * Validates format, size, and MIME type with smart detection
 * @param source - Image source type
 * @param imageData - Image data (varies by source)
 * @param filename - Optional filename for MIME detection
 * @returns Promise<PreparedImage> - Validated and prepared image object
 * @throws Error if image is invalid, unsupported, or too large
 */
export async function prepareImage(
  source: 'binary' | 'base64' | 'url',
  imageData: any,
  filename?: string,
): Promise<PreparedImage> {
  const maxSize = IMAGE_SIZE_LIMIT_BYTES;

  if (source === 'binary') {
    if (!imageData) {
      throw new Error('Binary data is undefined or null. Make sure the previous node is outputting binary data.');
    }

    const availableProps = Object.keys(imageData).join(', ');

    if (!('data' in imageData) || typeof imageData.data !== 'string') {
      throw new Error(
        `Binary data object is missing 'data' property or it's not a string. ` +
        `Available properties: [${availableProps}]. ` +
        `This usually means the binary property name is incorrect or the previous node didn't output binary data.`
      );
    }

    if (!imageData.mimeType) {
      throw new Error(
        `Binary data object is missing 'mimeType' property. ` +
        `Available properties: [${availableProps}]. ` +
        `The previous node may not be setting the MIME type correctly.`
      );
    }

    // Try to detect MIME type from filename first
    let detectedMimeType = imageData.mimeType;

    if (filename) {
      const filenameBasedMime = detectMimeTypeFromExtension(filename);
      if (filenameBasedMime) {
        detectedMimeType = filenameBasedMime;
      }
    } else if (imageData.fileName) {
      // Si no se proporcionó filename pero existe en los metadatos binarios
      const filenameBasedMime = detectMimeTypeFromExtension(imageData.fileName);
      if (filenameBasedMime) {
        detectedMimeType = filenameBasedMime;
      }
    }

    // Verify MIME type
    if (!isSupportedMimeType(detectedMimeType)) {
      throw new Error(
        `Unsupported image format: ${detectedMimeType}. ` +
        `Supported formats: ${getSupportedMimeTypes().join(', ')}. ` +
        `If the MIME type is incorrect, try providing a filename with the correct extension.`
      );
    }

    // Verify base64 decoding and get size
    let buffer: Buffer;
    try {
      // First validate that it's valid base64
      if (!BASE64_REGEX.test(imageData.data)) {
        throw new Error('Invalid base64 format');
      }

      buffer = Buffer.from(imageData.data, 'base64');
    } catch (error) {
      throw new Error(
        `Failed to decode binary data as base64. ` +
        `The 'data' field may be corrupted or in an unexpected format. ` +
        `Error: ${(error as Error).message}`
      );
    }

    // Verificar tamaño
    if (buffer.length === 0) {
      throw new Error(
        `Binary data decoded to 0 bytes. The image data appears to be empty or corrupted.`
      );
    }

    if (buffer.length > maxSize) {
      throw new Error(
        `Image size exceeds maximum of ${IMAGE_SIZE_LIMIT_BYTES / 1024 / 1024}MB ` +
        `(got ${(buffer.length / 1024 / 1024).toFixed(2)}MB). ` +
        `Try compressing the image or using a smaller resolution.`
      );
    }

    // Verify magic bytes to confirm image type
    const detectedFromMagicBytes = detectMimeTypeFromBase64(imageData.data);
    if (detectedFromMagicBytes && detectedFromMagicBytes !== detectedMimeType) {
      console.warn(
        `Warning: MIME type mismatch. ` +
        `Metadata says ${detectedMimeType} but magic bytes indicate ${detectedFromMagicBytes}. ` +
        `Using magic bytes detection.`
      );
      detectedMimeType = detectedFromMagicBytes;
    }

    return {
      data: imageData.data,
      mimeType: detectedMimeType,
      size: buffer.length,
      source: 'binary',
    };
  }

  if (source === 'base64') {
    if (typeof imageData !== 'string') {
      throw new Error(`Base64 data must be a string, got ${typeof imageData}`);
    }

    if (!imageData || imageData.length === 0) {
      throw new Error('Base64 data is empty');
    }

    if (!isValidBase64(imageData)) {
      throw new Error(
        'Invalid base64 format. Make sure the data is properly base64-encoded without any data URI prefix.'
      );
    }

    const buffer = Buffer.from(imageData, 'base64');

    if (buffer.length === 0) {
      throw new Error('Base64 data decoded to 0 bytes');
    }

    if (buffer.length > maxSize) {
      throw new Error(
        `Image size exceeds maximum of ${IMAGE_SIZE_LIMIT_BYTES / 1024 / 1024}MB (got ${(buffer.length / 1024 / 1024).toFixed(2)}MB)`
      );
    }

    // Auto-detect MIME type from magic bytes
    let mimeType = detectMimeTypeFromBase64(imageData);

    if (!mimeType && filename) {
      // Try to detect from filename if magic bytes fail
      mimeType = detectMimeTypeFromExtension(filename);
    }

    if (!mimeType) {
      throw new Error(
        'Could not detect image format from the data. ' +
        'Please provide a filename with extension or ensure the image data is valid. ' +
        `Supported formats: ${getSupportedMimeTypes().join(', ')}`
      );
    }

    if (!isSupportedMimeType(mimeType)) {
      throw new Error(
        `Unsupported image format: ${mimeType}. Supported: ${getSupportedMimeTypes().join(', ')}`
      );
    }

    return {
      data: imageData,
      mimeType,
      size: buffer.length,
      source: 'base64',
    };
  }

  if (source === 'url') {
    if (typeof imageData !== 'string') {
      throw new Error(`URL data must be a string, got ${typeof imageData}`);
    }

    if (!imageData || imageData.trim().length === 0) {
      throw new Error('Image URL is empty');
    }

    // Validate URL
    try {
      new URL(imageData);
    } catch (error) {
      throw new Error(
        `Invalid image URL: "${imageData}". ` +
        `Make sure it's a valid HTTP(S) URL. Error: ${(error as Error).message}`
      );
    }

    // Basic security checks
    const sanitizedUrl = imageData.trim();
    if (sanitizedUrl.toLowerCase().includes('<script') || sanitizedUrl.toLowerCase().includes('javascript:')) {
      throw new Error(ERROR_MESSAGES.UNSAFE_URL);
    }

    // Check protocol (only allow http and https)
    if (!sanitizedUrl.toLowerCase().startsWith('http://') && !sanitizedUrl.toLowerCase().startsWith('https://')) {
      throw new Error(ERROR_MESSAGES.INVALID_URL);
    }

    return {
      data: sanitizedUrl,
      mimeType: 'url',
      size: sanitizedUrl.length,
      source: 'url',
    };
  }

  throw new Error(`Unknown image source type: ${source}. Must be 'binary', 'base64', or 'url'`);
}

/**
 * Get MIME type options for user selection (when auto-detection fails)
 * @returns Array of MIME type options for UI dropdown
 */
export function getMimeTypeOptions() {
  return Object.values(SUPPORTED_MIME_TYPES).map(config => ({
    name: config.mimeType,
    value: config.mimeType,
  }));
}

/**
 * ImageProcessor class handles image data extraction and preparation from different sources
 * Supports binary data from previous nodes, base64 strings, and public URLs
 */
export class ImageProcessor {
  private executeFunctions: IExecuteFunctions;

  constructor(executeFunctions: IExecuteFunctions) {
    this.executeFunctions = executeFunctions;
  }

  /**
   * Get and prepare image data from node parameters
   * Uses shared ImageSourceHelpers for consistent image extraction
   * @param itemIndex - The index of the item being processed
   * @returns Promise<PreparedImage> - The prepared image with validated data, MIME type, and size
   * @throws Error if image data is invalid, unsupported format, or exceeds size limits
   */
  async getPreparedImage(itemIndex: number): Promise<PreparedImage> {
    // Use shared helper to extract and validate image from any source
    const imageResult = await getImageFromSource(this.executeFunctions, itemIndex, false);

    // Return in PreparedImage format
    return {
      data: imageResult.data,
      mimeType: imageResult.mimeType,
      size: imageResult.size,
      source: imageResult.source,
    };
  }
}