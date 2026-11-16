<p align="center">
  <a href="https://www.npmjs.com/package/react-mcp-chatbot">
    <img src="https://img.shields.io/npm/v/react-mcp-chatbot" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/react-mcp-chatbot">
    <img src="https://img.shields.io/npm/dm/react-mcp-chatbot" alt="npm downloads" />
  </a>
  <a href="https://github.com/TigranZakharyan/react-mcp-chatbot/actions/workflows/ci.yml">
    <img src="https://github.com/TigranZakharyan/react-mcp-chatbot/actions/workflows/ci.yml/badge.svg" alt="CI status" />
  </a>
  <a href="https://bundlephobia.com/package/react-mcp-chatbot">
    <img src="https://img.shields.io/bundlephobia/minzip/react-mcp-chatbot" alt="minzipped size" />
  </a>
  <img src="https://img.shields.io/npm/types/react-mcp-chatbot" alt="TypeScript types included" />
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

<p align="center">
  <a href="https://tigranzakharyan.github.io/react-mcp-chatbot/"><b>▶ Live demo</b></a> ·
  <a href="#documentation">Documentation</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#faq">FAQ</a> ·
  <a href="./CHANGELOG.md">Changelog</a>
</p>

<hr />

## Demo

<p align="center">
  <img src="./assets/demo.gif" alt="Chatbot listing and cancelling orders through a described REST API" width="800" />
</p>

Recorded with a local `llama3.1` via Ollama (no API key, no scripted replies). The assistant lists the processing orders, asks permission before the `POST`, cancels order 1002, and the table on the page updates. Its only knowledge of the backend is the three endpoint descriptions in [`demo/src/main.tsx`](./demo/src/main.tsx).

**[Try it live](https://tigranzakharyan.github.io/react-mcp-chatbot/)** – it opens in **Demo mode**: a simulated, rule-based model with no key, no cost and no AI, so you can see the UI and the tool loop work immediately. Switch to a real provider by pasting your own API key (it stays in your browser tab); Ollama and the free tiers of providers like Groq and Gemini work too. The demo ships an in-browser fake orders API, so no backend is needed. To run it yourself:

```bash
git clone https://github.com/TigranZakharyan/react-mcp-chatbot
cd react-mcp-chatbot/demo
npm install
npm run dev
```

Try *"Which orders are still processing?"* or *"Cancel order 1002"*.

## Features

- **No chat backend** – the tool-calling loop, history and system prompt run in the browser.
- **Describe or import your API** – list endpoints by hand, or point at an OpenAPI / Swagger spec and every operation becomes a tool.
- **Native tool calling** – uses each provider's real function calling; the model can chain calls, and API errors go back to it so it can recover.
- **10+ providers** – OpenAI, Anthropic, Gemini, DeepSeek, Groq, Ollama, OpenRouter, Mistral, xAI, Together, or any OpenAI-compatible URL.
- **Client-side history** – windowing, optional `localStorage` persistence, one-click Clear.
- **Guardrails** – confirm or block calls with `beforeToolCall`, allow-list OpenAPI operations, cap tool rounds, truncate large responses.
- **Fully themeable** – light / dark / auto, every colour token, fonts, avatar, icons, size, position, Markdown rendering.
- **Headless option** – `useChat` hook and a framework-agnostic `ChatEngine`.
- **Typed and small** – TypeScript types, ESM + CommonJS, two runtime dependencies (`react-markdown`, `remark-gfm`).

## Why this exists

Adding "chat with our app" to a product usually means building a chatbot backend: a proxy for the LLM, a tool-calling loop, session storage, and glue that re-implements the endpoints you already have. **react-mcp-chatbot removes that layer.**

| Without | With react-mcp-chatbot |
| --- | --- |
| A server that holds the conversation and runs the tool loop | The loop, history and system prompt run in the browser |
| Re-wrapping every REST endpoint as an LLM tool | Describe the endpoint once (or import your OpenAPI spec) |
| Provider-specific code for each LLM vendor | One config, native function calling for 10+ providers |
| Backend auth plumbing for the bot | Requests use the signed-in user's own credentials, so existing permissions apply |

**Good fit:** admin panels, internal tools, SaaS dashboards, prototypes, local-first apps. **Not a fit:** anything that needs the LLM key to stay secret without a proxy – see [client-side caveats](#things-to-know-about-running-fully-client-side).

## Install

```bash
npm install react-mcp-chatbot
```

Requires React 18 or newer. Types are included.

**Next.js (App Router):** render the component from a Client Component (a file starting with `"use client"`).

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
  // ask the user before anything that changes data
  beforeToolCall={({ method, name, args }) =>
    method === "GET" || window.confirm(`Allow: ${name}(${JSON.stringify(args)})?`)
  }
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
    include: ["listOrders", "getOrder"],           // allow-list… or exclude: [...]
  }}
