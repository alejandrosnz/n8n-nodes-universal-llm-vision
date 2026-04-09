/**
 * Unit tests for AudioProcessor module
 * Covers utility functions, prepareAudio(), and the AudioProcessor class
 */

import {
  mimeTypeToAudioFormat,
  extensionToAudioMimeType,
  getSupportedAudioMimeTypes,
  prepareAudio,
  AudioProcessor,
} from '../../../../nodes/UniversalLlmVision/processors/AudioProcessor';
import { AUDIO_SIZE_LIMIT_BYTES } from '../../../../nodes/UniversalLlmVision/constants/config';

/** 12-byte zero buffer → valid base64, well under size limit */
const SMALL_AUDIO_BASE64 = Buffer.alloc(12).toString('base64');

// ─────────────────────────────────────────────────────────────────────────────
// mimeTypeToAudioFormat
// ─────────────────────────────────────────────────────────────────────────────
describe('mimeTypeToAudioFormat', () => {
  it('should resolve audio/mpeg to mp3', () => {
    expect(mimeTypeToAudioFormat('audio/mpeg')).toBe('mp3');
  });

  it('should resolve audio/mp3 (alt MIME) to mp3', () => {
    expect(mimeTypeToAudioFormat('audio/mp3')).toBe('mp3');
  });

  it('should resolve audio/wav to wav', () => {
    expect(mimeTypeToAudioFormat('audio/wav')).toBe('wav');
  });

  it('should resolve audio/x-wav to wav', () => {
    expect(mimeTypeToAudioFormat('audio/x-wav')).toBe('wav');
  });

  it('should resolve audio/ogg to ogg', () => {
    expect(mimeTypeToAudioFormat('audio/ogg')).toBe('ogg');
  });

  it('should resolve audio/mp4 to mp4', () => {
    expect(mimeTypeToAudioFormat('audio/mp4')).toBe('mp4');
  });

  it('should resolve audio/webm to webm', () => {
    expect(mimeTypeToAudioFormat('audio/webm')).toBe('webm');
  });

  it('should resolve audio/flac to flac', () => {
    expect(mimeTypeToAudioFormat('audio/flac')).toBe('flac');
  });

  it('should resolve audio/x-flac to flac', () => {
    expect(mimeTypeToAudioFormat('audio/x-flac')).toBe('flac');
  });

  it('should resolve audio/aac to aac', () => {
    expect(mimeTypeToAudioFormat('audio/aac')).toBe('aac');
  });

  it('should be case-insensitive', () => {
    expect(mimeTypeToAudioFormat('Audio/MPEG')).toBe('mp3');
    expect(mimeTypeToAudioFormat('AUDIO/WAV')).toBe('wav');
  });

  it('should strip charset suffix', () => {
    expect(mimeTypeToAudioFormat('audio/mpeg; charset=utf-8')).toBe('mp3');
  });

  it('should return null for unsupported MIME types', () => {
    expect(mimeTypeToAudioFormat('image/jpeg')).toBeNull();
    expect(mimeTypeToAudioFormat('video/mp4')).toBeNull();
    expect(mimeTypeToAudioFormat('application/octet-stream')).toBeNull();
    expect(mimeTypeToAudioFormat('')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extensionToAudioMimeType
// ─────────────────────────────────────────────────────────────────────────────
describe('extensionToAudioMimeType', () => {
  it('should resolve .mp3 to audio/mpeg', () => {
    expect(extensionToAudioMimeType('audio.mp3')).toBe('audio/mpeg');
  });

  it('should resolve .wav to audio/wav', () => {
    expect(extensionToAudioMimeType('audio.wav')).toBe('audio/wav');
  });

  it('should resolve .ogg to audio/ogg', () => {
    expect(extensionToAudioMimeType('audio.ogg')).toBe('audio/ogg');
  });

  it('should resolve .mp4 to audio/mp4', () => {
    expect(extensionToAudioMimeType('audio.mp4')).toBe('audio/mp4');
  });

  it('should resolve .m4a to audio/mp4', () => {
    expect(extensionToAudioMimeType('audio.m4a')).toBe('audio/mp4');
  });

  it('should resolve .webm to audio/webm', () => {
    expect(extensionToAudioMimeType('audio.webm')).toBe('audio/webm');
  });

  it('should resolve .flac to audio/flac', () => {
    expect(extensionToAudioMimeType('audio.flac')).toBe('audio/flac');
  });

  it('should resolve .aac to audio/aac', () => {
    expect(extensionToAudioMimeType('audio.aac')).toBe('audio/aac');
  });

  it('should be case-insensitive', () => {
    expect(extensionToAudioMimeType('TRACK.MP3')).toBe('audio/mpeg');
    expect(extensionToAudioMimeType('Song.WAV')).toBe('audio/wav');
  });

  it('should return null for unknown extension', () => {
    expect(extensionToAudioMimeType('audio.txt')).toBeNull();
    expect(extensionToAudioMimeType('audio.bmp')).toBeNull();
    expect(extensionToAudioMimeType('audio.pdf')).toBeNull();
  });

  it('should return null for filename without extension', () => {
    expect(extensionToAudioMimeType('audiofile')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(extensionToAudioMimeType('')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getSupportedAudioMimeTypes
// ─────────────────────────────────────────────────────────────────────────────
describe('getSupportedAudioMimeTypes', () => {
  it('should return a non-empty array', () => {
    const types = getSupportedAudioMimeTypes();
    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBeGreaterThan(0);
  });

  it('should include all expected MIME types', () => {
    const types = getSupportedAudioMimeTypes();
    expect(types).toContain('audio/mpeg');
    expect(types).toContain('audio/wav');
    expect(types).toContain('audio/ogg');
    expect(types).toContain('audio/mp4');
    expect(types).toContain('audio/webm');
    expect(types).toContain('audio/flac');
    expect(types).toContain('audio/aac');
  });

  it('should return unique values only', () => {
    const types = getSupportedAudioMimeTypes();
    const unique = [...new Set(types)];
    expect(types.length).toBe(unique.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// prepareAudio — binary source
// ─────────────────────────────────────────────────────────────────────────────
describe('prepareAudio — binary source', () => {
  const validBinaryData = {
    data: SMALL_AUDIO_BASE64,
    mimeType: 'audio/mpeg',
    fileName: 'test.mp3',
  };

  it('should prepare binary audio successfully', async () => {
    const result = await prepareAudio('binary', validBinaryData);
    expect(result.source).toBe('binary');
    expect(result.mimeType).toBe('audio/mpeg');
    expect(result.format).toBe('mp3');
    expect(result.data).toBe(validBinaryData.data);
    expect(result.size).toBeGreaterThan(0);
  });

  it('should detect MIME type from fileName overriding mimeType', async () => {
    const data = {
      data: SMALL_AUDIO_BASE64,
      mimeType: 'application/octet-stream',
      fileName: 'track.wav',
    };
    const result = await prepareAudio('binary', data);
    expect(result.mimeType).toBe('audio/wav');
    expect(result.format).toBe('wav');
  });

  it('should apply mimeTypeHint with highest priority', async () => {
    const data = { data: SMALL_AUDIO_BASE64, mimeType: 'audio/mpeg', fileName: 'track.wav' };
    const result = await prepareAudio('binary', data, 'audio/ogg');
    expect(result.mimeType).toBe('audio/ogg');
    expect(result.format).toBe('ogg');
  });

  it('should use explicit filename param over binary metadata fileName', async () => {
    const data = { data: SMALL_AUDIO_BASE64, mimeType: 'audio/mpeg', fileName: 'old.mp3' };
    const result = await prepareAudio('binary', data, undefined, 'new.wav');
    expect(result.mimeType).toBe('audio/wav');
    expect(result.format).toBe('wav');
  });

  it('should throw error for null binary data', async () => {
    await expect(prepareAudio('binary', null)).rejects.toThrow('Binary data is undefined or null');
  });

  it('should throw error for undefined binary data', async () => {
    await expect(prepareAudio('binary', undefined)).rejects.toThrow(
      'Binary data is undefined or null'
    );
  });

  it('should throw error for binary data missing data property', async () => {
    await expect(prepareAudio('binary', { mimeType: 'audio/mpeg' })).rejects.toThrow(
      "missing 'data' property"
    );
  });

  it('should throw error for unsupported MIME type', async () => {
    const data = { data: SMALL_AUDIO_BASE64, mimeType: 'video/mp4' };
    await expect(prepareAudio('binary', data)).rejects.toThrow('Unsupported audio format');
  });

  it('should throw error for invalid base64 data', async () => {
    const data = { data: 'not!valid!base64!!!', mimeType: 'audio/mpeg' };
    await expect(prepareAudio('binary', data)).rejects.toThrow('Invalid base64 format');
  });

  it('should throw error when decoded buffer is empty', async () => {
    const emptyBase64 = Buffer.from('').toString('base64'); // '' — passes regex, decodes to 0 bytes
    const data = { data: emptyBase64, mimeType: 'audio/mpeg' };
    await expect(prepareAudio('binary', data)).rejects.toThrow();
  });

  it('should throw error for oversized binary audio', async () => {
    const largeBuffer = Buffer.alloc(AUDIO_SIZE_LIMIT_BYTES + 1);
    const data = { data: largeBuffer.toString('base64'), mimeType: 'audio/mpeg' };
    await expect(prepareAudio('binary', data)).rejects.toThrow('Audio size exceeds maximum');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// prepareAudio — base64 source
// ─────────────────────────────────────────────────────────────────────────────
describe('prepareAudio — base64 source', () => {
  it('should prepare base64 audio successfully with explicit MIME type', async () => {
    const result = await prepareAudio('base64', SMALL_AUDIO_BASE64, 'audio/wav');
    expect(result.source).toBe('base64');
    expect(result.mimeType).toBe('audio/wav');
    expect(result.format).toBe('wav');
    expect(result.data).toBe(SMALL_AUDIO_BASE64);
    expect(result.size).toBeGreaterThan(0);
  });

  it('should default to audio/mpeg when no mimeTypeHint is provided', async () => {
    const result = await prepareAudio('base64', SMALL_AUDIO_BASE64);
    expect(result.mimeType).toBe('audio/mpeg');
    expect(result.format).toBe('mp3');
  });

  it('should resolve all supported MIME types correctly', async () => {
    const cases: Array<[string, string]> = [
      ['audio/wav', 'wav'],
      ['audio/ogg', 'ogg'],
      ['audio/mp4', 'mp4'],
      ['audio/webm', 'webm'],
      ['audio/flac', 'flac'],
      ['audio/aac', 'aac'],
    ];
    for (const [mimeType, expectedFormat] of cases) {
      const result = await prepareAudio('base64', SMALL_AUDIO_BASE64, mimeType);
      expect(result.format).toBe(expectedFormat);
    }
  });

  it('should throw error for non-string audioData', async () => {
    await expect(prepareAudio('base64', 12345 as any)).rejects.toThrow(
      'Base64 audio data must be a non-empty string'
    );
  });

  it('should throw error for empty string', async () => {
    await expect(prepareAudio('base64', '')).rejects.toThrow(
      'Base64 audio data must be a non-empty string'
    );
  });

  it('should throw error for invalid base64 format', async () => {
    await expect(prepareAudio('base64', 'not!valid!!!base64')).rejects.toThrow(
      'Invalid base64 format'
    );
  });

  it('should throw error for unsupported mimeTypeHint', async () => {
    await expect(prepareAudio('base64', SMALL_AUDIO_BASE64, 'video/mp4')).rejects.toThrow(
      'Unsupported audio format'
    );
  });

  it('should throw error for oversized base64 audio', async () => {
    const largeBuffer = Buffer.alloc(AUDIO_SIZE_LIMIT_BYTES + 1);
    await expect(
      prepareAudio('base64', largeBuffer.toString('base64'), 'audio/mpeg')
    ).rejects.toThrow('Audio size exceeds maximum');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// prepareAudio — URL source
// ─────────────────────────────────────────────────────────────────────────────
describe('prepareAudio — URL source', () => {
  it('should prepare a valid HTTPS URL successfully', async () => {
    const url = 'https://example.com/audio.mp3';
    const result = await prepareAudio('url', url);
    expect(result.source).toBe('url');
    expect(result.data).toBe(url);
    expect(result.mimeType).toBe('audio/mpeg');
    expect(result.format).toBe('mp3');
  });

  it('should prepare a valid HTTP URL successfully', async () => {
    const url = 'http://cdn.example.com/track.wav';
    const result = await prepareAudio('url', url);
    expect(result.source).toBe('url');
    expect(result.mimeType).toBe('audio/wav');
    expect(result.format).toBe('wav');
  });

  it('should detect MIME type from .m4a extension', async () => {
    const url = 'https://cdn.example.com/recordings/meeting.m4a';
    const result = await prepareAudio('url', url);
    expect(result.mimeType).toBe('audio/mp4');
    expect(result.format).toBe('mp4');
  });

  it('should use mimeTypeHint when URL has no recognisable extension', async () => {
    const url = 'https://api.example.com/v1/audio/stream';
    const result = await prepareAudio('url', url, 'audio/ogg');
    expect(result.mimeType).toBe('audio/ogg');
    expect(result.format).toBe('ogg');
  });

  it('should default to mp3/audio/mpeg when no extension and no hint', async () => {
    const url = 'https://api.example.com/audio';
    const result = await prepareAudio('url', url);
    expect(result.format).toBe('mp3');
  });

  it('should set size to the URL string length', async () => {
    const url = 'https://example.com/audio.wav';
    const result = await prepareAudio('url', url);
    expect(result.size).toBe(url.length);
  });

  it('should reject non-HTTP(S) URLs', async () => {
    await expect(prepareAudio('url', 'ftp://example.com/audio.mp3')).rejects.toThrow(
      'must start with http:// or https://'
    );
  });

  it('should reject empty URL', async () => {
    await expect(prepareAudio('url', '')).rejects.toThrow('non-empty string');
  });

  it('should reject URL containing javascript:', async () => {
    await expect(prepareAudio('url', 'javascript:alert(1)')).rejects.toThrow(
      'Potentially unsafe URL'
    );
  });

  it('should reject URL containing <script', async () => {
    await expect(prepareAudio('url', 'https://example.com/<script>audio.mp3')).rejects.toThrow(
      'Potentially unsafe URL'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// prepareAudio — unknown source
// ─────────────────────────────────────────────────────────────────────────────
describe('prepareAudio — unknown source', () => {
  it('should throw error for unknown source type', async () => {
    await expect(prepareAudio('unknown' as any, SMALL_AUDIO_BASE64)).rejects.toThrow(
      'Unknown audio source type: unknown'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Additional edge cases, boundary conditions, and security tests
// ─────────────────────────────────────────────────────────────────────────────

describe('prepareAudio — boundary size conditions', () => {
  it('should accept audio at exactly 25MB limit', async () => {
    const maxBuffer = Buffer.alloc(AUDIO_SIZE_LIMIT_BYTES);
    const result = await prepareAudio('binary', {
      data: maxBuffer.toString('base64'),
      mimeType: 'audio/mpeg',
    });
    expect(result.size).toBe(AUDIO_SIZE_LIMIT_BYTES);
  });

  it('should process very small audio (< 1KB)', async () => {
    const tinyBuffer = Buffer.alloc(512);
    const result = await prepareAudio('binary', {
      data: tinyBuffer.toString('base64'),
      mimeType: 'audio/wav',
    });
    expect(result.size).toBe(512);
    expect(result.source).toBe('binary');
  });

  it('should reject audio exactly 1 byte over limit', async () => {
    const oversizedBuffer = Buffer.alloc(AUDIO_SIZE_LIMIT_BYTES + 1);
    await expect(
      prepareAudio('base64', oversizedBuffer.toString('base64'), 'audio/mpeg')
    ).rejects.toThrow('Audio size exceeds maximum');
  });
});

describe('prepareAudio — URL security and edge cases', () => {
  it('should reject URLs with data: protocol', async () => {
    await expect(prepareAudio('url', 'data:audio/mpeg;base64,//NExAA==')).rejects.toThrow(
      /must start with http:\/\/ or https:\/\//
    );
  });

  it('should accept URLs with encoded characters (not actual script tags)', async () => {
    // Note: The security check looks for literal "<script" and "javascript:" in the URL string
    // URL-encoded versions (%3C, %3E) are technically safe since they're encoded
    const urlWithEncodedChars = 'https://example.com/%3Cscript%3Ealert(1)%3C/script%3E.mp3';
    const result = await prepareAudio('url', urlWithEncodedChars);
    expect(result.source).toBe('url');
    expect(result.mimeType).toBe('audio/mpeg');
  });

  it('should handle URLs with query parameters and fragments', async () => {
    const urlWithParams = 'https://api.example.com/audio.mp3?token=abc123&version=2#section1';
    const result = await prepareAudio('url', urlWithParams);
    expect(result.data).toBe(urlWithParams);
    expect(result.source).toBe('url');
  });

  it('should handle URLs with special characters (encoded)', async () => {
    const urlWithSpecialChars = 'https://example.com/audio%20file%20(1).mp3';
    const result = await prepareAudio('url', urlWithSpecialChars);
    expect(result.mimeType).toBe('audio/mpeg');
    expect(result.format).toBe('mp3');
  });
});

describe('prepareAudio — MIME type and format edge cases', () => {
  it('should handle MIME types with complex charset parameters', async () => {
    const result = await prepareAudio(
      'base64',
      SMALL_AUDIO_BASE64,
      'audio/mpeg; charset=utf-8; boundary=something'
    );
    expect(result.format).toBe('mp3');
    expect(result.mimeType).toBe('audio/mpeg; charset=utf-8; boundary=something');
  });

  it('should handle case variations in extensions (.MP3, .mP3, etc.)', async () => {
    const result1 = await prepareAudio('binary', {
      data: SMALL_AUDIO_BASE64,
      mimeType: 'application/octet-stream',
      fileName: 'TRACK.MP3',
    });
    const result2 = await prepareAudio('binary', {
      data: SMALL_AUDIO_BASE64,
      mimeType: 'application/octet-stream',
      fileName: 'track.mP3',
    });
    expect(result1.format).toBe('mp3');
    expect(result2.format).toBe('mp3');
  });

  it('should handle ambiguous extensions (m4a → audio/mp4)', async () => {
    const result = await prepareAudio('binary', {
      data: SMALL_AUDIO_BASE64,
      mimeType: 'application/octet-stream',
      fileName: 'podcast.m4a',
    });
    expect(result.mimeType).toBe('audio/mp4');
    expect(result.format).toBe('mp4');
  });
});

describe('prepareAudio — base64 encoding edge cases', () => {
  it('should accept valid base64 with line breaks and whitespace', async () => {
    const base64WithBreaks = SMALL_AUDIO_BASE64.match(/.{1,64}/g)?.join('\n') || SMALL_AUDIO_BASE64;
    // Base64 regex should handle this or prepareAudio should normalize it
    const result = await prepareAudio('base64', base64WithBreaks, 'audio/mpeg');
    expect(result.source).toBe('base64');
  });

  it('should reject truly invalid base64 characters', async () => {
    const invalidBase64 = 'SGVs!!!bG8gV29ybGQ='; // Contains invalid chars "!!!"
    await expect(prepareAudio('base64', invalidBase64, 'audio/mpeg')).rejects.toThrow(
      'Invalid base64 format'
    );
  });
});

describe('prepareAudio — binary source with multiple MIME detection priorities', () => {
  it('should prioritize mimeTypeHint > filename > binary mimeType', async () => {
    const binaryData = {
      data: SMALL_AUDIO_BASE64,
      mimeType: 'audio/mpeg',
      fileName: 'track.wav',
    };
    // mimeTypeHint has highest priority
    const result = await prepareAudio('binary', binaryData, 'audio/ogg');
    expect(result.format).toBe('ogg');
  });

  it('should handle binary data with no mimeType, no fileName, and no hint (should throw)', async () => {
    const binaryData = {
      data: SMALL_AUDIO_BASE64,
      // no mimeType, no fileName
    };
    await expect(prepareAudio('binary', binaryData)).rejects.toThrow('Unsupported audio format');
  });
});

describe('prepareAudio — multiple format conversion chains', () => {
  it('should correctly map all x-prefixed MIME types (x-wav, x-flac, etc.)', async () => {
    const cases = [
      ['audio/x-wav', 'wav'],
      ['audio/x-flac', 'flac'],
    ];
    for (const [mimeType, expectedFormat] of cases) {
      const result = await prepareAudio('base64', SMALL_AUDIO_BASE64, mimeType);
      expect(result.format).toBe(expectedFormat);
    }
  });

  it('should handle audio/mp3 alternate MIME type', async () => {
    const result = await prepareAudio('base64', SMALL_AUDIO_BASE64, 'audio/mp3');
    expect(result.format).toBe('mp3');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AudioProcessor class
// ─────────────────────────────────────────────────────────────────────────────
describe('AudioProcessor', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getInputData: jest.fn(),
    };
  });

  it('should be constructible', () => {
    const processor = new AudioProcessor(mockExecuteFunctions);
    expect(processor).toBeDefined();
  });

  describe('getPreparedAudio — binary source', () => {
    it('should process binary audio data successfully', async () => {
      const mockBinaryData = {
        data: SMALL_AUDIO_BASE64,
        mimeType: 'audio/mpeg',
        fileName: 'test.mp3',
      };

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('binary') // audioSource
        .mockReturnValueOnce('data') // audioBinaryPropertyName
        .mockReturnValueOnce('test.mp3'); // audioFilename

      mockExecuteFunctions.getInputData.mockReturnValue([{ binary: { data: mockBinaryData } }]);

      const processor = new AudioProcessor(mockExecuteFunctions);
      const result = await processor.getPreparedAudio(0);

      expect(result.source).toBe('binary');
      expect(result.mimeType).toBe('audio/mpeg');
      expect(result.format).toBe('mp3');
    });

    it('should throw when binary property is missing from item', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('binary')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('');

      mockExecuteFunctions.getInputData.mockReturnValue([
        { binary: {} }, // 'data' property not present
      ]);

      const processor = new AudioProcessor(mockExecuteFunctions);
      await expect(processor.getPreparedAudio(0)).rejects.toThrow();
    });

    it('should throw when binary property on item is entirely absent', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('binary')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('');

      mockExecuteFunctions.getInputData.mockReturnValue([
        { json: {} }, // no binary key at all
      ]);

      const processor = new AudioProcessor(mockExecuteFunctions);
      await expect(processor.getPreparedAudio(0)).rejects.toThrow();
    });
  });

  describe('getPreparedAudio — base64 source', () => {
    it('should process base64 audio data successfully', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('base64') // audioSource
        .mockReturnValueOnce(SMALL_AUDIO_BASE64) // audioBase64Data
        .mockReturnValueOnce('audio/wav'); // audioMimeType

      const processor = new AudioProcessor(mockExecuteFunctions);
      const result = await processor.getPreparedAudio(0);

      expect(result.source).toBe('base64');
      expect(result.mimeType).toBe('audio/wav');
      expect(result.format).toBe('wav');
    });

    it('should throw for invalid base64 data', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('base64')
        .mockReturnValueOnce('not!valid!!!')
        .mockReturnValueOnce('audio/mpeg');

      const processor = new AudioProcessor(mockExecuteFunctions);
      await expect(processor.getPreparedAudio(0)).rejects.toThrow('Invalid base64 format');
    });
  });

  describe('getPreparedAudio — URL source', () => {
    it('should process URL audio successfully', async () => {
      const testUrl = 'https://example.com/audio.mp3';

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('url') // audioSource
        .mockReturnValueOnce(testUrl); // audioUrl

      const processor = new AudioProcessor(mockExecuteFunctions);
      const result = await processor.getPreparedAudio(0);

      expect(result.source).toBe('url');
      expect(result.data).toBe(testUrl);
      expect(result.mimeType).toBe('audio/mpeg');
    });

    it('should throw for an invalid URL', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('url')
        .mockReturnValueOnce('not-a-url');

      const processor = new AudioProcessor(mockExecuteFunctions);
      await expect(processor.getPreparedAudio(0)).rejects.toThrow();
    });
  });

  describe('getPreparedAudio — unknown source', () => {
    it('should throw for an unknown audioSource value', async () => {
      mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('video');

      const processor = new AudioProcessor(mockExecuteFunctions);
      await expect(processor.getPreparedAudio(0)).rejects.toThrow('Unknown audioSource');
    });
  });
});
