<p align="center">
  <a href="https://www.npmjs.com/package/react-mcp-chatbot">
    <img src="https://img.shields.io/npm/v/react-mcp-chatbot" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/react-mcp-chatbot">
    <img src="https://img.shields.io/npm/dm/react-mcp-chatbot" alt="npm downloads" />
  </a>
  <a href="https://github.com/TigranZakharyan/react-mcp-chatbot/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/react-mcp-chatbot" alt="license" />
  </a>
  <a href="https://github.com/TigranZakharyan/react-mcp-chatbot/stargazers">
    <img
      src="https://img.shields.io/github/stars/TigranZakharyan/react-mcp-chatbot?style=flat"
      alt="GitHub stars"
    />
  </a>
</p>

<h1 align="center">🤖 React MCP Chatbot</h1>

<p align="center">
  <strong>An AI chatbot that talks to your backend APIs – with no backend of its own</strong>
</p>

<p align="center">
  Describe your existing REST endpoints. The model decides when to call them, the browser executes the calls, and the answer comes back as Markdown. History, system prompt and tool calling all live client-side.
</p>

<hr />

## Install

```bash
npm install react-mcp-chatbot
```

## Quick start

```tsx
import { MCPAgent } from "react-mcp-chatbot";

<MCPAgent
  provider="openai"            // openai | anthropic | gemini | deepseek | groq | ollama | openrouter | mistral | xai | together | openai-compatible
  model="gpt-4o-mini"
  apiKey={...}
  systemPrompt="You are the support assistant for Acme. Be concise."
  api={{
    baseURL: "https://api.acme.com",
    headers: () => ({ Authorization: `Bearer ${getToken()}` }),
    endpoints: [
      {
        name: "get_order",
        description: "Look up an order by id",
        path: "/orders/{id}",
        parameters: { id: { type: "string", description: "Order id" } },
      },
      {
        name: "cancel_order",
        description: "Cancel an order",
        method: "POST",
        path: "/orders/{id}/cancel",
        parameters: {
          id: { type: "string" },
          reason: { type: "string", optional: true },
        },
      },
    ],
  }}
/>
```

That is the whole integration. The model gets native function-calling schemas generated from your descriptions, picks endpoints, fills arguments, chains several calls if needed, reads the responses and answers. Tool errors (HTTP 4xx/5xx, missing arguments) are returned to the model so it can retry or explain.

Parameters go to `path` if `{name}` is in the path, otherwise `query` (GET/DELETE) or JSON `body` (POST/PUT/PATCH). Override per parameter with `in: "path" | "query" | "body" | "header"`.

### Already have an OpenAPI / Swagger spec?

```tsx
<MCPAgent
  provider="gemini" model="gemini-2.5-flash" apiKey={...}
  api={{
    baseURL: "https://api.acme.com",
    openapi: "https://api.acme.com/openapi.json", // URL or object
    exclude: ["deleteUser"],                       // or include: [...]
  }}
/>
```

Every operation becomes a tool (`operationId` is the tool name, `summary`/`description` the description).

### Custom JS tools

Still supported, and can be mixed with `api`:

```tsx
tools={[{
  name: "get_cart",
  description: "Current contents of the user's cart",
  parameters: {},
  call: async () => store.getState().cart,
}]}
```

## History, system prompt, clearing

- **History** is kept in the browser and sent with every request (last `maxHistoryMessages`, default 40, cut at a turn boundary so tool exchanges are never split).
- **Persistence**: `persist` saves it to `localStorage` (`persist` or `persist="my-key"`). Off by default – on shared computers a saved chat can expose data returned by your API.
- **System prompt**: `systemPrompt="..."` replaces the default.
- **Clear**: built-in *Clear* button in the header (`showClearButton={false}` to hide), or via ref:

```tsx
const ref = useRef<MCPAgentHandle>(null);
<MCPAgent ref={ref} ... />
ref.current?.clear();
```

## Headless usage

```tsx
import { useChat } from "react-mcp-chatbot";

const { messages, send, clear, stop, loading, status } = useChat({ provider, model, apiKey, api });
```

`ChatEngine` (the same core, no React) is exported too.

## Options

| Prop | Description |
| --- | --- |
| `provider`, `model` | Required. |
| `apiKey` | Required for hosted providers. |
| `providerURL` | Override base URL (your proxy, Azure, vLLM, LM Studio…). Required for `openai-compatible`; default `http://localhost:11434` for `ollama`. |
| `systemPrompt` | Instructions for the assistant. |
| `api` | `{ baseURL, headers?, credentials?, endpoints?, openapi?, include?, exclude?, maxResponseChars? }` |
| `tools` | Custom tools. |
| `persist` | `boolean \| string` – save history to localStorage. |
| `maxHistoryMessages` | Default 40. |
| `maxToolRounds` | Max tool round-trips per message. Default 8. |
| `maxToolResultChars` | Default 8000. Long API responses are truncated before going to the model. |
| `beforeToolCall` | `({name, args, method}) => boolean \| Promise<boolean>` – return `false` to block. Use it to confirm writes. |
| `onToolCall`, `onError` | Observability hooks. |
| `temperature`, `headers` | Passed to the provider. |
| UI | `title`, `align`, `theme`, `primaryColor`, `width`, `height`, `borderRadius`, `placeholder`, `buttonLabel`, `showClearButton` |

## Things to know about running fully client-side

- **API keys are visible to your users.** For anything public, point `providerURL` at a thin proxy that adds the key (or use per-user keys / a local model such as Ollama). The proxy needs no chatbot logic – it just forwards.
- **The assistant acts with the user's own credentials.** Tool calls are plain `fetch` calls from the browser, so your backend's normal auth, CORS and permissions apply. Expose only the endpoints you want the model to reach, and use `beforeToolCall` to confirm mutating calls.
- **CORS**: your backend must allow the page's origin; so must the LLM provider (OpenAI, Anthropic, Gemini, Groq work from browsers; for Ollama set `OLLAMA_ORIGINS`).
- Models must support tool calling (e.g. Ollama `llama3.1`+, not every local model does).

## License

MIT © [Tigran Zakharyan](https://github.com/TigranZakharyan)
