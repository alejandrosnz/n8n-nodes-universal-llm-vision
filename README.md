# n8n-nodes-universal-llm-vision

A comprehensive n8n community node for analyzing images using multiple LLM vision providers (OpenRouter, Groq, Grok, OpenAI, Anthropic, Google Gemini).

## Installation

Install via n8n's community node interface:

1. Open n8n in your browser
2. Go to Settings > Community Nodes
3. Search for "n8n-nodes-universal-llm-vision" and install

## Features

- ✅ Image analysis using multiple LLM providers
- ✅ Support for binary data, URLs, and base64 images
- ✅ Flexible prompts and model parameters
- ✅ Metadata inclusion (usage, tokens)
- ✅ Custom headers and advanced parameters
- ✅ Comprehensive testing included
- ✅ n8n Agents compatible
- ✅ **Auto-discovery of all vision-capable models from the market** (powered by [models.dev](https://models.dev))

## Usage

### Basic Setup

1. Add the "Universal LLM Vision" node to your n8n workflow
2. Configure your API credentials for the chosen provider
3. Select image source and analysis parameters

![Sample usage in a workflow](docs/img/sample_usage.png)

### Supported Providers

- OpenAI
- Google Gemini
- Anthropic
- OpenRouter
- Groq
- Grok (X.AI)
- Custom (OpenAI-compatible API)

### Supported Models

The node automatically fetches and displays **all vision-capable models** from the market using the [models.dev](https://models.dev) API. This includes:

- GPT 5, GPT 4.1, GPT 4o, ... (OpenAI)
- Claude 4.5 Sonnet & Haiku, ... (Anthropic)
- Gemini 2.5 Flash Lite, Gemini 3.0 Flash, ... (Google)
- Gemma 3 27B, GLM 4.6V, Ministral 3, Nemotron VL, Qwen3 VL, ... (OpenRouter)
- Llama 4 Maverick (Groq)
- Grok 4.1 Fast (Grok/X.AI)
- And many more providers and models!

**Note**: The model list is fetched dynamically and includes only models that support image input. Each model shows its context window size and pricing information to help you make informed decisions.

### Available Operations

- **Analyze Image**: Analyze images with custom prompts

### Configuration

#### Credentials

Set up your API credentials:

- **Provider**: Select LLM provider (OpenAI, Anthropic, etc.)
- **API Key**: Your provider's API key
- **Base URL**: Custom API endpoint (optional, defaults provided)

#### Custom Provider Configuration

To use a custom OpenAI-compatible LLM vision API:

- Select "Custom Provider" and provide your API Key
- Set the Base URL (e.g., `https://your-api.com/v1`)

**Requirements**: API must support `/chat/completions` with OpenAI-style requests/responses and Bearer auth.

**Example**: Set Base URL to `https://my-vision-api.com/v1` and ensure vision support.

**Troubleshooting**: Check API key and endpoint for auth issues; verify OpenAI compatibility for format errors.

#### Node Parameters

- **Model**: Model identifier - auto-populated with all vision-capable models from the market, including context size and pricing info
- **Image Source**: Binary Data, URL, or Base64
- **Prompt**: Analysis prompt
- **Image Detail**: Auto/Low/High resolution
- **Model Parameters**: Temperature, Max Tokens, Top P
- **Advanced Options**: 
  - **Manual Model ID**: Optionally specify a model ID manually. When provided, this overrides the automatic Model dropdown selection. Useful for custom providers or when automatic model fetching fails.
  - System prompt, response format, custom headers, additional parameters
- **Output**: Property name and metadata inclusion

#### Manual Model ID

The node prioritizes the **Manual Model ID** field if it has a value. Use this when:
- Automatic model fetching fails (common with custom providers)
- The model you want isn't in the auto-fetched list
- You prefer to specify the model ID directly

**How to use:**

1. Open **Advanced Options**
2. Fill in **Manual Model ID** with your model identifier (e.g., `gpt-4-vision-preview`, `claude-3-opus-20240229`)
3. The node will use this model ID instead of the dropdown selection
4. Leave it empty to use the automatic Model dropdown as normal

## Examples

See the [example workflow](example-workflow.json) for a complete setup.

![Sample analysis result](docs/img/sample_analysis.png)

### Analyze Image from Binary Data

1. Use a "Download" node to fetch an image
2. Connect to "Universal LLM Vision" node
3. Set Image Source to "Binary Data"
4. Configure prompt: "Describe this image in detail"

### Analyze Image from URL

1. Add "Universal LLM Vision" node
2. Set Image Source to "URL"
3. Provide image URL
4. Use prompt: "Extract all text from this image (OCR)"


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