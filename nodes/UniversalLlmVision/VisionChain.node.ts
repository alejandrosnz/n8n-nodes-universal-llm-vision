import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { UNIVERSAL_DEFAULTS, ERROR_MESSAGES } from './constants/config';
import { getImageFromSource } from './utils/ImageSourceHelpers';
import { AudioProcessor } from './processors/AudioProcessor';
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
  AUDIO_SOURCE_PARAMETER,
  AUDIO_BINARY_PROPERTY_PARAMETER,
  AUDIO_FILENAME_PARAMETER,
  AUDIO_URL_PARAMETER,
  AUDIO_BASE64_DATA_PARAMETER,
  AUDIO_MIME_TYPE_PARAMETER,
  AUDIO_PROMPT_PARAMETER,
} from './constants/audioParameters';
import {
  buildImageMessageContent,
  buildAudioMessageContent,
  extractResponseText,
} from './utils/visionChainHelpers';

/**
 * Vision Chain Node
 *
 * Adds vision and audio capabilities to any connected chat model by formatting multimodal messages.
 * This chain node receives a chat model connection and enhances it with image/audio processing,
 * supporting binary data, URLs, and base64 inputs.
 */
export class VisionChain implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Vision Chain',
    name: 'visionChain',
    icon: 'file:icon.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["resource"] === "analyzeAudio" ? "Audio" : "Image"}}',
    description:
      'Add vision and audio capabilities to any chat model by processing images and audio with multimodal prompts',
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
      // Resource selector
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Analyze Image',
            value: 'analyzeImage',
            description: 'Send an image + prompt to a vision-capable LLM',
          },
          {
            name: 'Analyze Audio',
            value: 'analyzeAudio',
            description: 'Send an audio file + prompt to an audio-capable LLM',
          },
        ],
        default: 'analyzeImage',
      },

      // ─────────────────────────────────────────────────────────────────
      // Image Parameters (show for analyzeImage)
      // ─────────────────────────────────────────────────────────────────
      {
        ...IMAGE_SOURCE_PARAMETER,
        displayOptions: {
          show: {
            resource: ['analyzeImage'],
          },
        },
      },
      {
        ...BINARY_PROPERTY_PARAMETER,
        displayOptions: {
          show: {
            resource: ['analyzeImage'],
            imageSource: ['binary'],
          },
        },
      },
      {
        ...FILENAME_PARAMETER,
        displayOptions: {
          show: {
            resource: ['analyzeImage'],
            imageSource: ['binary'],
          },
        },
      },
      {
        ...IMAGE_URL_PARAMETER,
        displayOptions: {
          show: {
            resource: ['analyzeImage'],
            imageSource: ['url'],
          },
        },
      },
      {
        ...BASE64_DATA_PARAMETER,
        displayOptions: {
          show: {
            resource: ['analyzeImage'],
            imageSource: ['base64'],
          },
        },
      },
      {
        ...BASE64_MIME_TYPE_PARAMETER_SIMPLE,
        displayOptions: {
          show: {
            resource: ['analyzeImage'],
            imageSource: ['base64'],
          },
        },
      },
      {
        ...PROMPT_PARAMETER,
        displayOptions: {
          show: {
            resource: ['analyzeImage'],
          },
        },
      },

      // ─────────────────────────────────────────────────────────────────
      // Audio Parameters (show for analyzeAudio)
      // ─────────────────────────────────────────────────────────────────
      {
        ...AUDIO_SOURCE_PARAMETER,
        displayOptions: {
          show: {
            resource: ['analyzeAudio'],
          },
        },
      },
      {
        ...AUDIO_BINARY_PROPERTY_PARAMETER,
        displayOptions: {
          show: {
            resource: ['analyzeAudio'],
            audioSource: ['binary'],
          },
        },
      },
      {
        ...AUDIO_FILENAME_PARAMETER,
        displayOptions: {
          show: {
            resource: ['analyzeAudio'],
            audioSource: ['binary'],
          },
        },
      },
      {
        ...AUDIO_URL_PARAMETER,
        displayOptions: {
          show: {
            resource: ['analyzeAudio'],
            audioSource: ['url'],
          },
        },
      },
      {
        ...AUDIO_BASE64_DATA_PARAMETER,
        displayOptions: {
          show: {
            resource: ['analyzeAudio'],
            audioSource: ['base64'],
          },
        },
      },
      {
        ...AUDIO_MIME_TYPE_PARAMETER,
        displayOptions: {
          show: {
            resource: ['analyzeAudio'],
            audioSource: ['base64'],
          },
        },
      },
      {
        ...AUDIO_PROMPT_PARAMETER,
        displayOptions: {
          show: {
            resource: ['analyzeAudio'],
          },
        },
      },

      // Common parameters
      OUTPUT_PROPERTY_PARAMETER,

      // Options collection
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
            default: UNIVERSAL_DEFAULTS.SYSTEM_PROMPT,
            description: 'System instructions for the model (uses default if empty)',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Get the connected chat model
    const model = (await this.getInputConnectionData('ai_languageModel', 0)) as BaseChatModel;

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
  items: INodeExecutionData[]
): Promise<INodeExecutionData> {
  const resource = this.getNodeParameter('resource', itemIndex) as 'analyzeImage' | 'analyzeAudio';
  const prompt = this.getNodeParameter('prompt', itemIndex) as string;
  const outputPropertyName = this.getNodeParameter('outputPropertyName', itemIndex) as string;
  const options = this.getNodeParameter('options', itemIndex, {}) as {
    imageDetail?: 'auto' | 'low' | 'high';
    systemPrompt?: string;
  };

  let messageContent: any;

  if (resource === 'analyzeAudio') {
    // Handle audio
    const audioProcessor = new AudioProcessor(this);
    const preparedAudio = await audioProcessor.getPreparedAudio(itemIndex);
    messageContent = buildAudioMessageContent(prompt, preparedAudio);
  } else {
    // Handle image
    const imageResult = await getImageFromSource(this, itemIndex, true);
    const imageContent = imageResult.data;
    messageContent = buildImageMessageContent(prompt, imageContent, options);
  }

  // Create the messages array with optional system prompt
  const messages: any[] = [];
  if (options.systemPrompt) {
    messages.push({
      role: 'system',
      content: options.systemPrompt,
    });
  }

  // Add the human message with content
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
