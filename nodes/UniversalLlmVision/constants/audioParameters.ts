import type { INodeProperties } from 'n8n-workflow';

/**
 * Shared Audio Parameter Definitions
 * Reusable parameter definitions for nodes that process audio
 */

/**
 * Audio Source Selector Parameter
 * Allows user to choose between binary data, URL, or base64 string
 */
export const AUDIO_SOURCE_PARAMETER: INodeProperties = {
  displayName: 'Audio Source',
  name: 'audioSource',
  type: 'options',
  required: true,
  options: [
    {
      name: 'Binary Data (Uploaded File)',
      value: 'binary',
      description: 'Use audio file from previous node output',
    },
    {
      name: 'Public URL',
      value: 'url',
      description: 'Provide audio URL directly (support varies by provider)',
    },
    {
      name: 'Base64 String',
      value: 'base64',
      description: 'Provide base64-encoded audio data',
    },
  ],
  default: 'binary',
  description: 'Where to get the audio from',
};

/**
 * Audio Binary Property Name Parameter
 * Specifies which binary property contains the audio data
 */
export const AUDIO_BINARY_PROPERTY_PARAMETER: INodeProperties = {
  displayName: 'Binary Property Name',
  name: 'audioBinaryPropertyName',
  type: 'string',
  default: 'data',
  description: 'The name of the binary property containing the audio',
  displayOptions: {
    show: { audioSource: ['binary'] },
  },
};

/**
 * Audio Filename Parameter
 * Optional filename for MIME type detection
 */
export const AUDIO_FILENAME_PARAMETER: INodeProperties = {
  displayName: 'Filename (Optional)',
  name: 'audioFilename',
  type: 'string',
  default: '',
  description: 'Audio filename (used for format detection). If provided, overrides binary metadata',
  displayOptions: {
    show: { audioSource: ['binary'] },
  },
};

/**
 * Audio URL Parameter
 * URL pointing to the audio file
 */
export const AUDIO_URL_PARAMETER: INodeProperties = {
  displayName: 'Audio URL',
  name: 'audioUrl',
  type: 'string',
  default: '',
  required: true,
  placeholder: 'https://example.com/audio.mp3',
  description:
    'HTTP(S) URL pointing to the audio file. Note: URL support varies by provider — if the request fails, switch to binary or base64 source',
  displayOptions: {
    show: { audioSource: ['url'] },
  },
};

/**
 * Audio Base64 Data Parameter
 * Base64-encoded audio data
 */
export const AUDIO_BASE64_DATA_PARAMETER: INodeProperties = {
  displayName: 'Base64 Data',
  name: 'audioBase64Data',
  type: 'string',
  default: '',
  required: true,
  description: 'Base64-encoded audio data (without data: URI prefix)',
  displayOptions: {
    show: { audioSource: ['base64'] },
  },
};

/**
 * Audio MIME Type / Format Parameter
 * Used for base64 source — tells the provider what format the audio is in
 */
export const AUDIO_MIME_TYPE_PARAMETER: INodeProperties = {
  displayName: 'Audio Format',
  name: 'audioMimeType',
  type: 'options',
  noDataExpression: true,
  options: [
    { name: 'MP3 (audio/mpeg)', value: 'audio/mpeg' },
    { name: 'WAV (audio/wav)', value: 'audio/wav' },
    { name: 'OGG (audio/ogg)', value: 'audio/ogg' },
    { name: 'MP4 / M4A (audio/mp4)', value: 'audio/mp4' },
    { name: 'WebM (audio/webm)', value: 'audio/webm' },
    { name: 'FLAC (audio/flac)', value: 'audio/flac' },
    { name: 'AAC (audio/aac)', value: 'audio/aac' },
  ],
  default: 'audio/mpeg',
  description: 'MIME type / format of the base64-encoded audio',
  displayOptions: {
    show: { audioSource: ['base64'] },
  },
};

/**
 * Audio Prompt Parameter
 * User's question or instruction for audio analysis
 */
export const AUDIO_PROMPT_PARAMETER: INodeProperties = {
  displayName: 'Prompt',
  name: 'prompt',
  type: 'string',
  typeOptions: { rows: 4 },
  required: true,
  default: 'Analyze this audio and describe what you hear',
  description: 'Question or instruction for analyzing the audio',
  placeholder:
    'Transcribe the speech, identify speakers, describe sounds, or answer specific questions about the audio',
};
