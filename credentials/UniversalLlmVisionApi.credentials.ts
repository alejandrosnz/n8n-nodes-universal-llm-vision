import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class UniversalLlmVisionApi implements ICredentialType {
  name = 'universalLlmVisionApi';
  displayName = 'Universal LLM Vision API';

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
        { name: 'Google Gemini', value: 'gemini' },
        { name: 'Custom Provider (OpenAI Compatible)', value: 'custom' },
      ],
      default: 'openai',
      required: true,
      description: 'Select the AI provider to use for vision-capable models. Choose Custom if your provider is not listed.',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'The API key from your provider account. Get it from your provider\'s dashboard or API settings.',
      displayOptions: {
        show: { provider: ['openrouter', 'groq', 'grok', 'openai', 'anthropic', 'gemini'] },
      },
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: false,
      description: 'The API key from your provider account. Leave empty if not required (e.g., local providers like Ollama).',
      displayOptions: {
        show: { provider: ['custom'] },
      },
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: '',
      placeholder: 'e.g., https://api.custom.com/v1 or http://localhost:11434/v1',
      description: 'The base URL endpoint for your OpenAI-compatible API',
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