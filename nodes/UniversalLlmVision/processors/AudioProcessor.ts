import type { IExecuteFunctions } from 'n8n-workflow';
import {
  AUDIO_SIZE_LIMIT_BYTES,
  SUPPORTED_AUDIO_FORMATS,
  BASE64_REGEX,
  ERROR_MESSAGES,
} from '../constants/config';

/**
 * Audio processing utilities and types
 */

/**
 * Prepared audio data structure — mirrors PreparedImage for consistency
 */
export interface PreparedAudio {
  /** Base64-encoded audio data, or a URL string when source is 'url' */
  data: string;
  /** MIME type, e.g. 'audio/mpeg' */
  mimeType: string;
  /** OpenAI-compatible short format name, e.g. 'mp3', 'wav' */
  format: string;
  /** Data size in bytes (URL length for url source) */
  size: number;
  /** Where the data came from */
  source: 'binary' | 'base64' | 'url';
}

/**
 * Supported audio MIME type config, derived from SUPPORTED_AUDIO_FORMATS
 */
export type AudioFormatConfig = {
  extension: string;
  mimeType: string;
  format: string;
};

/** Flat list of unique MIME-to-format configs */
const AUDIO_MIME_CONFIGS: AudioFormatConfig[] = Object.values(SUPPORTED_AUDIO_FORMATS);

/**
 * Resolve MIME type string to the short format name expected by providers (e.g. 'audio/mpeg' → 'mp3')
 * Returns null if not recognised.
 */
export function mimeTypeToAudioFormat(mimeType: string): string | null {
  const normalised = mimeType.toLowerCase().split(';')[0].trim();
  const found = AUDIO_MIME_CONFIGS.find((c) => c.mimeType === normalised);
  return found ? found.format : null;
}

/**
 * Resolve a file extension to the corresponding MIME type (e.g. 'mp3' → 'audio/mpeg')
 * Returns null if not recognised.
 */
export function extensionToAudioMimeType(filename: string): string | null {
  if (!filename) return null;
  const ext = filename.toLowerCase().split('.').pop();
  if (!ext) return null;
  const found = AUDIO_MIME_CONFIGS.find((c) => {
    const exts = c.extension.split('|');
    return exts.includes(ext);
  });
  return found ? found.mimeType : null;
}

/**
 * Return all supported MIME types as a comma-separated string for error messages
 */
export function getSupportedAudioMimeTypes(): string[] {
  // Unique values only
  return [...new Set(AUDIO_MIME_CONFIGS.map((c) => c.mimeType))];
}

/**
 * Validate and prepare audio from different sources (binary, base64, URL)
 *
 * @param source - Audio source type
 * @param audioData - Audio data (varies by source)
 * @param mimeTypeHint - Explicit MIME type hint (used for base64 source or binary override)
 * @param filename - Optional filename for format detection
 * @returns PreparedAudio - Validated and prepared audio object
 * @throws Error if audio data is invalid, unsupported format, or exceeds size limits
 */
