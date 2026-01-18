# n8n-nodes-generic-llm-vision

A comprehensive n8n community node for analyzing images using multiple LLM vision providers (OpenRouter, Groq, Grok, OpenAI, Anthropic).

## Installation

Install via npm:

```bash
npm install n8n-nodes-generic-llm-vision
```

Or install via n8n's community node interface.

## Features

- ✅ Image analysis using multiple LLM providers
- ✅ Support for binary data, URLs, and base64 images
- ✅ Flexible prompts and model parameters
- ✅ Metadata inclusion (usage, tokens)
- ✅ Custom headers and advanced parameters
- ✅ Comprehensive testing included
- ✅ n8n Agents compatible

## Usage

### Basic Setup

1. Add the "Generic LLM Vision" node to your n8n workflow
2. Configure your API credentials for the chosen provider
3. Select image source and analysis parameters

### Supported Providers

- **OpenAI**: GPT-4o, GPT-4 Vision
- **Anthropic**: Claude 3.5 Sonnet
- **Groq**: Llama 3.2 90B Vision
- **Grok (X.AI)**: Grok Vision Beta
- **OpenRouter**: Various vision models
- **Custom**: Any compatible API

### Available Operations

- **Analyze Image**: Analyze images with custom prompts

### Configuration

#### Credentials

Set up your API credentials:

- **Provider**: Select LLM provider (OpenAI, Anthropic, etc.)
- **API Key**: Your provider's API key
- **Base URL**: Custom API endpoint (optional, defaults provided)

#### Node Parameters

- **Model**: Model identifier (e.g., gpt-4o)
- **Image Source**: Binary Data, URL, or Base64
- **Prompt**: Analysis prompt
- **Image Detail**: Auto/Low/High resolution
- **Model Parameters**: Temperature, Max Tokens, Top P
- **Advanced Options**: System prompt, response format, custom headers
- **Output**: Property name and metadata inclusion

## Examples

### Analyze Image from Binary Data

1. Use a "Download" node to fetch an image
2. Connect to "Generic LLM Vision" node
3. Set Image Source to "Binary Data"
4. Configure prompt: "Describe this image in detail"

### Analyze Image from URL

1. Add "Generic LLM Vision" node
2. Set Image Source to "URL"
3. Provide image URL
4. Use prompt: "Extract all text from this image (OCR)"

### Using Different Providers

- **OpenAI**: Model "gpt-4o", prompt for detailed descriptions
- **Anthropic**: Model "claude-3-5-sonnet-20241022", supports complex reasoning
- **Groq**: Fast inference with "llama-3.2-90b-vision-preview"

## Development

This node was built using the [n8n-community-node-starter](https://github.com/alejandrosnz/n8n-community-node-starter) boilerplate, which provides:

- Programmatic node architecture for complex logic
- Built-in CI/CD pipelines
- Comprehensive testing framework
- AI-assisted development support

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file.

## Links

- [n8n Documentation](https://docs.n8n.io/)
- [Community Nodes Guide](https://docs.n8n.io/integrations/community-nodes/)
- [n8n-community-node-starter](https://github.com/alejandrosnz/n8n-community-node-starter) - The boilerplate this node is based on