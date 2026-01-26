import type { IExecuteFunctions } from 'n8n-workflow';
import { prepareImage } from '../processors/ImageProcessor';
import { ERROR_MESSAGES } from '../constants/visionChainDefaults';

export interface ImageSourceOptions {
	imageDetail?: 'auto' | 'low' | 'high';
}

/**
 * Processes binary image data and returns a data URI
 */
export async function processBinaryImage(
	executeFunctions: IExecuteFunctions,
	itemIndex: number,
): Promise<string> {
	const binaryPropertyName = executeFunctions.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const filename = executeFunctions.getNodeParameter('filename', itemIndex, '') as string;
	const items = executeFunctions.getInputData();
	
	const binaryMeta = items[itemIndex].binary?.[binaryPropertyName];
	if (!binaryMeta) {
		const availableProps = Object.keys(items[itemIndex].binary || {}).join(', ');
		throw new Error(ERROR_MESSAGES.NO_BINARY_DATA(binaryPropertyName, availableProps));
	}

	// Get binary data buffer using n8n helper
	const binaryDataBuffer = await executeFunctions.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
	const base64Data = binaryDataBuffer.toString('base64');
	
	const imageData = {
		data: base64Data,
		mimeType: binaryMeta.mimeType || 'image/jpeg',
		fileName: binaryMeta.fileName || filename,
	};

	// Use prepareImage function to validate
	const preparedImage = await prepareImage('binary', imageData, filename);

	// Convert to data URI
	return `data:${preparedImage.mimeType};base64,${preparedImage.data}`;
}

/**
 * Processes URL image and returns validated URL
 */
export function processUrlImage(
	executeFunctions: IExecuteFunctions,
	itemIndex: number,
): string {
	const imageUrl = executeFunctions.getNodeParameter('imageUrl', itemIndex) as string;
	
	// Validate URL format
	if (!imageUrl.match(/^https?:\/\/.+/)) {
		throw new Error(ERROR_MESSAGES.INVALID_URL);
	}

	return imageUrl;
}

/**
 * Processes base64 image data and returns a data URI
 */
export async function processBase64Image(
	executeFunctions: IExecuteFunctions,
	itemIndex: number,
): Promise<string> {
	const base64Data = executeFunctions.getNodeParameter('base64Data', itemIndex) as string;
	const mimeType = executeFunctions.getNodeParameter('base64MimeType', itemIndex) as string;

	// Use prepareImage function to validate
	const preparedImage = await prepareImage('base64', base64Data, undefined);

	return `data:${mimeType};base64,${preparedImage.data}`;
}

/**
 * Builds the multimodal message content with text and image
 */
export function buildMessageContent(
	prompt: string,
	imageContent: string,
	options: ImageSourceOptions,
): any[] {
	return [
		{
			type: 'text',
			text: prompt,
		},
		{
			type: 'image_url',
			image_url: {
				url: imageContent,
				...(options.imageDetail && { detail: options.imageDetail }),
			},
		},
	];
}

/**
 * Builds the complete messages array including optional system prompt
 */
export function buildMessagesArray(
	messageContent: any[],
	systemPrompt?: string,
): any[] {
	const messages: any[] = [];

	// Add system prompt if provided
	if (systemPrompt) {
		messages.push({
			role: 'system',
			content: systemPrompt,
		});
	}

	// Add the human message with image (using langchain's HumanMessage in the main code)
	return messages;
}

/**
 * Extracts text content from model response
 */
export function extractResponseText(response: any): string {
	return typeof response.content === 'string' 
		? response.content 
		: JSON.stringify(response.content);
}