export async function prepareAudio(
  source: 'binary' | 'base64' | 'url',
  audioData: any,
  mimeTypeHint?: string,
  filename?: string
): Promise<PreparedAudio> {
  const maxSize = AUDIO_SIZE_LIMIT_BYTES;

  // ──────────────────────────────────────────────
  // Binary source
  // ──────────────────────────────────────────────
  if (source === 'binary') {
    if (!audioData) {
      throw new Error(
        'Binary data is undefined or null. Make sure the previous node is outputting binary data.'
      );
    }

    const availableProps = Object.keys(audioData).join(', ');

    if (!('data' in audioData) || typeof audioData.data !== 'string') {
      throw new Error(
        `Binary data object is missing 'data' property or it's not a string. ` +
          `Available properties: [${availableProps}]. ` +
          `This usually means the binary property name is incorrect or the previous node didn't output binary data.`
      );
    }

    // Resolve MIME type: explicit filename override > binary metadata fileName > binary mimeType
    let detectedMimeType: string = audioData.mimeType || '';

    const filenameToCheck = filename || audioData.fileName || '';
    if (filenameToCheck) {
      const fromFilename = extensionToAudioMimeType(filenameToCheck);
      if (fromFilename) detectedMimeType = fromFilename;
    }

    // Accept explicit hint from node parameter (highest priority when coming from binary)
    if (mimeTypeHint && mimeTypeToAudioFormat(mimeTypeHint)) {
      detectedMimeType = mimeTypeHint;
    }

    const format = mimeTypeToAudioFormat(detectedMimeType);
    if (!format) {
      throw new Error(
        `Unsupported audio format: '${detectedMimeType}'. ` +
          `Supported formats: ${getSupportedAudioMimeTypes().join(', ')}. ` +
          `If the MIME type is incorrect, try providing a filename with the correct extension (e.g. audio.mp3).`
      );
    }

    // Strip whitespace (newlines, spaces) that n8n sometimes includes in binary base64 strings
    const cleanedData = audioData.data.replace(/\s/g, '');

    // Validate base64 data and check size
    if (!BASE64_REGEX.test(cleanedData)) {
      throw new Error('Invalid base64 format in binary data. The audio data may be corrupted.');
    }

    const buffer = Buffer.from(cleanedData, 'base64');

    if (buffer.length === 0) {
      throw new Error(ERROR_MESSAGES.EMPTY_AUDIO_BINARY_DATA);
    }

    if (buffer.length > maxSize) {
      throw new Error(
        `Audio size exceeds maximum of ${AUDIO_SIZE_LIMIT_BYTES / 1024 / 1024}MB ` +
          `(got ${(buffer.length / 1024 / 1024).toFixed(2)}MB). ` +
          `Try compressing the audio or splitting it into smaller segments.`
      );
    }

    return {
      data: cleanedData,
      mimeType: detectedMimeType,
      format,
      size: buffer.length,
      source: 'binary',
    };
  }

  // ──────────────────────────────────────────────
  // Base64 source
  // ──────────────────────────────────────────────
  if (source === 'base64') {
    if (typeof audioData !== 'string' || audioData.length === 0) {
      throw new Error('Base64 audio data must be a non-empty string.');
    }

    if (!BASE64_REGEX.test(audioData)) {
      throw new Error(
        'Invalid base64 format. Make sure the data is properly base64-encoded without any data URI prefix (no "data:audio/...;base64," prefix).'
      );
    }

    const buffer = Buffer.from(audioData, 'base64');

    if (buffer.length === 0) {
      throw new Error('Base64 audio data decoded to 0 bytes.');
    }

    if (buffer.length > maxSize) {
      throw new Error(
        `Audio size exceeds maximum of ${AUDIO_SIZE_LIMIT_BYTES / 1024 / 1024}MB (got ${(buffer.length / 1024 / 1024).toFixed(2)}MB)`
      );
    }

    // The user must provide the MIME type for base64 audio (no magic-bytes standard for audio)
    const resolvedMimeType = mimeTypeHint || 'audio/mpeg';
    const format = mimeTypeToAudioFormat(resolvedMimeType);

    if (!format) {
      throw new Error(
        `Unsupported audio format: '${resolvedMimeType}'. ` +
          `Supported formats: ${getSupportedAudioMimeTypes().join(', ')}.`
      );
    }

    return {
      data: audioData,
      mimeType: resolvedMimeType,
      format,
      size: buffer.length,
      source: 'base64',
    };
  }

  // ──────────────────────────────────────────────
  // URL source
  // ──────────────────────────────────────────────
  if (source === 'url') {
    if (typeof audioData !== 'string' || audioData.trim().length === 0) {
      throw new Error('Audio URL must be a non-empty string.');
    }

    const sanitizedUrl = audioData.trim();

    // Security checks
    if (
      sanitizedUrl.toLowerCase().includes('<script') ||
      sanitizedUrl.toLowerCase().includes('javascript:')
    ) {
      throw new Error('Potentially unsafe URL detected (contains script or javascript).');
    }

    if (
      !sanitizedUrl.toLowerCase().startsWith('http://') &&
      !sanitizedUrl.toLowerCase().startsWith('https://')
    ) {
      throw new Error('Audio URL must start with http:// or https://');
    }

    try {
      new URL(sanitizedUrl);
    } catch (error) {
      throw new Error(
        `Invalid audio URL: "${sanitizedUrl}". ` +
          `Make sure it is a valid HTTP(S) URL. Error: ${(error as Error).message}`
      );
    }

    // Try to guess the format from the URL path (best-effort)
    const urlPath = new URL(sanitizedUrl).pathname;
    const mimeFromUrl = extensionToAudioMimeType(urlPath);
    const resolvedMimeType = mimeFromUrl || mimeTypeHint || 'audio/mpeg';
    const format = mimeTypeToAudioFormat(resolvedMimeType) || 'mp3';

    return {
      data: sanitizedUrl,
      mimeType: resolvedMimeType,
      format,
      size: sanitizedUrl.length,
      source: 'url',
    };
  }

  throw new Error(`Unknown audio source type: ${source}. Must be 'binary', 'base64', or 'url'.`);
}

/**
 * AudioProcessor class — extracts and prepares audio data from n8n node parameters.
 * Mirrors the ImageProcessor API for consistency.
 */
export class AudioProcessor {
  private executeFunctions: IExecuteFunctions;

  constructor(executeFunctions: IExecuteFunctions) {
    this.executeFunctions = executeFunctions;
  }

  /**
   * Get and prepare audio data from node parameters
   * @param itemIndex - The index of the item being processed
   * @returns Promise<PreparedAudio>
   */
  async getPreparedAudio(itemIndex: number): Promise<PreparedAudio> {
    const ef = this.executeFunctions;
    const audioSource = ef.getNodeParameter('audioSource', itemIndex) as
      | 'binary'
      | 'base64'
      | 'url';

    if (audioSource === 'binary') {
      const propName = ef.getNodeParameter('audioBinaryPropertyName', itemIndex, 'data') as string;
      const filename = ef.getNodeParameter('audioFilename', itemIndex, '') as string;

      const items = ef.getInputData();
      const item = items[itemIndex];

      if (!item.binary) {
        throw new Error(ERROR_MESSAGES.NO_BINARY_DATA(propName, 'none'));
      }

      const binProp = item.binary[propName];
      if (!binProp) {
        const available = Object.keys(item.binary).join(', ');
        throw new Error(ERROR_MESSAGES.NO_BINARY_DATA(propName, available));
      }

      return prepareAudio('binary', binProp, undefined, filename || undefined);
    }

    if (audioSource === 'base64') {
      const base64Data = ef.getNodeParameter('audioBase64Data', itemIndex) as string;
      const mimeType = ef.getNodeParameter('audioMimeType', itemIndex, 'audio/mpeg') as string;
      return prepareAudio('base64', base64Data, mimeType);
    }

    if (audioSource === 'url') {
      const url = ef.getNodeParameter('audioUrl', itemIndex) as string;
      return prepareAudio('url', url);
    }

    throw new Error(`Unknown audioSource: ${audioSource}`);
  }
}
