import { mock } from 'jest-mock-extended';
import type { IExecuteFunctions } from 'n8n-workflow';
import { VisionChain } from '../../../nodes/UniversalLlmVision/VisionChain.node';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

/**
 * Integration tests for VisionChain node
 * Tests binary data processing and base64 handling with real data structures
 */
describe('VisionChain Integration Tests', () => {
	let visionChain: VisionChain;
	let mockExecuteFunctions: IExecuteFunctions;
	let mockChatModel: BaseChatModel;

	beforeEach(() => {
		visionChain = new VisionChain();
		mockExecuteFunctions = mock<IExecuteFunctions>();
		mockChatModel = mock<BaseChatModel>();

		(mockExecuteFunctions.getInputConnectionData as jest.Mock).mockResolvedValue(mockChatModel);
		(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(false);
		(mockChatModel.invoke as jest.Mock).mockResolvedValue({
			content: 'Test response',
		});
	});

	describe('Binary Data Processing', () => {
		it('should process binary data from previous node', async () => {
			// Mock binary data structure with JPEG magic bytes
			const jpegMagicBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
			const fakeImageData = Buffer.concat([jpegMagicBytes, Buffer.from('fake-image-data')]);
			const mockBinaryData = {
				data: fakeImageData.toString('base64'),
				mimeType: 'image/jpeg',
				fileName: 'test.jpg',
			};

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
				{
					json: { test: 'data' },
					binary: {
						data: mockBinaryData,
					},
				},
			]);

			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string) => {
					switch (paramName) {
						case 'imageSource':
							return 'binary';
						case 'binaryPropertyName':
							return 'data';
						case 'filename':
							return '';
						case 'prompt':
							return 'Analyze this image';
						case 'outputPropertyName':
							return 'analysis';
						case 'options':
							return {};
						default:
							return undefined;
					}
				},
			);

			// Mock helpers object
			(mockExecuteFunctions.helpers as any) = {
				getBinaryDataBuffer: jest.fn().mockResolvedValue(fakeImageData),
			};

			const result = await visionChain.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json.test).toBe('data'); // Original data preserved
			expect(result[0][0].json.analysis).toBe('Test response'); // Response in configured property
		});

		it('should handle missing binary property', async () => {
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
				{
					json: { test: 'data' },
					binary: {
						otherProperty: { data: 'test', mimeType: 'image/jpeg' },
					},
				},
			]);

			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string) => {
					switch (paramName) {
						case 'imageSource':
							return 'binary';
						case 'binaryPropertyName':
							return 'data';
						case 'filename':
							return '';
						case 'prompt':
							return 'Test';
						case 'options':
							return {};
						default:
							return undefined;
					}
				},
			);

			await expect(visionChain.execute.call(mockExecuteFunctions)).rejects.toThrow(
				/No binary data found in property/,
			);
		});
	});

	describe('Base64 Processing', () => {
		it('should process base64 encoded image', async () => {
			// Create valid JPEG base64 with magic bytes
			const jpegMagicBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
			const fakeImageData = Buffer.concat([jpegMagicBytes, Buffer.from('fake-image-content')]);
			const validBase64 = fakeImageData.toString('base64');

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
				{ json: { test: 'data' } },
			]);

			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string) => {
					switch (paramName) {
						case 'imageSource':
							return 'base64';
						case 'base64Data':
							return validBase64;
						case 'base64MimeType':
							return 'image/jpeg';
						case 'prompt':
							return 'Analyze';
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
			expect(result[0][0].json.test).toBe('data'); // Original data preserved
			expect(mockChatModel.invoke).toHaveBeenCalled();
		});

		it('should handle invalid base64 data', async () => {
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
				{ json: { test: 'data' } },
			]);

			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string) => {
					switch (paramName) {
						case 'imageSource':
							return 'base64';
						case 'base64Data':
							return 'not-valid-base64!@#$';
						case 'base64MimeType':
							return 'image/jpeg';
						case 'prompt':
							return 'Test';
						case 'options':
							return {};
						default:
							return undefined;
					}
				},
			);

			await expect(visionChain.execute.call(mockExecuteFunctions)).rejects.toThrow();
		});
	});

	describe('Model Response Handling', () => {
		beforeEach(() => {
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
				{ json: { test: 'data' } },
			]);

			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string) => {
					switch (paramName) {
						case 'imageSource':
							return 'url';
						case 'imageUrl':
							return 'https://example.com/image.jpg';
						case 'prompt':
							return 'Test';						case 'outputPropertyName':
							return 'analysis';						case 'options':
							return {};
						default:
							return undefined;
					}
				},
			);
		});

		it('should handle string response content', async () => {
			(mockChatModel.invoke as jest.Mock).mockResolvedValue({
				content: 'This is a string response',
			});

			const result = await visionChain.execute.call(mockExecuteFunctions);

			expect(result[0][0].json.analysis).toBe('This is a string response');
			expect(result[0][0].json.test).toBe('data'); // Original data preserved
		});

		it('should handle object response content', async () => {
			(mockChatModel.invoke as jest.Mock).mockResolvedValue({
				content: { type: 'text', text: 'Complex response' },
			});

			const result = await visionChain.execute.call(mockExecuteFunctions);

			expect(result[0][0].json.analysis).toBe(
				JSON.stringify({ type: 'text', text: 'Complex response' }),
			);
			expect(result[0][0].json.test).toBe('data'); // Original data preserved
		});

		it('should handle array response content', async () => {
			(mockChatModel.invoke as jest.Mock).mockResolvedValue({
				content: [
					{ type: 'text', text: 'Part 1' },
					{ type: 'text', text: 'Part 2' },
				],
			});

			const result = await visionChain.execute.call(mockExecuteFunctions);

			expect(typeof result[0][0].json.analysis).toBe('string');
			expect(result[0][0].json.analysis).toContain('Part 1');
			expect(result[0][0].json.test).toBe('data'); // Original data preserved
		});
	});

	describe('Image Detail Option', () => {
		beforeEach(() => {
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
				{ json: { test: 'data' } },
			]);

			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string, itemIndex: number) => {
					switch (paramName) {
						case 'imageSource':
							return 'url';
						case 'imageUrl':
							return 'https://example.com/image.jpg';
						case 'prompt':
							return 'Test';
						default:
							return undefined;
					}
				},
			);
		});

		it('should include detail:auto when specified', async () => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string) => {
					if (paramName === 'options') return { imageDetail: 'auto' };
					if (paramName === 'imageSource') return 'url';
					if (paramName === 'imageUrl') return 'https://example.com/image.jpg';
					if (paramName === 'prompt') return 'Test';
					return undefined;
				},
			);

			await visionChain.execute.call(mockExecuteFunctions);

			const callArgs = (mockChatModel.invoke as jest.Mock).mock.calls[0][0];
			expect(callArgs[0].content[1].image_url.detail).toBe('auto');
		});

		it('should include detail:low when specified', async () => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string) => {
					if (paramName === 'options') return { imageDetail: 'low' };
					if (paramName === 'imageSource') return 'url';
					if (paramName === 'imageUrl') return 'https://example.com/image.jpg';
					if (paramName === 'prompt') return 'Test';
					return undefined;
				},
			);

			await visionChain.execute.call(mockExecuteFunctions);

			const callArgs = (mockChatModel.invoke as jest.Mock).mock.calls[0][0];
			expect(callArgs[0].content[1].image_url.detail).toBe('low');
		});

		it('should not include detail when not specified', async () => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string) => {
					if (paramName === 'options') return {};
					if (paramName === 'imageSource') return 'url';
					if (paramName === 'imageUrl') return 'https://example.com/image.jpg';
					if (paramName === 'prompt') return 'Test';
					return undefined;
				},
			);

			await visionChain.execute.call(mockExecuteFunctions);

			const callArgs = (mockChatModel.invoke as jest.Mock).mock.calls[0][0];
			expect(callArgs[0].content[1].image_url.detail).toBeUndefined();
		});
	});
});
