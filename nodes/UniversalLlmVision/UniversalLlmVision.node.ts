import type {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { ImageProcessor } from './processors/ImageProcessor';
import { AudioProcessor } from './processors/AudioProcessor';
import { ResponseProcessor } from './processors/ResponseProcessor';
import { RequestHandler } from './handlers/RequestHandler';
import { DEFAULT_MODEL_PARAMETERS, UNIVERSAL_DEFAULTS } from './constants/config';
import { detectCredentials } from './utils/GenericFunctions';
import { loadModelsForDropdown } from './utils/ModelLoader';
import {
  IMAGE_SOURCE_PARAMETER,
  BINARY_PROPERTY_PARAMETER,
  FILENAME_PARAMETER,
  IMAGE_URL_PARAMETER,
  BASE64_DATA_PARAMETER,
  BASE64_MIME_TYPE_PARAMETER_WITH_OPTIONS,
  PROMPT_PARAMETER,
  IMAGE_DETAIL_PARAMETER,
} from './constants/imageParameters';
import {
  AUDIO_SOURCE_PARAMETER,
  AUDIO_BINARY_PROPERTY_PARAMETER,
  AUDIO_FILENAME_PARAMETER,
  AUDIO_URL_PARAMETER,
  AUDIO_BASE64_DATA_PARAMETER,
  AUDIO_MIME_TYPE_PARAMETER,
  AUDIO_PROMPT_PARAMETER,
} from './constants/audioParameters';

export class UniversalLlmVision implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Universal LLM Vision',
    name: 'universalLlmVision',
    icon: 'file:icon.svg',
    group: ['transform'],
    version: [1, 1.1, 1.2],
    defaultVersion: 1.2,
    subtitle:
      '={{($parameter["resource"] === "analyzeAudio" ? "Audio" : $parameter["imageSource"]) + " · " + $parameter["model"]}}',
    description:
      'Analyze images and audio using multiple LLM providers (OpenRouter, Groq, Grok, OpenAI, Anthropic, Google Gemini)',
    defaults: {
      name: 'Universal LLM Vision',
    },
    inputs: ['main'],
    outputs: ['main'],
    usableAsTool: true,
    credentials: [
      {
        name: 'universalLlmVisionApi',
        required: true,
      },
    ],
    properties: [
      // ─────────────────────────────────────────────────────────────────
      // Resource selector (v1.2 only)
      // ─────────────────────────────────────────────────────────────────
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            '@version': [1.2],
          },
        },
        options: [
          {
            name: 'Analyze Image',
            value: 'analyzeImage',
            description: 'Send an image + prompt to an LLM vision model',
          },
          {
            name: 'Analyze Audio',
            value: 'analyzeAudio',
            description:
              'Send an audio file + prompt to a multimodal LLM (e.g. GPT-4o audio, Gemini)',
          },
        ],
        default: 'analyzeImage',
      },

      // ─────────────────────────────────────────────────────────────────
      // Model — Version 1: plain string
      // ─────────────────────────────────────────────────────────────────
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
        placeholder: 'e.g., gpt-5-nano, gemini-3.0-flash',
        description:
          'Vision-capable model ID for the selected provider (e.g., gpt-5-nano, gemini-3.0-flash)',
      },
      // Model — Version 1.1: dynamic dropdown, image resource only
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
        description:
          'Vision-capable model for the selected provider. List is fetched automatically. To enter a model ID manually (e.g., for custom providers), use "Manual Model ID" in Advanced Options.',
      },
      // Model — Version 1.2: dynamic dropdown (image + audio)
      {
        displayName: 'Model',
        name: 'model',
        type: 'options',
        displayOptions: {
          show: {
            '@version': [1.2],
          },
        },
        typeOptions: {
          loadOptionsMethod: 'getModels',
          allowCustomValue: true,
        },
        required: false,
        default: '',
        description:
          'Model for the selected provider. List is fetched automatically. Use "Manual Model ID" in Advanced Options to enter a model ID directly (e.g., gpt-4o-audio-preview for audio).',
      },

      // ─────────────────────────────────────────────────────────────────
      // IMAGE parameters — shown for v1/v1.1 always, and for v1.2 only
      // when resource === 'analyzeImage'.
      // We spread the shared constants and add the hide condition inline.
      // ─────────────────────────────────────────────────────────────────
      {
        ...IMAGE_SOURCE_PARAMETER,
        displayOptions: {
          hide: { resource: ['analyzeAudio'] },
        },
      },
      {
        ...BINARY_PROPERTY_PARAMETER,
        displayOptions: {
          show: { imageSource: ['binary'] },
          hide: { resource: ['analyzeAudio'] },
        },
      },
      {
        ...FILENAME_PARAMETER,
        displayOptions: {
          show: { imageSource: ['binary'] },
          hide: { resource: ['analyzeAudio'] },
        },
      },
      {
        ...IMAGE_URL_PARAMETER,
        displayOptions: {
          show: { imageSource: ['url'] },
          hide: { resource: ['analyzeAudio'] },
        },
      },
      {
        ...BASE64_DATA_PARAMETER,
        displayOptions: {
          show: { imageSource: ['base64'] },
          hide: { resource: ['analyzeAudio'] },
        },
      },
      {
        ...BASE64_MIME_TYPE_PARAMETER_WITH_OPTIONS,
        displayOptions: {
          show: { imageSource: ['base64'] },
          hide: { resource: ['analyzeAudio'] },
        },
      },
      {
        ...PROMPT_PARAMETER,
        displayOptions: {
          hide: { resource: ['analyzeAudio'] },
        },
      },

      // ─────────────────────────────────────────────────────────────────
      // AUDIO parameters — shown only for v1.2 when resource === 'analyzeAudio'
      // ─────────────────────────────────────────────────────────────────
      {
        ...AUDIO_SOURCE_PARAMETER,
        displayOptions: {
          show: {
            '@version': [1.2],
            resource: ['analyzeAudio'],
          },
        },
      },
      {
        ...AUDIO_BINARY_PROPERTY_PARAMETER,
        displayOptions: {
          show: {
            '@version': [1.2],
            resource: ['analyzeAudio'],
            audioSource: ['binary'],
          },
        },
      },
      {
        ...AUDIO_FILENAME_PARAMETER,
        displayOptions: {
          show: {
            '@version': [1.2],
            resource: ['analyzeAudio'],
            audioSource: ['binary'],
          },
        },
      },
      {
        ...AUDIO_URL_PARAMETER,
        displayOptions: {
          show: {
            '@version': [1.2],
            resource: ['analyzeAudio'],
            audioSource: ['url'],
          },
        },
      },
      {
        ...AUDIO_BASE64_DATA_PARAMETER,
        displayOptions: {
          show: {
            '@version': [1.2],
            resource: ['analyzeAudio'],
            audioSource: ['base64'],
          },
        },
      },
      {
        ...AUDIO_MIME_TYPE_PARAMETER,
        displayOptions: {
          show: {
            '@version': [1.2],
            resource: ['analyzeAudio'],
            audioSource: ['base64'],
          },
        },
      },
      {
        ...AUDIO_PROMPT_PARAMETER,
        displayOptions: {
          show: {
            '@version': [1.2],
            resource: ['analyzeAudio'],
          },
        },
      },

      // ─────────────────────────────────────────────────────────────────
      // Model parameters (image detail is image-only; the rest apply to both)
      // ─────────────────────────────────────────────────────────────────
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
            description:
              'Randomness level. Use 0.2 for factual analysis (recommended), 0.7+ for creative descriptions',
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
            ...IMAGE_DETAIL_PARAMETER,
          },
        ],
      },

      // ─────────────────────────────────────────────────────────────────
      // Advanced options
      // ─────────────────────────────────────────────────────────────────
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
            placeholder: 'e.g., gpt-4o-audio-preview, gemini-2.0-flash',
            description:
              'Manually specify a model ID. When provided, this overrides the automatic Model selection. Use this for custom providers or when automatic fetching fails.',
          },
          {
            displayName: 'System Prompt',
            name: 'systemPrompt',
            type: 'string',
            typeOptions: { rows: 8 },
            default: UNIVERSAL_DEFAULTS.SYSTEM_PROMPT,
            description: 'System instructions for the model (uses default if empty)',
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

      // ─────────────────────────────────────────────────────────────────
      // Output configuration
      // ─────────────────────────────────────────────────────────────────
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
       * Fetch available vision/audio-capable models from models.dev API or provider API
       * @param this - The load options context provided by n8n
       * @returns Promise<INodePropertyOptions[]> - Array of model options
       */
      async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        try {
          // Detect configured credentials to get the selected provider
          const credInfo = await detectCredentials((type: string) => this.getCredentials(type));

          // Determine which modality to filter by based on the selected resource
          const resource = this.getCurrentNodeParameter?.('resource') as string | undefined;
          const modality: 'image' | 'audio' = resource === 'analyzeAudio' ? 'audio' : 'image';

          // Load models based on provider type (custom provider API or models.dev)
          return loadModelsForDropdown(credInfo, this.helpers.httpRequest, modality);
        } catch (error) {
          // Return error message if credential detection or loading fails
          return [
            {
              name: '⚠️ Error loading models',
              value: '',
              description: `${(error as Error).message}. Add "Manual Model ID" in Advanced Options and enter the model ID directly.`,
            },
          ];
        }
      },
    },
  };

  /**
   * Execute the Universal LLM Vision node
   * Processes images or audio through various LLM providers (OpenAI, Anthropic, Groq, etc.)
   * @param this - The execution context provided by n8n
   * @returns Promise<INodeExecutionData[][]> - Array of processed items with analysis results
   */
  // eslint-disable-next-line no-unused-vars
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Detect configured credentials
    const credInfo = await detectCredentials((type: string) => this.getCredentials(type));

    const { credentials, credentialName, provider, apiKey, customBaseUrl } = credInfo;

    // Process each input item
    for (let i = 0; i < items.length; i++) {
      try {
        const nodeVersion = this.getNode().typeVersion;

        // Resolve resource — 'analyzeImage' for v1/v1.1 (no resource param), or from parameter for v1.2
        const resource =
          nodeVersion >= 1.2
            ? (this.getNodeParameter('resource', i, 'analyzeImage') as string)
            : 'analyzeImage';

        const advancedOptions = this.getNodeParameter('advancedOptions', i) as any;
        const manualModelId =
          nodeVersion >= 1.1 ? ((advancedOptions.manualModelId as string) || '').trim() : '';

        // Prioritize manual model ID if provided (v1.1+), otherwise use dropdown
        const model =
          manualModelId !== '' ? manualModelId : (this.getNodeParameter('model', i, '') as string);

        if (!model || model.trim() === '') {
          const hint =
            resource === 'analyzeAudio'
              ? 'For audio, try models like gpt-4o-audio-preview or gemini-2.0-flash.'
              : 'Please select a model from the dropdown or specify a "Manual Model ID" in Advanced Options.';
          throw new Error(`Model is required. ${hint}`);
        }

        const prompt = this.getNodeParameter('prompt', i) as string;
        const modelParameters = this.getNodeParameter('modelParameters', i) as any;
        const outputPropertyName = this.getNodeParameter('outputPropertyName', i) as string;
        const includeMetadata = advancedOptions.includeMetadata || false;

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

        const requestHandler = new RequestHandler(this);
        const responseProcessor = new ResponseProcessor();

        // ── Route by resource ──────────────────────────────────────────
        if (resource === 'analyzeAudio') {
          // Audio analysis
          const audioProcessor = new AudioProcessor(this);
          const preparedAudio = await audioProcessor.getPreparedAudio(i);

          // Use universal system prompt if none provided
          const audioOptions = {
            ...advancedOptions,
            systemPrompt: advancedOptions.systemPrompt || UNIVERSAL_DEFAULTS.SYSTEM_PROMPT,
          };

          const response = await requestHandler.executeRequest(
            provider,
            apiKey,
            customBaseUrl,
            customHeadersRecord,
            model,
            undefined, // no image
            preparedAudio,
            prompt,
            modelParameters,
            audioOptions
          );

          const result = responseProcessor.processResponse(
            response,
            provider,
            includeMetadata,
            outputPropertyName
          );

          returnData.push({
            json: { ...items[i].json, ...result },
            binary: items[i].binary,
          });
        } else {
          // Image analysis (default, all versions)
          const imageProcessor = new ImageProcessor(this);
          const preparedImage = await imageProcessor.getPreparedImage(i);

          const response = await requestHandler.executeRequest(
            provider,
            apiKey,
            customBaseUrl,
            customHeadersRecord,
            model,
            preparedImage,
            undefined, // no audio
            prompt,
            modelParameters,
            advancedOptions
          );

          const result = responseProcessor.processResponse(
            response,
            provider,
            includeMetadata,
            outputPropertyName
          );

          returnData.push({
            json: { ...items[i].json, ...result },
            binary: items[i].binary,
          });
        }
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
