# n8n-nodes-universal-llm-vision

**Add vision capabilities to your n8n workflows** - Analyze images with AI using any LLM provider, with flexible integration options for every use case.

This package provides **two complementary nodes** that give you vision capabilities in n8n:

- 🎯 **Universal LLM Vision** - Direct API integration with 300+ vision models, auto-discovery, and full parameter control
- 🔗 **Vision Chain** - Langchain-compatible chain that adds vision to any n8n chat model, perfect for AI agents

Choose the approach that fits your workflow: standalone for power users, or langchain integration for AI agent workflows.

## Why This Package?

### 🚀 Two Powerful Approaches to Vision AI

**Most n8n vision solutions lock you into one approach.** This package gives you flexibility:

1. **Universal LLM Vision** node - For when you need maximum control:
   - Access to 300+ vision models from 20+ providers (auto-discovered from [models.dev](https://models.dev))
   - Direct API control with custom headers, parameters, and response formats
   - Works with custom/proprietary endpoints
   - Detailed metadata output (tokens, usage, costs)
   - Perfect for production workflows with specific requirements
   - Use it in AI Agents as a Vision Tool

2. **Vision Chain** - For seamless langchain integration:
   - Connect to any n8n chat model (OpenAI, Anthropic, OpenRouter, etc.)
   - Native langchain chain pattern for AI agent workflows
   - Credentials managed at the chat model level
   - Swap models without reconfiguring
   - Perfect for rapid prototyping and AI agent development

**Both nodes:**
- ✅ Support binary data, URLs, and base64 images
- ✅ Configurable system prompts with intelligent defaults

## Installation

Install via n8n's community node interface:

1. Open n8n in your browser
2. Go to **Settings > Community Nodes**
3. Search for `n8n-nodes-universal-llm-vision` and click Install

Both nodes will be available in your node palette under the **"AI"** category.

## Which Node Should I Use?

### Use **Vision Chain** when:
- ✅ You want to use n8n's builtin chat model nodes (OpenAI, Anthropic, OpenRouter, etc.)
- ✅ You prefer managing credentials at the chat model level
- ✅ You only need basic vision features (image analysis with prompts)

### Use **Universal LLM Vision** when:
- ✅ You need direct API control with custom headers and additional parameters
- ✅ You're working with custom/proprietary LLM endpoints
- ✅ You need the vision compatible-model auto-fetch feature
- ✅ You need to use in an AI Agent as a tool

📖 **[Read the detailed comparison in the Vision Chain documentation](docs/VISION_CHAIN.md)**

## Features

### Universal LLM Vision

- **300+ Vision Models**: Auto-discovery from [models.dev](https://models.dev) with pricing displayed
- **AI Agent Ready**: Works seamlessly with n8n AI Agent nodes
- **Full API Control**: Custom headers, additional parameters, response format (JSON mode)
- **Rich Metadata**: Usage stats, token counts, model info in output
- **Provider Support**: OpenAI, Anthropic, Google Gemini, OpenRouter, Groq, Grok, Custom APIs
- **Custom Endpoints**: Works with any OpenAI-compatible API
- **System Prompts**: Intelligent defaults for image analysis, fully customizable
- **Output Control**: Configurable property names, original data preservation

### Vision Chain

- **Langchain Native**: True chain node pattern for n8n's AI ecosystem
- **Flexible Models**: Connect any n8n chat model (swap models without reconfiguring)
- **Simple Setup**: No credential duplication, managed at chat model level
- **Smart Defaults**: Comprehensive system prompt for image understanding

### Common Features

- **Multiple Image Sources**: Binary data (uploaded files), public URLs, base64 strings
- **Detail Control**: Auto/Low/High resolution for cost/quality balance
- **Smart Prompts**: Customizable prompts for any image analysis task
- **Production Ready**: Comprehensive test coverage (241 tests)
- **Data Pass-through**: Preserves all original input data

## Quick Start

### Vision Chain (Fastest Setup)

Perfect for getting started or building AI agents:

1. Add any **Chat Model** node (e.g., OpenAI Chat Model)
2. Add **Vision Chain** node
3. Connect: `Chat Model` → `Vision Chain` (Chat Model input)
4. Configure image source and prompt
5. Done! ✨

```
[Your Data] → [Vision Chain] → [Next Node]
                    ↑
              [Chat Model]
```

### Universal LLM Vision (Full Control)

For production workflows with specific requirements:

1. Add **Universal LLM Vision** node
2. Configure credentials (provider + API key)
3. Select model from 300+ options
4. Configure image source and prompt
5. Customize parameters, headers, system prompt as needed
6. Done! ✨

```
[Your Data] → [Universal LLM Vision] → [Next Node]
```

📖 **[Complete workflow example](example-workflow.json)**

## Use Cases

### 🔍 Image Analysis
- Product catalog descriptions
- Visual quality inspection
- Scene understanding
- Object detection and counting

### 📝 Document Processing
- OCR (text extraction from images)
- Invoice/receipt parsing
- Handwriting recognition
- Form data extraction

### 🏥 Specialized Analysis
- Medical image assessment
- Architectural plan review
- Fashion/style analysis
- Art and design critique

### 🤖 AI Agents with Vision
- Customer support bots that understand images
- Visual Q&A assistants
- Image-based workflow automation
- Multimodal conversational agents

## Detailed Configuration

### Universal LLM Vision Node

#### Providers & Models

**Supported Providers:**
- OpenAI (GPT-4o, GPT-4 Turbo with Vision)
- Google Gemini (Flash, Pro Vision)
- Anthropic (Claude Sonnet, Opus with Vision)
- OpenRouter (300+ models from multiple providers)
- Groq (Llama Vision, Mixtral Vision)
- Grok/X.AI (Grok Vision)
- Custom (any OpenAI-compatible API)

**Model Selection:**
The node auto-fetches all vision-capable models from [models.dev](https://models.dev), displaying:
- Model name
- Pricing (input/output per 1M tokens)
- Model ID in parentheses (e.g., `$2.5 / $10 per 1M tokens (gpt-4o)`)

**Tested Models:**
- OpenAI: GPT 5, GPT 4.1, GPT 4o
- Google: Gemini 2.5 Flash Lite, Gemini 3.0 Flash
- OpenRouter: Gemma 3 27B, GLM 4.6V, Ministral 3, Nemotron VL, Qwen3 VL
- Grok/X.AI: Grok 4.1 Fast

#### Credentials

1. Select your provider
2. Enter API key
3. (Optional) Custom base URL for custom providers

For **custom OpenAI-compatible APIs**:
- Select "Custom Provider"
- Provide Base URL (e.g., `https://your-api.com/v1`)
- The node will attempt to auto-fetch available models
- Use **Manual Model ID** if auto-fetch fails

#### Parameters

**Required:**
- **Model**: Select from dropdown or enter manually
- **Image Source**: Binary Data / URL / Base64
- **Prompt**: Your analysis instruction

**Optional (Model Parameters):**
- Temperature (0-2): Creativity level
- Max Tokens: Response length limit
- Top P: Nucleus sampling parameter

**Advanced Options:**
- System Prompt: Guide model behavior (intelligent default provided)
- Response Format: Text or JSON
- Custom Headers: Add custom HTTP headers
- Additional Parameters: Provider-specific parameters
- Manual Model ID: Override model selection
- Output Property Name: Where to store result (default: `analysis`)
- Include Metadata: Add usage stats and token counts

### Vision Chain Node

#### Setup

1. **Add Chat Model**: Any n8n chat model (OpenAI, Anthropic, etc.)
2. **Connect to Vision Chain**: Use the "Chat Model" input
3. **Configure Image Source**: Binary / URL / Base64
4. **Write Prompt**: Your analysis instruction

#### Parameters

**Required:**
- **Image Source**: Binary Data / URL / Base64
- **Prompt**: Analysis instruction

**Options:**
- **Image Detail**: Auto / Low / High (affects cost and quality)
- **System Prompt**: Comprehensive default for image understanding (customizable)
- **Output Property Name**: Configure result property (default: `analysis`)

**Note:** Temperature, max tokens, and model selection are configured at the chat model node level.

## Examples & Workflows

### 📥 Example Files

- **[example-workflow.json](example-workflow.json)** - Complete Universal LLM Vision workflow
- **[example-vision-chain-workflow.json](example-vision-chain-workflow.json)** - Vision Chain with AI Agent

### Universal LLM Vision Examples

#### Image Analysis from URL
```
Webhook → Set (image URL) → Universal LLM Vision → Respond
```
Perfect for: Product catalog automation, web scraping with analysis

#### Batch Image Processing
```
Read Binary Files → Universal LLM Vision → IF → Split → [Process Results]
```
Perfect for: Quality control, document classification, content moderation

#### OCR with Structured Output
```
HTTP Request (get image) → Universal LLM Vision (JSON mode) → Set → Database
```
Configure:
- Response Format: JSON
- Prompt: "Extract text with structure: {title, date, amount, items: []}"

### Vision Chain Examples

#### AI Agent with Vision
```
Chat Trigger → AI Agent → Respond to User
                   ↓
              [Tools: Vision Chain, Calculator, ...]
                   ↑
              [Chat Model]
```
Perfect for: Customer support, visual Q&A, multimodal assistants

#### Dynamic Model Switching
```
[Data] → Vision Chain → [Output]
             ↑
        [Different Chat Models based on conditions]
```
Perfect for: Cost optimization, fallback strategies, A/B testing

#### Image Analysis Pipeline
```
Download File → Vision Chain (describe) → Vision Chain (extract text) → Process
                     ↑                         ↑
                [Model A]                  [Model B]
```
Perfect for: Multi-step analysis, combining different model strengths


## Why Choose This Package?

### 🎯 Flexibility First
Other vision packages lock you into one provider or pattern. This gives you **two powerful approaches** for different use cases.

### 🌐 Most Models Available
With **300+ auto-discovered models** from models.dev, you have access to more vision models than any other n8n package.

### 🔧 Production Ready
- **241 passing tests** with comprehensive coverage
- Intelligent error handling and validation
- Battle-tested in real workflows
- Active maintenance and updates

### 🤖 AI Agent Native
Both nodes work seamlessly with n8n's AI Agent ecosystem, making multimodal agent workflows simple.

### 📊 Transparent Pricing
Model selection shows pricing upfront, so you know costs before you run.

## Development & Contributing

This package is built using the [n8n-community-node-starter](https://github.com/alejandrosnz/n8n-community-node-starter) boilerplate, providing:

- Robust programmatic node architecture
- Comprehensive testing framework (Jest)
- CI/CD pipelines
- AI-assisted development tools


## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Links

- [n8n Documentation](https://docs.n8n.io/)
- [Community Nodes Guide](https://docs.n8n.io/integrations/community-nodes/)
- [n8n-community-node-starter](https://github.com/alejandrosnz/n8n-community-node-starter) - The boilerplate this node is based on