/>
```

Every operation becomes a tool (`operationId` is the tool name, `summary`/`description` the description). Every tool costs tokens on every request, so expose only what the assistant needs.

### Custom JS tools

For anything that is not a REST call – app state, navigation, SDKs. Mixes freely with `api`:

```tsx
tools={[{
  name: "get_cart",
  description: "Current contents of the user's cart",
  parameters: {},
  call: async () => store.getState().cart,
}]}
```

## Providers

| `provider` | Default base URL | Notes |
| --- | --- | --- |
| `openai` | `https://api.openai.com/v1` | |
| `anthropic` | `https://api.anthropic.com` | Sends the browser-access header Anthropic requires |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta` | Key sent in the `x-goog-api-key` header |
| `deepseek` | `https://api.deepseek.com/v1` | |
| `groq` | `https://api.groq.com/openai/v1` | |
| `openrouter` | `https://openrouter.ai/api/v1` | |
| `mistral` | `https://api.mistral.ai/v1` | |
| `xai` | `https://api.x.ai/v1` | |
| `together` | `https://api.together.xyz/v1` | |
| `ollama` | `http://localhost:11434` | Local models, no key. `/v1` is added for you |
| `openai-compatible` | **set `providerURL`** | LM Studio, vLLM, LiteLLM, your own gateway… |

The model must support **tool calling**. Override any base URL with `providerURL` – for example to route through your own proxy.

**Don't want to pay?** Use **Ollama** (free, runs on your machine), the key-free Demo mode in the [live demo](https://tigranzakharyan.github.io/react-mcp-chatbot/), or a provider's free tier if it offers one (limits change – check theirs).

## History, system prompt, clearing

- **History** is kept in the browser and sent with every request (last `maxHistoryMessages`, default 40, cut at a turn boundary so tool exchanges are never split).
- **Persistence**: `persist` saves it to `localStorage` (`persist` or `persist="my-key"`). Off by default – saved history includes API results, so on shared computers it can expose data.
- **System prompt**: `systemPrompt="..."` replaces the default (exported as `DEFAULT_SYSTEM_PROMPT` if you want to extend it).
- **Clear**: built-in *Clear* button in the header (`showClearButton={false}` to hide), or via ref:

```tsx
const ref = useRef<MCPAgentHandle>(null);
<MCPAgent ref={ref} ... />
ref.current?.clear();   // also: open(), close(), toggle(), send(text), stop()
```

## Customization

Everything about the look is a prop – no CSS overrides needed.

```tsx
<MCPAgent
  theme="auto"                      // "dark" (default) | "light" | "auto" (follows the OS)
  primaryColor="#0ea5e9"
  colors={{ aiBubble: "#f1f5f9", bg: "#ffffff" }}   // override any individual colour
  title="Acme Support"
  subtitle="Typically replies in a minute"          // null hides it
  avatar="/logo.png"                // emoji, image URL or a React node
  launcherIcon={<MyIcon />}
  welcomeTitle="Need a hand?"
  welcomeMessage="Ask about your orders."
  suggestions={["Where is my order?", "Cancel order 1002"]}
  fontFamily="Inter, sans-serif"
  borderRadius={12}
  align="left" bottomOffset={16} sideOffset={16}
  markdownComponents={{ a: (p) => <a {...p} target="_blank" rel="noreferrer" /> }}
/>
```

**Use your own button** – hide the launcher and control the window:

