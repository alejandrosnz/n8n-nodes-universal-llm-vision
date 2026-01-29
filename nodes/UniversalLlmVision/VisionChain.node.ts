import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { VISION_DEFAULTS, ERROR_MESSAGES } from './constants/config';
import { getImageFromSource } from './utils/ImageSourceHelpers';
import {
	IMAGE_SOURCE_PARAMETER,
	BINARY_PROPERTY_PARAMETER,
	FILENAME_PARAMETER,
	IMAGE_URL_PARAMETER,
	BASE64_DATA_PARAMETER,
	BASE64_MIME_TYPE_PARAMETER_SIMPLE,
	PROMPT_PARAMETER,
	OUTPUT_PROPERTY_PARAMETER,
	IMAGE_DETAIL_PARAMETER_OPTION,
} from './constants/imageParameters';
import {
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
		icon: 'file:icon.svg',
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
			// Image Input Configuration (using shared parameters)
			IMAGE_SOURCE_PARAMETER,
			BINARY_PROPERTY_PARAMETER,
			FILENAME_PARAMETER,
			IMAGE_URL_PARAMETER,
			BASE64_DATA_PARAMETER,
			BASE64_MIME_TYPE_PARAMETER_SIMPLE,
			PROMPT_PARAMETER,
			OUTPUT_PROPERTY_PARAMETER,

			// Options collection (using shared parameters)
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					IMAGE_DETAIL_PARAMETER_OPTION,
					{
						displayName: 'System Prompt',
						name: 'systemPrompt',
						type: 'string',
						typeOptions: { rows: 8 },
						default: VISION_DEFAULTS.SYSTEM_PROMPT,
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
	const prompt = this.getNodeParameter('prompt', itemIndex) as string;
	const outputPropertyName = this.getNodeParameter('outputPropertyName', itemIndex) as string;
	const options = this.getNodeParameter('options', itemIndex, {}) as {
		imageDetail?: 'auto' | 'low' | 'high';
		systemPrompt?: string;
	};

	// Get image content using unified helper (returns data URI for langchain)
	const imageResult = await getImageFromSource(this, itemIndex, true);
	const imageContent = imageResult.data;

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