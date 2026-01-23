import type {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { ImageProcessor } from './processors/ImageProcessor';
import { ResponseProcessor } from './processors/ResponseProcessor';
import { RequestHandler } from './handlers/RequestHandler';
import { getMimeTypeOptions } from './processors/ImageProcessor';
import { DEFAULT_MODEL_PARAMETERS } from './constants/config';
import { fetchAllVisionModels, detectCredentials } from './utils/GenericFunctions';

export class UniversalLlmVision implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Universal LLM Vision',
    name: 'universalLlmVision',
    icon: 'file:vision.svg',
    group: ['transform'],
    version: [1, 1.1],
    defaultVersion: 1.1,
    subtitle: '={{$parameter["model"] + " - " + $parameter["imageSource"]}}',
      description: 'Analyze images using multiple LLM vision providers (OpenRouter, Groq, Grok, OpenAI, Anthropic, Google Gemini)',
    defaults: {
      name: 'Universal LLM Vision',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'universalLlmVisionApi',
        required: true,
      },
    ],
    properties: [
      // Version 1: Simple string input
      {
        displayName: 'Model',
        name: 'model',
        type: 'string',
        displayOptions: {
          show: {
            '@version': [1],
          },
        },
        required: true,
        default: '',
        placeholder: 'e.g., gpt-4-vision-preview, claude-3-opus-20240229',
        description: 'Vision-capable model ID for the selected provider (e.g., gpt-4-vision-preview, claude-3-opus-20240229)',
      },
      // Version 1.1: Dynamic dropdown with auto-fetch
      {
        displayName: 'Model',
        name: 'model',
        type: 'options',
        displayOptions: {
          show: {
            '@version': [1.1],
          },
        },
        typeOptions: {
          loadOptionsMethod: 'getModels',
          allowCustomValue: true,
        },
        required: false,
        default: '',
        description: 'Vision-capable model for the selected provider. List is fetched automatically. To enter a model ID manually (e.g., for custom providers), use "Manual Model ID" in Advanced Options.',
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
        default: 'Analyze this image and describe what you see',
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
            default: DEFAULT_MODEL_PARAMETERS.temperature,
            description: 'Randomness level. Use 0.2 for factual analysis (recommended), 0.7+ for creative descriptions',
          },
          {
            displayName: 'Max Tokens',
            name: 'maxTokens',
            type: 'number',
            default: DEFAULT_MODEL_PARAMETERS.maxTokens,
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
            default: DEFAULT_MODEL_PARAMETERS.topP,
            description: 'Nucleus sampling. Keep at 0.9 for best results (default)',
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
            default: DEFAULT_MODEL_PARAMETERS.imageDetail,
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
            displayName: 'Manual Model ID',
            name: 'manualModelId',
            type: 'string',
            default: '',
            placeholder: 'e.g., gpt-4-vision-preview, claude-3-opus-20240229',
            description: 'Manually specify a model ID. When provided, this overrides the automatic Model selection. Use this for custom providers or when automatic fetching fails.',
            displayOptions: {
              show: {
                '@version': [1.1],
              },
            },
          },
          {
            displayName: 'System Prompt',
            name: 'systemPrompt',
            type: 'string',
            typeOptions: { rows: 8 },
            default: 'You are an AI assistant specialized in image understanding and visual analysis.\n\nRules:\n- Use only information clearly visible in the image\n- Never guess or assume information that cannot be visually confirmed\n- If unable to answer fully, explain what\'s missing\n- Be concise, factual, and neutral by default\n\nAdapt your response to the user\'s request:\n- Text extraction → reproduce exactly as seen\n- Description → summarize visible elements\n- Unanswerable questions → state this explicitly',
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

  methods = {
    loadOptions: {
      /**
       * Fetch available vision-capable models from models.dev API, filtered by provider
       * @param this - The load options context provided by n8n
       * @returns Promise<INodePropertyOptions[]> - Array of model options
       */
      async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        try {
          // Detect configured credentials to get the selected provider
          const credInfo = await detectCredentials(
            (type: string) => this.getCredentials(type),
          );

          const { provider } = credInfo;

          // Fetch vision-capable models, filtered by the selected provider
          const models = await fetchAllVisionModels(
            this.helpers.httpRequest,
            provider,
          );

          // Check if model list is empty (common with custom providers)
          if (models.length === 0) {
            return [
              {
                name: '⚠️ No models found for this provider',
                value: '',
                description: 'Add "Manual Model ID" in Advanced Options and enter the model ID directly (e.g., gpt-4-vision, claude-3-opus)',
              },
            ];
          }

          // Convert to INodePropertyOptions format
          return models.map((model) => ({
            name: model.name,
            value: model.id,
            description: model.description,
          }));
        } catch (error) {
          // Return error message as option if fetching fails
          return [
            {
              name: '⚠️ Error loading models from models.dev',
              value: '',
              description: `${(error as Error).message}. Add "Manual Model ID" in Advanced Options and enter the model ID directly (e.g., gpt-4-vision, claude-3-opus)`,
            },
          ];
        }
      },
    },
  };

  /**
   * Execute the Universal LLM Vision node
   * Processes images through various LLM vision providers (OpenAI, Anthropic, Groq, etc.)
   * @param this - The execution context provided by n8n
   * @returns Promise<INodeExecutionData[][]> - Array of processed items with analysis results
   */
  // eslint-disable-next-line no-unused-vars
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Detect configured credentials
    const credInfo = await detectCredentials(
      (type: string) => this.getCredentials(type),
    );

    const { credentials, credentialName, provider, apiKey, customBaseUrl } = credInfo;

    // Process each input item
    for (let i = 0; i < items.length; i++) {
      try {
        // Extract node parameters for this item
        const nodeVersion = this.getNode().typeVersion;
        const advancedOptions = this.getNodeParameter('advancedOptions', i) as any;
        const manualModelId = nodeVersion >= 1.1 ? (advancedOptions.manualModelId as string || '').trim() : '';
        
        // Prioritize manual model ID if provided (v1.1+), otherwise use model from parameter
        const model = manualModelId !== '' 
          ? manualModelId
          : (this.getNodeParameter('model', i, '') as string);
        
        // Validate model ID is provided
        if (!model || model.trim() === '') {
          throw new Error('Model is required. Please select a model from the dropdown or specify a "Manual Model ID" in Advanced Options.');
        }
        
        const prompt = this.getNodeParameter('prompt', i) as string;
        const modelParameters = this.getNodeParameter('modelParameters', i) as any;
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