import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { prepareImage } from './processors/ImageProcessor';

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
				default: 'Analyze this image and describe what you see',
				description: 'Question or instruction for analyzing the image',
				placeholder: 'Describe the main objects, colors, and any text visible in this image',
			},

			// Output configuration
			{
				displayName: 'Output Property Name',
				name: 'outputPropertyName',
				type: 'string',
				default: 'analysis',
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
						default: 'You are an AI assistant specialized in image understanding and visual analysis.\n\nRules:\n- Use only information clearly visible in the image\n- Never guess or assume information that cannot be visually confirmed\n- If unable to answer fully, explain what\'s missing\n- Be concise, factual, and neutral by default\n\nAdapt your response to the user\'s request:\n- Text extraction → reproduce exactly as seen\n- Description → summarize visible elements\n- Unanswerable questions → state this explicitly',
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
			throw new Error('No chat model connected. Please connect a chat model to the Vision Chain node.');
		}

		// Process each input item
		for (let i = 0; i < items.length; i++) {
			try {
				const imageSource = this.getNodeParameter('imageSource', i) as 'binary' | 'url' | 'base64';
				const prompt = this.getNodeParameter('prompt', i) as string;
				const outputPropertyName = this.getNodeParameter('outputPropertyName', i) as string;
				const options = this.getNodeParameter('options', i, {}) as {
					imageDetail?: 'auto' | 'low' | 'high';
					systemPrompt?: string;
				};

				// Prepare the image based on source
				let imageContent: string;

				if (imageSource === 'binary') {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const filename = this.getNodeParameter('filename', i, '') as string;
					
					const binaryMeta = items[i].binary?.[binaryPropertyName];
					if (!binaryMeta) {
						throw new Error(
							`No binary data found in property "${binaryPropertyName}". Available properties: ${Object.keys(items[i].binary || {}).join(', ')}`,
						);
					}

					// Get binary data buffer using n8n helper
					const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
					const base64Data = binaryDataBuffer.toString('base64');
					
					const imageData = {
						data: base64Data,
						mimeType: binaryMeta.mimeType || 'image/jpeg',
						fileName: binaryMeta.fileName || filename,
					};

					// Use prepareImage function to validate
					const preparedImage = await prepareImage('binary', imageData, filename);

					// Convert to data URI
					imageContent = `data:${preparedImage.mimeType};base64,${preparedImage.data}`;

				} else if (imageSource === 'url') {
					imageContent = this.getNodeParameter('imageUrl', i) as string;
					
					// Validate URL format
					if (!imageContent.match(/^https?:\/\/.+/)) {
						throw new Error('Image URL must start with http:// or https://');
					}

				} else {
					// base64
					const base64Data = this.getNodeParameter('base64Data', i) as string;
					const mimeType = this.getNodeParameter('base64MimeType', i) as string;

					// Use prepareImage function to validate
					const preparedImage = await prepareImage('base64', base64Data, undefined);

					imageContent = `data:${mimeType};base64,${preparedImage.data}`;
				}

				// Build the multimodal message content
				const messageContent: any[] = [
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

				// Create the messages array
				const messages: any[] = [];

				// Add system prompt if provided
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

				// Extract the response content
				const responseText = typeof response.content === 'string' 
					? response.content 
					: JSON.stringify(response.content);

				// Preserve original data and add response in configured property
				returnData.push({
					json: {
						...items[i].json,
						[outputPropertyName]: responseText,
					},
					binary: items[i].binary,
					pairedItem: { item: i },
				});

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
