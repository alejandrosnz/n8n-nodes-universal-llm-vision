import type { INodeProperties } from 'n8n-workflow';
import { getMimeTypeOptions } from '../processors/ImageProcessor';

/**
 * Shared Parameter Definitions
 * Reusable parameter definitions for both UniversalLlmVision and VisionChain nodes
 */

/**
 * Image Source Selector Parameter
 * Allows user to choose between binary data, URL, or base64 string
 */
export const IMAGE_SOURCE_PARAMETER: INodeProperties = {
	displayName: 'Image Source',
	name: 'imageSource',
	type: 'options',
	required: true,
	options: [
		{
			name: 'Binary Data (Uploaded File)',
			value: 'binary',
			description: 'Use file from previous node output',
		},
		{
			name: 'Public URL',
			value: 'url',
			description: 'Provide image URL directly',
		},
		{
			name: 'Base64 String',
			value: 'base64',
			description: 'Provide base64-encoded image data',
		},
	],
	default: 'binary',
	description: 'Where to get the image from',
};

/**
 * Binary Property Name Parameter
 * Specifies which binary property contains the image data
 */
export const BINARY_PROPERTY_PARAMETER: INodeProperties = {
	displayName: 'Binary Property Name',
	name: 'binaryPropertyName',
	type: 'string',
	default: 'data',
	description: 'The name of the binary property containing the image',
	displayOptions: {
		show: { imageSource: ['binary'] },
	},
};

/**
 * Filename Parameter
 * Optional filename for MIME type detection
 */
export const FILENAME_PARAMETER: INodeProperties = {
	displayName: 'Filename (Optional)',
	name: 'filename',
	type: 'string',
	default: '',
	description: 'Image filename (used for MIME type detection). If provided, overrides binary metadata',
	displayOptions: {
		show: { imageSource: ['binary'] },
	},
};

/**
 * Image URL Parameter
 * URL pointing to the image
 */
export const IMAGE_URL_PARAMETER: INodeProperties = {
	displayName: 'Image URL',
	name: 'imageUrl',
	type: 'string',
	default: '',
	required: true,
	placeholder: 'https://example.com/image.jpg',
	description: 'HTTP(S) URL pointing to the image',
	displayOptions: {
		show: { imageSource: ['url'] },
	},
};

/**
 * Base64 Data Parameter
 * Base64-encoded image data
 */
export const BASE64_DATA_PARAMETER: INodeProperties = {
	displayName: 'Base64 Data',
	name: 'base64Data',
	type: 'string',
	default: '',
	required: true,
	description: 'Base64-encoded image data (without data: URI prefix)',
	displayOptions: {
		show: { imageSource: ['base64'] },
	},
};

/**
 * Base64 MIME Type Parameter (with dropdown)
 * For UniversalLlmVision node with auto-detection
 */
export const BASE64_MIME_TYPE_PARAMETER_WITH_OPTIONS: INodeProperties = {
	displayName: 'Image Format (for Base64)',
	name: 'base64MimeType',
	type: 'options',
	noDataExpression: true,
	options: getMimeTypeOptions(),
	default: 'image/jpeg',
	description: 'MIME type of the base64-encoded image. Auto-detected if possible',
	displayOptions: {
		show: { imageSource: ['base64'] },
	},
};

/**
 * Base64 MIME Type Parameter (simple string)
 * For VisionChain node (simpler interface)
 */
export const BASE64_MIME_TYPE_PARAMETER_SIMPLE: INodeProperties = {
	displayName: 'MIME Type',
	name: 'base64MimeType',
	type: 'string',
	default: 'image/jpeg',
	placeholder: 'image/jpeg, image/png, image/webp',
	description: 'MIME type of the base64-encoded image',
	displayOptions: {
		show: { imageSource: ['base64'] },
	},
};

/**
 * Prompt Parameter
 * User's question or instruction for image analysis
 */
export const PROMPT_PARAMETER: INodeProperties = {
	displayName: 'Prompt',
	name: 'prompt',
	type: 'string',
	typeOptions: { rows: 4 },
	required: true,
	default: 'Analyze this image and describe what you see',
	description: 'Question or instruction for analyzing the image',
	placeholder: 'Describe the main objects, colors, composition, and any text visible in this image',
};

/**
 * Output Property Name Parameter
 * Property name for storing analysis results
 */
export const OUTPUT_PROPERTY_PARAMETER: INodeProperties = {
	displayName: 'Output Property Name',
	name: 'outputPropertyName',
	type: 'string',
	default: 'analysis',
	description: 'Property name for storing the analysis result',
};

/**
 * Image Detail Options
 * Controls image resolution and analysis detail level (affects speed and cost)
 */
export const IMAGE_DETAIL_OPTIONS = [
	{
		name: 'Auto',
		value: 'auto',
		description: 'Let the model decide the detail level',
	},
	{
		name: 'Low (Fast)',
		value: 'low',
		description: 'Faster, less detailed analysis',
	},
	{
		name: 'High (Detailed)',
		value: 'high',
		description: 'Slower, more detailed analysis',
	},
] as const;

/**
 * Image Detail Parameter (for model parameters collection)
 * Used in UniversalLlmVision node
 */
export const IMAGE_DETAIL_PARAMETER: INodeProperties = {
	displayName: 'Image Detail',
	name: 'imageDetail',
	type: 'options',
	options: IMAGE_DETAIL_OPTIONS as any,
	default: 'auto',
	description: 'Image resolution detail level (affects speed and cost). Not supported by all providers',
};

/**
 * Image Detail Parameter (for options collection)
 * Used in VisionChain node
 */
export const IMAGE_DETAIL_PARAMETER_OPTION: INodeProperties = {
	displayName: 'Image Detail',
	name: 'imageDetail',
	type: 'options',
	options: IMAGE_DETAIL_OPTIONS as any,
	default: 'auto',
	description: 'Image resolution detail level (affects speed and cost)',
};
