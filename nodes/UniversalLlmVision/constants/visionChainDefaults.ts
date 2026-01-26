/**
 * Default system prompt for Vision Chain
 * Provides comprehensive guidelines for image analysis
 */
export const DEFAULT_VISION_SYSTEM_PROMPT = 
	'You are an AI assistant specialized in image understanding and visual analysis.\n\n' +
	'Rules:\n' +
	'- Use only information clearly visible in the image\n' +
	'- Never guess or assume information that cannot be visually confirmed\n' +
	'- If unable to answer fully, explain what\'s missing\n' +
	'- Be concise, factual, and neutral by default\n\n' +
	'Adapt your response to the user\'s request:\n' +
	'- Text extraction → reproduce exactly as seen\n' +
	'- Description → summarize visible elements\n' +
	'- Unanswerable questions → state this explicitly';

/**
 * Default output property name for analysis results
 */
export const DEFAULT_OUTPUT_PROPERTY = 'analysis';

/**
 * Default prompt for image analysis
 */
export const DEFAULT_ANALYSIS_PROMPT = 'Analyze this image and describe what you see';

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
	NO_CHAT_MODEL: 'No chat model connected. Please connect a chat model to the Vision Chain node.',
	NO_BINARY_DATA: (propertyName: string, availableProps: string) => 
		`No binary data found in property "${propertyName}". Available properties: ${availableProps}`,
	INVALID_URL: 'Image URL must start with http:// or https://',
} as const;
