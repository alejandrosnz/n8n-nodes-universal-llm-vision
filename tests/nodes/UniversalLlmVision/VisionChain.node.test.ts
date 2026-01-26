import { mock } from 'jest-mock-extended';
import type { IExecuteFunctions } from 'n8n-workflow';
import { VisionChain } from '../../../nodes/UniversalLlmVision/VisionChain.node';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

describe('VisionChain Node', () => {
	let visionChain: VisionChain;
	let mockExecuteFunctions: IExecuteFunctions;
	let mockChatModel: BaseChatModel;

	beforeEach(() => {
		visionChain = new VisionChain();
		mockExecuteFunctions = mock<IExecuteFunctions>();
		mockChatModel = mock<BaseChatModel>();

		// Setup common mocks
		(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
			{ json: { test: 'data' } },
		]);

		(mockExecuteFunctions.getInputConnectionData as jest.Mock).mockResolvedValue(mockChatModel);

		(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(false);
	});

	describe('Node Definition', () => {
		it('should have correct basic properties', () => {
			expect(visionChain.description.displayName).toBe('Vision Chain');
			expect(visionChain.description.name).toBe('visionChain');
			expect(visionChain.description.version).toBe(1);
			expect(visionChain.description.group).toEqual(['transform']);
		});

		it('should accept Main and AiLanguageModel inputs', () => {
			const inputs = visionChain.description.inputs;
			expect(inputs).toHaveLength(2);
			expect(inputs[0]).toBe('main');
			
			const modelInput = inputs[1] as any;
			expect(modelInput.type).toBe('ai_languageModel');
			expect(modelInput.required).toBe(true);
			expect(modelInput.maxConnections).toBe(1);
		});

		it('should output to Main connection', () => {
			expect(visionChain.description.outputs).toEqual(['main']);
		});

		it('should have image source parameter', () => {
			const imageSourceParam = visionChain.description.properties.find(
				p => p.name === 'imageSource',
			);
			expect(imageSourceParam).toBeDefined();
			expect(imageSourceParam?.type).toBe('options');
			expect(imageSourceParam?.default).toBe('binary');
		});
	});

	describe('Execute Method - URL Source', () => {
		beforeEach(() => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string) => {
					switch (paramName) {
						case 'imageSource':
							return 'url';
						case 'imageUrl':
							return 'https://example.com/image.jpg';
						case 'prompt':
							return 'Describe this image';
						case 'outputPropertyName':
							return 'analysis';
						case 'options':
							return {};
						default:
							return undefined;
					}
				},
			);

			(mockChatModel.invoke as jest.Mock).mockResolvedValue({
				content: 'This is a test image description',
			});
		});

		it('should process URL-based image successfully', async () => {
			const result = await visionChain.execute.call(mockExecuteFunctions);

			expect(result).toHaveLength(1);
			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual({
				test: 'data', // Original data preserved
				analysis: 'This is a test image description', // Response in configured property
			});
		});

		it('should call chat model with correct message structure', async () => {
			await visionChain.execute.call(mockExecuteFunctions);

			expect(mockChatModel.invoke).toHaveBeenCalledTimes(1);
			const callArgs = (mockChatModel.invoke as jest.Mock).mock.calls[0][0];
			
			expect(callArgs).toHaveLength(1);
			expect(callArgs[0].content).toHaveLength(2);
			expect(callArgs[0].content[0]).toEqual({
				type: 'text',
				text: 'Describe this image',
			});
			expect(callArgs[0].content[1]).toEqual({
				type: 'image_url',
				image_url: {
					url: 'https://example.com/image.jpg',
				},
			});
		});

		it('should validate URL format', async () => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string) => {
					switch (paramName) {
						case 'imageSource':
							return 'url';
						case 'imageUrl':
							return 'not-a-url';
						case 'prompt':
							return 'Describe this image';
						case 'outputPropertyName':
							return 'analysis';
						case 'options':
							return {};
						default:
							return undefined;
					}
				},
			);

			await expect(visionChain.execute.call(mockExecuteFunctions)).rejects.toThrow(
				'Invalid image URL',
			);
		});
	});

	describe('Execute Method - Options', () => {
		beforeEach(() => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string) => {
					switch (paramName) {
						case 'imageSource':
							return 'url';
						case 'imageUrl':
							return 'https://example.com/image.jpg';
						case 'prompt':
							return 'Analyze image';
						case 'outputPropertyName':
							return 'analysis';
						case 'options':
							return {
								imageDetail: 'high',
							};
						default:
							return undefined;
					}
				},
			);

			(mockChatModel.invoke as jest.Mock).mockResolvedValue({
				content: 'Analysis result',
			});
		});

		it('should include imageDetail in message when provided', async () => {
			await visionChain.execute.call(mockExecuteFunctions);

			const callArgs = (mockChatModel.invoke as jest.Mock).mock.calls[0][0];
			expect(callArgs[0].content[1].image_url.detail).toBe('high');
		});

		it('should include system prompt when provided', async () => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string) => {
					switch (paramName) {
						case 'imageSource':
							return 'url';
						case 'imageUrl':
							return 'https://example.com/image.jpg';
						case 'prompt':
							return 'Analyze image';
						case 'outputPropertyName':
							return 'analysis';
						case 'options':
							return {
								systemPrompt: 'You are an expert analyst',
							};
						default:
							return undefined;
					}
				},
			);

			await visionChain.execute.call(mockExecuteFunctions);

			const callArgs = (mockChatModel.invoke as jest.Mock).mock.calls[0][0];
			expect(callArgs).toHaveLength(2);
			expect(callArgs[0]).toEqual({
				role: 'system',
				content: 'You are an expert analyst',
			});
		});
	});

	describe('Error Handling', () => {
		it('should throw error when no chat model is connected', async () => {
			(mockExecuteFunctions.getInputConnectionData as jest.Mock).mockResolvedValue(null);

			await expect(visionChain.execute.call(mockExecuteFunctions)).rejects.toThrow(
				'No chat model connected',
			);
		});

		it('should continue processing when continueOnFail is true', async () => {
			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);
			(mockChatModel.invoke as jest.Mock).mockRejectedValue(new Error('Test error'));

			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string) => {
					switch (paramName) {
						case 'imageSource':
							return 'url';
						case 'imageUrl':
							return 'https://example.com/image.jpg';
						case 'prompt':
							return 'Test';
						case 'outputPropertyName':
							return 'analysis';
						case 'options':
							return {};
						default:
							return undefined;
					}
				},
			);

			const result = await visionChain.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toHaveProperty('error');
			expect(result[0][0].json).toHaveProperty('test', 'data'); // Original data preserved
		});

		it('should handle model errors gracefully', async () => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string) => {
					switch (paramName) {
						case 'imageSource':
							return 'url';
						case 'imageUrl':
							return 'https://example.com/image.jpg';
						case 'prompt':
							return 'Test';
						case 'outputPropertyName':
							return 'analysis';
						case 'options':
							return {};
						default:
							return undefined;
					}
				},
			);

			(mockChatModel.invoke as jest.Mock).mockRejectedValue(
				new Error('Model API error'),
			);

			await expect(visionChain.execute.call(mockExecuteFunctions)).rejects.toThrow(
				'Model API error',
			);
		});
	});

	describe('Multiple Items Processing', () => {
		beforeEach(() => {
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
				{ json: { id: 1 } },
				{ json: { id: 2 } },
			]);

			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string, itemIndex: number) => {
					switch (paramName) {
						case 'imageSource':
							return 'url';
						case 'imageUrl':
							return `https://example.com/image${itemIndex + 1}.jpg`;
						case 'prompt':
							return `Describe image ${itemIndex + 1}`;
						case 'outputPropertyName':
							return 'analysis';
						case 'options':
							return {};
						default:
							return undefined;
					}
				},
			);

			(mockChatModel.invoke as jest.Mock).mockImplementation(async (messages: any[]) => {
				const prompt = messages[0].content[0].text;
				return { content: `Response for ${prompt}` };
			});
		});

		it('should process multiple items correctly', async () => {
			const result = await visionChain.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(2);
			expect(result[0][0].json.id).toBe(1); // Original data preserved
			expect(result[0][0].json.analysis).toContain('Describe image 1');
			expect(result[0][1].json.id).toBe(2); // Original data preserved
			expect(result[0][1].json.analysis).toContain('Describe image 2');
			expect(mockChatModel.invoke).toHaveBeenCalledTimes(2);
		});

		it('should include pairedItem for each result', async () => {
			const result = await visionChain.execute.call(mockExecuteFunctions);

			expect(result[0][0].pairedItem).toEqual({ item: 0 });
			expect(result[0][1].pairedItem).toEqual({ item: 1 });
		});
	});
});
