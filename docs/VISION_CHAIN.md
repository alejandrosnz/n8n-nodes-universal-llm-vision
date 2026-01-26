# Vision Chain Node

## Overview

The **Vision Chain** node is a langchain-compatible node that adds vision capabilities to any connected chat model. Unlike the original Universal LLM Vision node (which uses its own credentials and provider logic), the Vision Chain node:

- ✅ Accepts any langchain-compatible chat model as input
- ✅ Uses the credentials from the connected chat model
- ✅ Works with n8n's builtin AI Agent ecosystem
- ✅ Supports binary data, URLs, and base64 images
- ✅ Provides a cleaner separation of concerns (image processing vs. model invocation)

## When to Use Vision Chain vs. Universal LLM Vision

### Use Vision Chain When:
- You want to use n8n's builtin chat model nodes (OpenAI, Anthropic, OpenRouter, etc.)
- You're building AI agent workflows that need vision capabilities
- You prefer managing credentials at the chat model level
- You want flexibility to swap between different chat models

### Use Universal LLM Vision When:
- You need direct API control with custom headers and parameters
- You're working with custom/proprietary LLM endpoints
- You want standalone image analysis without langchain dependencies
- You need the model auto-fetch feature from models.dev

## Architecture

```
┌─────────────┐
│ Manual      │
│ Trigger     │
└──────┬──────┘
       │ main
       v
┌─────────────┐
│ Download    │
│ Image       │
│ (HTTP)      │
└──────┬──────┘
       │ main (with binary data)
       v
┌─────────────┐    ┌──────────────┐
│ Vision      │◄───┤ OpenRouter   │
│ Chain       │    │ Chat Model   │
└──────┬──────┘    └──────────────┘
       │              ai_languageModel
       v                connection
   [Result]
```

## How It Works

1. **Receive Input**: Vision Chain receives data from previous nodes (main input) and a connected chat model (ai_languageModel input)
2. **Process Images**: The node extracts and validates images from binary data, URLs, or base64 strings
3. **Format Messages**: Creates langchain-compatible `HumanMessage` with multimodal content (text + image)
4. **Invoke Model**: Calls the connected chat model with the formatted messages
5. **Return Results**: Outputs the model's response in the main flow

## Parameters

### Image Source
Choose where your image comes from:
- **Binary Data (Uploaded File)**: Use files from previous node outputs (e.g., HTTP Request, Read Binary File)
- **Public URL**: Provide a direct HTTP(S) URL to an image
- **Base64 String**: Provide base64-encoded image data

### Binary Data Options
- **Binary Property Name**: Name of the binary property containing the image (default: `data`)
- **Filename (Optional)**: Override filename for MIME type detection

### URL Options
- **Image URL**: HTTP(S) URL pointing to the image

### Base64 Options
- **Base64 Data**: Base64-encoded image data (without data URI prefix)
- **MIME Type**: MIME type of the image (e.g., `image/jpeg`, `image/png`)

### Prompt
The text prompt or question to send to the model along with the image.

### Options (Collection)
- **Image Detail**: Control analysis detail level (`auto`, `low`, `high`) - if supported by the model
- **System Message**: Optional system message to set context for the model

## Example Workflows

### 1. Basic Image Analysis

```json
Manual Trigger → HTTP Request (download image) → Vision Chain (+ Chat Model) → Output
```

Connect any chat model (OpenAI, Anthropic, OpenRouter, etc.) to the Vision Chain node.

### 2. Batch Image Processing

```json
Spreadsheet → Split In Batches → Vision Chain (+ Chat Model) → Aggregate → Save
```

Process multiple images from a spreadsheet with URLs or binary data.

### 3. AI Agent with Vision

```json
Chat Trigger → AI Agent (+ Chat Model + Vision Chain as tool) → Chat Output
```

Use Vision Chain as a tool in AI Agent workflows for multimodal conversations.

## Supported Image Formats

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- GIF (`.gif`)
- HEIC/HEIF (`.heic`, `.heif`)

Maximum image size: **20MB**

## Model Compatibility

The Vision Chain node works with any langchain-compatible chat model that supports vision/multimodal inputs. Tested with:

