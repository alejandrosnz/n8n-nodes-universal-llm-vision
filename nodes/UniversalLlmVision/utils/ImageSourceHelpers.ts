import type { IExecuteFunctions } from 'n8n-workflow';
import { prepareImage, type PreparedImage } from '../processors/ImageProcessor';

/**
 * Options for image source extraction
 */
export interface ImageSourceOptions {
	imageDetail?: 'auto' | 'low' | 'high';
}

/**
 * Result of image extraction with flexible output format
 */
export interface ImageSourceResult {
	data: string; // base64 or URL
	mimeType: string;
	size: number;
	source: 'binary' | 'base64' | 'url';
}

/**
 * Unified image extraction from different sources (binary, base64, URL)
 * Consolidates logic from ImageProcessor.getPreparedImage() and visionChainHelpers
 * 
 * @param executeFunctions - n8n execution functions
 * @param itemIndex - Index of the item being processed
 * @param asDataUri - If true, returns data URI format (data:mime;base64,xxx), otherwise just base64
 * @returns Promise<ImageSourceResult> - Extracted and validated image
 * @throws Error if image is invalid, unsupported format, or exceeds size limits
 */
export async function getImageFromSource(
	executeFunctions: IExecuteFunctions,
	itemIndex: number,
	asDataUri: boolean = false,
): Promise<ImageSourceResult> {
	// Get image source type from node parameter
	const imageSource = executeFunctions.getNodeParameter('imageSource', itemIndex) as 'binary' | 'base64' | 'url';

	let imageData: any;
	let filename: string | undefined;

	// Extract image data based on source type
	if (imageSource === 'binary') {
		// Handle binary data from previous node
		const binaryPropertyName = executeFunctions.getNodeParameter('binaryPropertyName', itemIndex) as string;
		filename = (executeFunctions.getNodeParameter('filename', itemIndex, '') as string) || undefined;

		const items = executeFunctions.getInputData();
		const binaryMeta = items[itemIndex].binary?.[binaryPropertyName];

		if (!binaryMeta) {
			// Provide helpful error message with available binary properties
			const availableProps = Object.keys(items[itemIndex].binary || {}).join(', ');
			throw new Error(
				`No binary data found in property '${binaryPropertyName}'. ` +
				`Available binary properties: [${availableProps || 'none'}]. ` +
				`\n\nMake sure:` +
				`\n1. Previous node outputs binary data` +
				`\n2. Binary property name is correct (default: 'data')`
			);
		}

		// Get binary data buffer using n8n helper
		let binaryDataBuffer: Buffer;
		try {
			binaryDataBuffer = await executeFunctions.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
		} catch (error) {
			throw new Error(
				`Failed to read binary data: ${(error as Error).message}. ` +
				`The binary data may be corrupted or inaccessible.`
			);
		}

		if (!binaryDataBuffer || binaryDataBuffer.length === 0) {
			throw new Error('Binary data buffer is empty. The image file appears to be empty.');
		}

		// Convert buffer to base64 and create structured image data object
		const base64Data = binaryDataBuffer.toString('base64');
		imageData = {
			data: base64Data,
			mimeType: binaryMeta.mimeType || 'image/jpeg',
			fileName: binaryMeta.fileName || filename,
		};

	} else if (imageSource === 'url') {
		// Handle public URL input
		imageData = executeFunctions.getNodeParameter('imageUrl', itemIndex) as string;

	} else if (imageSource === 'base64') {
		// Handle base64 string input
		const base64Data = executeFunctions.getNodeParameter('base64Data', itemIndex) as string;
		// Note: base64MimeType parameter exists but is handled by prepareImage auto-detection
		
		// For base64, we'll validate via prepareImage
		imageData = base64Data;
		filename = undefined; // Base64 typically doesn't have a filename
	}

	// Validate and prepare image using shared prepareImage function
	let preparedImage: PreparedImage;
	try {
		preparedImage = await prepareImage(imageSource, imageData, filename);
	} catch (error) {
		throw new Error(
			`Failed to prepare image: ${(error as Error).message}\n\n` +
			`Image source: ${imageSource}`
		);
	}

	// Format output based on asDataUri flag
	let resultData: string;
	if (imageSource === 'url') {
		// URLs are returned as-is
		resultData = preparedImage.data;
	} else if (asDataUri) {
		// Convert to data URI format for Langchain
		resultData = `data:${preparedImage.mimeType};base64,${preparedImage.data}`;
	} else {
		// Return just base64 for direct API calls
		resultData = preparedImage.data;
	}

	return {
		data: resultData,
		mimeType: preparedImage.mimeType,
		size: preparedImage.size,
		source: preparedImage.source,
	};
}

/**
 * Validates image URL with security checks
 * @param url - URL to validate
 * @returns string - Sanitized URL
 * @throws Error if URL is invalid or unsafe
 */
export function validateImageUrl(url: string): string {
	if (!url || url.trim().length === 0) {
		throw new Error('Image URL is empty');
	}

	// Validate URL format
	try {
		new URL(url);
	} catch (error) {
		throw new Error(`Invalid image URL: "${url}". Make sure it's a valid HTTP(S) URL.`);
	}

	// Security checks
	const sanitized = url.trim();
	if (sanitized.toLowerCase().includes('<script') || sanitized.toLowerCase().includes('javascript:')) {
		throw new Error('Potentially unsafe URL detected (contains script or javascript)');
	}

	// Check protocol (only allow http and https)
	if (!sanitized.toLowerCase().startsWith('http://') && !sanitized.toLowerCase().startsWith('https://')) {
		throw new Error('Image URL must start with http:// or https://');
	}

	return sanitized;
}
