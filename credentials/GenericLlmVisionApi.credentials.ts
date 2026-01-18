import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class GenericLlmVisionApi implements ICredentialType {
  name = 'genericLlmVisionApi';
  displayName = 'Generic LLM Vision API';

  properties: INodeProperties[] = [
    {
      displayName: 'Provider',
      name: 'provider',
      type: 'options',
      options: [
        { name: 'OpenRouter', value: 'openrouter' },
        { name: 'Groq', value: 'groq' },
        { name: 'Grok (X.AI)', value: 'grok' },
        { name: 'OpenAI', value: 'openai' },
        { name: 'Anthropic', value: 'anthropic' },
        { name: 'Custom Provider', value: 'custom' },
      ],
      default: 'openai',
      required: true,
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: '',
      placeholder: 'https://api.example.com/v1',
      description: 'Leave empty to use default URL for the selected provider',
      displayOptions: {
        show: { provider: ['custom'] },
      },
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'Authorization': '=Bearer {{$credentials.apiKey}}',
        'x-api-key': '={{$credentials.provider === "anthropic" ? $credentials.apiKey : undefined}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{ $credentials.baseUrl || ($credentials.provider === "openrouter" ? "https://openrouter.ai/api/v1" : $credentials.provider === "groq" ? "https://api.groq.com/openai/v1" : $credentials.provider === "grok" ? "https://api.x.ai/v1" : $credentials.provider === "anthropic" ? "https://api.anthropic.com/v1" : "https://api.openai.com/v1") }}',
      url: '/models',
    },
  };
}