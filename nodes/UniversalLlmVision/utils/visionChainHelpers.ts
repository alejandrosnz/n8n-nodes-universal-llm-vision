export interface ImageSourceOptions {
	imageDetail?: 'auto' | 'low' | 'high';
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