```tsx
const ref = useRef<MCPAgentHandle>(null);

<button onClick={() => ref.current?.toggle()}>Ask AI</button>
<MCPAgent ref={ref} showLauncher={false} {...config} />

// or fully controlled
<MCPAgent open={open} onOpenChange={setOpen} />
```

| Group | Props |
| --- | --- |
| Text | `title`, `subtitle`, `placeholder`, `buttonLabel`, `welcomeTitle`, `welcomeMessage`, `suggestions` |
| Colours | `theme`, `primaryColor`, `colors` |
| Shape & type | `width`, `height`, `borderRadius`, `fontFamily`, `className`, `style` |
| Icons | `avatar`, `launcherIcon`, `welcomeIcon` |
| Position | `align`, `bottomOffset`, `sideOffset`, `zIndex` |
| Behaviour | `defaultOpen`, `open`, `onOpenChange`, `showLauncher`, `showClearButton` |
| Content | `markdownComponents` |

`colors` accepts: `bg`, `surface`, `surfaceHover`, `border`, `text`, `textMuted`, `accent`, `accentHover`, `userBubble`, `userBubbleText`, `aiBubble`, `aiBubbleText`, `inputBg`, `inputBorder`, `inputFocus`, `scrollbar`, `scrollbarThumb`, `shadow`, `headerGlow`, `codeBg`, `codeText`, `preBg`, `tableHeadBg` (type exported as `MCPThemeColors`). Try every option live in the [demo](https://tigranzakharyan.github.io/react-mcp-chatbot/).

## Headless usage

```tsx
import { useChat } from "react-mcp-chatbot";

const { messages, send, clear, stop, loading, status } = useChat({ provider, model, apiKey, api });
```

Build any UI on top. `ChatEngine` (the same core, no React code) is exported too, for Vue, Svelte or plain scripts.

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
| `temperature`, `headers` | Passed to the provider (default temperature `0.2`). |
| UI | See [Customization](#customization) |

## Things to know about running fully client-side

- **API keys are visible to your users.** For anything public, point `providerURL` at a thin proxy that adds the key (or use per-user keys / a local model such as Ollama). The proxy needs no chatbot logic – it just forwards.
- **The assistant acts with the user's own credentials.** Tool calls are plain `fetch` calls from the browser, so your backend's normal auth, CORS and permissions apply. Expose only the endpoints you want the model to reach, enforce authorization on the server, and use `beforeToolCall` to confirm mutating calls.
- **API responses go to the LLM provider** so it can answer. Don't expose endpoints whose data you may not share with that vendor.
- **CORS**: your backend must allow the page's origin; so must the LLM provider (OpenAI, Anthropic, Gemini, Groq work from browsers; for Ollama set `OLLAMA_ORIGINS`).
- **Prompt injection**: text returned by your API (reviews, tickets…) can try to instruct the model. Confirm write actions and never rely on the prompt as access control.
- Models must support tool calling (e.g. Ollama `llama3.1`+; not every local model does).

## Documentation

Guides, examples and the full API reference live in [`docs/`](./docs) – a React site (deploy instructions in [`docs/README.md`](./docs/README.md)) whose pages are plain Markdown you can read right here:

| | |
| --- | --- |
| **Getting started** | [Installation](./docs/src/content/getting-started/installation.md) · [Quick start](./docs/src/content/getting-started/quick-start.md) · [How it works](./docs/src/content/getting-started/how-it-works.md) |
| **Guides** | [Describing your API](./docs/src/content/guides/describing-your-api.md) · [OpenAPI import](./docs/src/content/guides/openapi-import.md) · [Custom tools](./docs/src/content/guides/custom-tools.md) · [Providers](./docs/src/content/guides/providers.md) · [System prompt & history](./docs/src/content/guides/system-prompt-and-history.md) · [Authentication](./docs/src/content/guides/authentication.md) · [Customization](./docs/src/content/guides/customization.md) · [Controlling the widget](./docs/src/content/guides/controlling-the-widget.md) · [Headless usage](./docs/src/content/guides/headless-usage.md) · [Guardrails](./docs/src/content/guides/guardrails.md) · [Security](./docs/src/content/guides/security.md) |
| **Examples** | [E-commerce orders](./docs/src/content/examples/ecommerce-orders.md) · [OpenAPI admin dashboard](./docs/src/content/examples/openapi-admin-dashboard.md) · [Next.js + key-safe proxy](./docs/src/content/examples/nextjs.md) · [Ollama (free, local)](./docs/src/content/examples/ollama-local.md) · [API-key proxy](./docs/src/content/examples/api-key-proxy.md) · [Custom launcher](./docs/src/content/examples/custom-launcher.md) · [Theming recipes](./docs/src/content/examples/theming-recipes.md) |
| **Reference** | [`<MCPAgent />` props](./docs/src/content/reference/mcpagent-props.md) · [Engine options](./docs/src/content/reference/chat-config.md) · [API & tool config](./docs/src/content/reference/api-config.md) · [Hooks & engine](./docs/src/content/reference/hooks-and-engine.md) · [Exports & TypeScript](./docs/src/content/reference/exports.md) |
| **Help** | [FAQ](./docs/src/content/help/faq.md) · [Troubleshooting](./docs/src/content/help/troubleshooting.md) · [Migrating from 0.0.x](./docs/src/content/help/migrating.md) |

To read it as a website with search and a live playground: `cd docs && npm install && npm run dev`.

## How it compares

Most chat toolkits assume a server route that runs the model and tools. This one is deliberately the opposite. A rough guide (check each project's docs – they evolve):

| | react-mcp-chatbot | Server-centric chat SDKs (e.g. Vercel AI SDK `useChat`, CopilotKit runtime) |
| --- | --- | --- |
| Where the tool-calling loop runs | Browser | Typically your server |
| Needs a chat backend / API route | No | Usually yes |
| Tools defined from | REST endpoint descriptions or an OpenAPI spec, called with the user's own session | Server-side functions you write |
| LLM key exposure | Visible to the client unless you add a proxy | Kept on the server |
| Best for | Dashboards, internal tools, prototypes, local-first apps | Public products where the key and tools must stay private |

Pick the server-centric route when secrets or business logic must not reach the browser; pick this when your existing API already enforces permissions and you just want a chat front-end for it.

## FAQ

**How do I add an AI chatbot to my React app without writing a backend?**
Install the package, render `<MCPAgent />` with a provider, a model and your endpoint list. See [Quick start](#quick-start).

**How can an LLM call my existing REST API from the browser?**
Each endpoint you describe (or each OpenAPI operation) is sent to the model as a function-calling tool. The model returns which one to call; the package performs the `fetch` and feeds the result back.

**Does it work with a local model?**
Yes – use `provider="ollama"` with a tool-capable model such as `llama3.1`. No API key needed.

**How do I stop the bot from making destructive calls?**
Use `beforeToolCall` to confirm or block, `include`/`exclude` to limit which OpenAPI operations are exposed, and only describe endpoints you are happy for the user to trigger. Always enforce permissions on your server too.

**Does it support CommonJS and ESM, with TypeScript types?**
Both, and types are bundled.

**Can I build my own UI?**
Yes – use the `useChat` hook, or `ChatEngine` without React.

## Limitations

- **No streaming yet** – replies appear when complete (a status line shows progress).
- **Client-side by design** – see [the caveats above](#things-to-know-about-running-fully-client-side) for keys, CORS and data.
- **Tool-capable models only.**

## Contributing

Issues and PRs are welcome – see [CONTRIBUTING.md](./CONTRIBUTING.md). To work on the package:

```bash
git clone https://github.com/TigranZakharyan/react-mcp-chatbot
cd react-mcp-chatbot && npm install
npm run typecheck && npm test   # unit tests use mocked providers, no keys needed
cd demo && npm install && npm run dev       # the demo site
cd ../docs && npm install && npm run dev    # the documentation site
```

Ideas that would make good first contributions: response streaming, a Vue / vanilla-JS wrapper around `ChatEngine`, a per-endpoint `confirm` flag, component-level UI tests, and more provider tests. See the [CHANGELOG](./CHANGELOG.md) for what changed between versions.

## License

MIT © [Tigran Zakharyan](https://github.com/TigranZakharyan)
