import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { ImageProcessor } from './processors/ImageProcessor';
import { ResponseProcessor } from './processors/ResponseProcessor';
import { RequestHandler } from './handlers/RequestHandler';
import { getMimeTypeOptions } from './processors/ImageProcessor';

export class GenericLlmVision implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Generic LLM Vision',
    name: 'genericLlmVision',
    icon: 'file:vision.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["model"] + " - " + $parameter["imageSource"]}}',
    description: 'Analyze images using multiple LLM vision providers (OpenRouter, Groq, Grok, OpenAI, Anthropic)',
    defaults: {
      name: 'Generic LLM Vision',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'genericLlmVisionApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Model',
        name: 'model',
        type: 'string',
        required: true,
        default: 'gpt-4-vision',
        placeholder: 'gpt-4-vision',
        description: 'Model identifier for the selected provider (e.g., gpt-4-vision, claude-3-sonnet)',
      },

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
        description: 'Image filename (used for MIME type detection). If provided, overrides binary metadata',
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
      },

      // Analysis prompt
      {
        displayName: 'Prompt',
        name: 'prompt',
        type: 'string',
        typeOptions: { rows: 4 },
        required: true,
        default: 'Describe what you see in this image in detail',
        description: 'Question or instruction for analyzing the image',
        placeholder: 'Describe the main objects, colors, composition, and any text visible in this image',
      },

      // Model configuration
      {
        displayName: 'Model Parameters',
        name: 'modelParameters',
        type: 'collection',
        placeholder: 'Add Parameter',
        default: {},
        options: [
          {
            displayName: 'Temperature',
            name: 'temperature',
            type: 'number',
            typeOptions: {
              minValue: 0,
              maxValue: 2,
              numberPrecision: 2,
            },
            default: 1,
            description: 'Controls randomness (0=deterministic, 2=most random)',
          },
          {
            displayName: 'Max Tokens',
            name: 'maxTokens',
            type: 'number',
            default: 1024,
            description: 'Maximum length of the response in tokens',
          },
          {
            displayName: 'Top P',
            name: 'topP',
            type: 'number',
            typeOptions: {
              minValue: 0,
              maxValue: 1,
              numberPrecision: 2,
            },
            default: 1,
            description: 'Controls diversity via nucleus sampling (0-1)',
          },
          {
            displayName: 'Image Detail',
            name: 'imageDetail',
            type: 'options',
            options: [
              { name: 'Auto', value: 'auto' },
              { name: 'Low (Fast)', value: 'low' },
              { name: 'High (Detailed)', value: 'high' },
            ],
            default: 'auto',
            description: 'Image resolution detail level (affects speed and cost). Not supported by all providers',
          },
        ],
      },

      // Advanced options
      {
        displayName: 'Advanced Options',
        name: 'advancedOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'System Prompt',
            name: 'systemPrompt',
            type: 'string',
            typeOptions: { rows: 2 },
            default: '',
            description: 'System instructions for the model (overrides defaults)',
          },
          {
            displayName: 'Response Format',
            name: 'responseFormat',
            type: 'options',
            options: [
              { name: 'Text', value: 'text' },
              { name: 'JSON', value: 'json_object' },
            ],
            default: 'text',
            description: 'Response format. Note: not all providers support JSON mode',
          },
          {
            displayName: 'Custom Headers',
            name: 'customHeaders',
            type: 'fixedCollection',
            typeOptions: { multipleValues: true },
            description: 'Additional headers to include in API request',
            default: {},
            options: [
              {
                name: 'headers',
                displayName: 'Headers',
                values: [
                  {
                    displayName: 'Header Name',
                    name: 'name',
                    type: 'string',
                    default: '',
                    placeholder: 'X-Custom-Header',
                  },
                  {
                    displayName: 'Header Value',
                    name: 'value',
                    type: 'string',
                    default: '',
                    placeholder: 'custom-value',
                  },
                ],
              },
            ],
          },
          {
            displayName: 'Additional Parameters',
            name: 'additionalParameters',
            type: 'json',
            default: '{}',
            description: 'Extra API parameters as JSON (for advanced users)',
          },
          {
            displayName: 'Include Metadata',
            name: 'includeMetadata',
            type: 'boolean',
            default: false,
            description: 'Include usage statistics and model information in output',
          },
        ],
      },

      // Output configuration
      {
        displayName: 'Output Property Name',
        name: 'outputPropertyName',
        type: 'string',
        default: 'analysis',
        description: 'Property name for storing the analysis result',
      },
    ],
  };

  /**
   * Execute the Generic LLM Vision node
   * Processes images through various LLM vision providers (OpenAI, Anthropic, Groq, etc.)
   * @param this - The execution context provided by n8n
   * @returns Promise<INodeExecutionData[][]> - Array of processed items with analysis results
   */
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Detect which credential is being used and get the appropriate one
    // First try OpenRouter credential, then fall back to generic credential
    let credentials: any;
    let credentialName: string;
    let apiKey: string;
    let customBaseUrl: string | undefined;
    let provider: string;

    try {
      credentials = await this.getCredentials('openRouterApi');
      credentialName = 'openRouterApi';
      provider = 'openrouter';
      apiKey = credentials.apiKey as string;
    } catch {
      // OpenRouter credential not configured, try generic credential
      credentials = await this.getCredentials('genericLlmVisionApi');
      credentialName = 'genericLlmVisionApi';
      provider = (credentials.provider as string) || 'openai';
      apiKey = credentials.apiKey as string;
      customBaseUrl = (credentials.baseUrl as string) || undefined;
    }

    // Process each input item
    for (let i = 0; i < items.length; i++) {
      try {
        // Extract node parameters for this item
        const model = this.getNodeParameter('model', i) as string;
        const prompt = this.getNodeParameter('prompt', i) as string;
        const modelParameters = this.getNodeParameter('modelParameters', i) as any;
        const advancedOptions = this.getNodeParameter('advancedOptions', i) as any;
        const outputPropertyName = this.getNodeParameter('outputPropertyName', i) as string;
        const includeMetadata = advancedOptions.includeMetadata || false;

        // Prepare image data using ImageProcessor
        const imageProcessor = new ImageProcessor(this);
        const preparedImage = await imageProcessor.getPreparedImage(i);

        // Build custom headers
        const customHeadersRecord: Record<string, string> = {};

        if (advancedOptions?.customHeaders?.headers) {
          for (const header of advancedOptions.customHeaders.headers) {
            customHeadersRecord[header.name] = header.value;
          }
        }

        // Add provider-specific headers if using OpenRouter credential
        if (credentialName === 'openRouterApi') {
          if (credentials.httpReferer) {
            customHeadersRecord['HTTP-Referer'] = credentials.httpReferer as string;
          }
          if (credentials.appTitle) {
            customHeadersRecord['X-Title'] = credentials.appTitle as string;
          }
        }

        // Execute request using RequestHandler
        const requestHandler = new RequestHandler(this);
        const response = await requestHandler.executeRequest(
          provider,
          apiKey,
          customBaseUrl,
          customHeadersRecord,
          model,
          preparedImage,
          prompt,
          modelParameters,
          advancedOptions
        );

        // Process response using ResponseProcessor
        const responseProcessor = new ResponseProcessor();
        const result = responseProcessor.processResponse(response, provider, includeMetadata, outputPropertyName);

        returnData.push({
          json: { ...items[i].json, ...result },
          binary: items[i].binary,
        });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
              details: (error as Error).stack,
            },
            binary: items[i].binary,
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}