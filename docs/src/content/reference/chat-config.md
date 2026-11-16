---
title: Engine options
section: Reference
order: 2
description: The configuration shared by MCPAgent, useChat and ChatEngine (ChatConfig and ProviderConfig).
---

# Engine options (`ChatConfig`)

These options are accepted by `<MCPAgent />`, `useChat(config)` and `new ChatEngine(config)`. They are split in two types: `ProviderConfig` (which model) and `ChatConfig` (everything else).

```ts
import type { ChatConfig, ProviderConfig, ProviderName } from "react-mcp-chatbot";
```

## `ProviderConfig`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `provider` | `ProviderName` | required | `openai` · `anthropic` · `gemini` · `deepseek` · `groq` · `ollama` · `openrouter` · `mistral` · `xai` · `together` · `openai-compatible` |
| `model` | `string` | required | Model name |
| `apiKey` | `string` | | Provider key. **Visible to your users.** See [Security](/docs/guides/security) |
| `providerURL` | `string` | provider default | Base URL override. Required for `openai-compatible`. Default `http://localhost:11434` for `ollama` |
| `temperature` | `number` | `0.2` | Sampling temperature |
| `headers` | `Record<string, string>` | | Extra headers sent to the provider |

Default base URLs are listed in [Providers](/docs/guides/providers) and exported as `PROVIDER_URLS`.

## `ChatConfig` (extends `ProviderConfig`)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `systemPrompt` | `string` | `DEFAULT_SYSTEM_PROMPT` | Instructions for the assistant. Replaces the default |
| `tools` | `MCPTool[]` | | Custom JavaScript tools. See [Custom tools](/docs/guides/custom-tools) |
| `api` | `ApiConfig` | | Describe your backend. See [API config](/docs/reference/api-config) |
| `persist` | `boolean \| string` | `false` | Save history to `localStorage`. `true` uses the key `react-mcp-chatbot:history`; a string sets your own key |
| `maxHistoryMessages` | `number` | `40` | Messages sent per request. Older ones remain visible but are not sent |
| `maxToolRounds` | `number` | `8` | Max tool round trips for one user message. After that, tools are withheld and the model must answer |
| `maxToolResultChars` | `number` | `8000` | Max characters of one tool result sent to the model |
| `beforeToolCall` | see below | | Approve or block each tool call |
| `onToolCall` | see below | | Called after each tool call |
| `onError` | `(error: Error) => void` | | Called for provider-level failures |

### `beforeToolCall`

```ts
beforeToolCall?: (call: {
  name: string;
  args: Record<string, any>;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";  // undefined for custom tools
}) => boolean | Promise<boolean>;
```

Return `false` to block. The model is told the user declined, and no request is made.

### `onToolCall`

```ts
onToolCall?: (call: {
  name: string;
  args: Record<string, any>;
  result: unknown;     // what the tool returned (undefined on error)
  error?: string;      // set when the call failed or was blocked
}) => void;
```

### `onError`

Fires when a request to the **provider** fails (invalid key, rate limit, network). The conversation also shows an error bubble. API/tool failures do not trigger it; those are returned to the model instead.

## Defaults at a glance

```ts
{
  temperature: 0.2,
  maxHistoryMessages: 40,
  maxToolRounds: 8,
  maxToolResultChars: 8000,
  persist: false,
  // api.maxResponseChars: 8000
}
```

## The default system prompt

```ts
import { DEFAULT_SYSTEM_PROMPT } from "react-mcp-chatbot";
```

It instructs the model to use tools for real data, retry or explain failures, ask when a required value is missing, and answer in clean Markdown without mentioning tool names. Replace it with `systemPrompt`.