- ✅ OpenAI GPT-4 Vision, GPT-4 Turbo
- ✅ Anthropic Claude 3 (Opus, Sonnet, Haiku)
- ✅ OpenRouter (various vision-capable models)
- ✅ Google Gemini (via langchain)

**Note**: Not all chat models support vision. If you connect a text-only model, it will fail gracefully with an error message.

## Error Handling

The Vision Chain node includes comprehensive error handling:

- **No Chat Model Connected**: Clear error if you forget to connect a chat model
- **Invalid Image Data**: Validation of image format, size, and MIME type
- **Model Errors**: Graceful handling of API errors from the connected model
- **Continue on Fail**: Option to continue processing even if individual items fail

## Comparison with Universal LLM Vision

| Feature | Vision Chain | Universal LLM Vision |
|---------|--------------|---------------------|
| Chat Model | Connected (any langchain model) | Built-in (provider-specific) |
| Credentials | From chat model | Own credentials |
| Model Selection | At chat model node | Built-in dropdown with auto-fetch |
| Temperature/Max Tokens | At chat model node | Built-in parameters |
| Image Sources | Binary/URL/Base64 | Binary/URL/Base64 |
| System Prompt | ✅ Yes (with default) | ✅ Yes (with default) |
| Output Property Name | ✅ Yes (configurable) | ✅ Yes (configurable) |
| Data Pass-through | ✅ Yes (preserves original data) | ✅ Yes (preserves original data) |
| AI Agent Compatible | ✅ Yes | ✅ Yes (via `usableAsTool`) |
| Langchain Native | ✅ Yes (chain node) | ❌ No (programmatic node) |
| Custom Headers | ❌ No (handled by chat model) | ✅ Yes |
| Additional Parameters | ❌ No (handled by chat model) | ✅ Yes |
| Model Auto-fetch | ❌ No | ✅ Yes (from models.dev) |
| Response Format (JSON) | ❌ No (handled by chat model) | ✅ Yes |
| Metadata Output | ❌ No | ✅ Yes (usage, tokens, model info) |

## Tips & Best Practices

1. **Model Selection**: Connect vision-capable chat models only. Text-only models will fail.
2. **Image Size**: Optimize images before processing to reduce costs and improve speed.
3. **Detail Level**: Use `high` for detailed analysis, `low` for faster/cheaper processing.
4. **Binary vs URL**: URLs are more efficient (no upload), but binary data works with local/private images.
5. **System Prompts**: The node includes a comprehensive default system prompt for image analysis. Customize it to guide the model's analysis style (e.g., "You are a medical image analyst specializing in X-rays").
6. **Output Property**: Configure where the analysis result is stored using the `outputPropertyName` parameter (default: `analysis`). All original input data is preserved.
7. **Error Handling**: Enable "Continue on Fail" when processing batches to avoid stopping on individual failures.

## Development

### Adding Support for New Models

Since Vision Chain uses connected chat models, adding support for new models means:
1. Connect any n8n langchain-compatible chat model node
2. Ensure the model supports vision/multimodal inputs
3. No code changes needed in Vision Chain!

### Testing

Run the test suite:
```bash
npm test -- VisionChain
```

All tests should pass, covering:
- Node definition and configuration
- URL-based image processing
- Binary data handling
- Error scenarios
- Multiple items processing
- Options (imageDetail, systemMessage)

## Troubleshooting

### "No chat model connected" error
**Solution**: Connect a chat model node to the Vision Chain's `Chat Model` input.

### "Model does not support vision" error  
**Solution**: Ensure you're using a vision-capable model (GPT-4 Vision, Claude 3, etc.).

### "Image size exceeds maximum" error
**Solution**: Compress the image or reduce its resolution below 20MB.

### "Invalid base64 format" error
**Solution**: Ensure base64 data doesn't include data URI prefix (`data:image/jpeg;base64,`).

## License

MIT - Same as the Universal LLM Vision package.

## Links

- [GitHub Repository](https://github.com/alejandrosnz/n8n-nodes-universal-llm-vision)
- [n8n Community](https://community.n8n.io/)
- [Universal LLM Vision Documentation](../README.md)
