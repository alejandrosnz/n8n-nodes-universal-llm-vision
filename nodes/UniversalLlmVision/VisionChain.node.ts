import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
	DEFAULT_VISION_SYSTEM_PROMPT,
	DEFAULT_OUTPUT_PROPERTY,
	DEFAULT_ANALYSIS_PROMPT,
	ERROR_MESSAGES,
} from './constants/visionChainDefaults';
import {
	processBinaryImage,
	processUrlImage,
	processBase64Image,
	buildMessageContent,
	extractResponseText,
} from './utils/visionChainHelpers';

/**
 * Vision Chain Node
 * 
 * Adds vision capabilities to any connected chat model by formatting multimodal messages.
 * This chain node receives a chat model connection and enhances it with image processing,
 * supporting binary data, URLs, and base64 image inputs.
 */
export class VisionChain implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Vision Chain',
		name: 'visionChain',
		icon: 'file:vision.svg',
		group: ['transform'],
		version: 1,
		description: 'Add vision capabilities to any chat model by processing images with multimodal prompts',
		defaults: {
			name: 'Vision Chain',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Chains', 'Langchain'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://github.com/alejandrosnz/n8n-nodes-universal-llm-vision',
					},
				],
			},
		},
		// Chain nodes accept Main input + langchain connections
		inputs: [
			'main',
			{
				displayName: 'Chat Model',
				maxConnections: 1,
				type: 'ai_languageModel',
				required: true,
			},
		],
		outputs: ['main'],
		properties: [
			// Image Input Configuration
			{
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
			},

			// Binary data options
			{
				displayName: 'Binary Property Name',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				description: 'The name of the binary property containing the image',
				displayOptions: {
					show: { imageSource: ['binary'] },
				},
			},
			{
				displayName: 'Filename (Optional)',
				name: 'filename',
				type: 'string',
				default: '',
				description: 'Image filename (used for MIME type detection)',
				displayOptions: {
					show: { imageSource: ['binary'] },
				},
			},

			// URL options
			{
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
			},

			// Base64 options
			{
				displayName: 'Base64 Data',
				name: 'base64Data',
				type: 'string',
				default: '',
				required: true,
				description: 'Base64-encoded image data (without data: URI prefix)',
				displayOptions: {
					show: { imageSource: ['base64'] },
				},
			},
			{
				displayName: 'MIME Type',
				name: 'base64MimeType',
				type: 'string',
				default: 'image/jpeg',
				placeholder: 'image/jpeg, image/png, image/webp',
				description: 'MIME type of the base64-encoded image',
				displayOptions: {
					show: { imageSource: ['base64'] },
				},
			},

			// Analysis prompt
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: { rows: 4 },
				required: true,
				default: DEFAULT_ANALYSIS_PROMPT,
				description: 'Question or instruction for analyzing the image',
				placeholder: 'Describe the main objects, colors, and any text visible in this image',
			},

			// Output configuration
			{
				displayName: 'Output Property Name',
				name: 'outputPropertyName',
				type: 'string',
				default: DEFAULT_OUTPUT_PROPERTY,
				description: 'Property name for storing the analysis result',
			},

			// Image detail level
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Image Detail',
						name: 'imageDetail',
						type: 'options',
						options: [
							{
								name: 'Auto',
								value: 'auto',
								description: 'Let the model decide the detail level',
							},
							{
								name: 'Low',
								value: 'low',
								description: 'Faster, less detailed analysis',
							},
							{
								name: 'High',
								value: 'high',
								description: 'Slower, more detailed analysis',
							},
						],
						default: 'auto',
						description: 'Detail level for image processing (if supported by model)',
					},
					{
						displayName: 'System Prompt',
						name: 'systemPrompt',
						type: 'string',
						typeOptions: { rows: 8 },
						default: DEFAULT_VISION_SYSTEM_PROMPT,
						description: 'System instructions for the model (overrides defaults)',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get the connected chat model
		const model = (await this.getInputConnectionData(
			'ai_languageModel',
			0,
		)) as BaseChatModel;

		if (!model) {
			throw new Error(ERROR_MESSAGES.NO_CHAT_MODEL);
		}

		// Process each input item
		for (let i = 0; i < items.length; i++) {
			try {
			const result = await processItem.call(this, i, model, items);
			returnData.push(result);
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						...items[i].json,
						error: error.message,
					},
					binary: items[i].binary,
					pairedItem: { item: i },
				});
				continue;
			}
			throw error;
		}
	}

	return [returnData];
}
}

/**
 * Process a single item through the vision chain
 */
async function processItem(
	this: IExecuteFunctions,
	itemIndex: number,
	model: BaseChatModel,
	items: INodeExecutionData[],
): Promise<INodeExecutionData> {
	const imageSource = this.getNodeParameter('imageSource', itemIndex) as 'binary' | 'url' | 'base64';
	const prompt = this.getNodeParameter('prompt', itemIndex) as string;
	const outputPropertyName = this.getNodeParameter('outputPropertyName', itemIndex) as string;
	const options = this.getNodeParameter('options', itemIndex, {}) as {
		imageDetail?: 'auto' | 'low' | 'high';
		systemPrompt?: string;
	};

	// Get image content based on source
	const imageContent = await getImageContent.call(this, itemIndex, imageSource);

	// Build the multimodal message content
	const messageContent = buildMessageContent(prompt, imageContent, options);

	// Create the messages array with optional system prompt
	const messages: any[] = [];
	if (options.systemPrompt) {
		messages.push({
			role: 'system',
			content: options.systemPrompt,
		});
	}

	// Add the human message with image
	messages.push(new HumanMessage({ content: messageContent }));

	// Invoke the connected chat model
	const response = await model.invoke(messages);

	// Extract the response text
	const responseText = extractResponseText(response);

	// Preserve original data and add response in configured property
	return {
		json: {
			...items[itemIndex].json,
			[outputPropertyName]: responseText,
		},
		binary: items[itemIndex].binary,
		pairedItem: { item: itemIndex },
	};
}

/**
 * Get image content as data URI or URL based on source type
 */
async function getImageContent(
	this: IExecuteFunctions,
	itemIndex: number,
	imageSource: 'binary' | 'url' | 'base64',
): Promise<string> {
	switch (imageSource) {
		case 'binary':
			return processBinaryImage(this, itemIndex);
		case 'url':
			return processUrlImage(this, itemIndex);
		case 'base64':
			return processBase64Image(this, itemIndex);
		default:
			throw new Error(`Unsupported image source: ${imageSource}`);
	}}