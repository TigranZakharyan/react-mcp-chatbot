---
title: Migrating from 0.0.x
section: Help
order: 3
description: What changed between 0.0.x and 1.0, and how to update your code.
---

# Migrating from 0.0.x

Version 1.0 replaces the original prompt-based implementation with a real tool-calling engine. **Most 0.0.x code keeps working unchanged**: the props you used are still accepted. This page lists what is different.

## What still works

```tsx
<MCPAgent
  provider="ollama"          // ollama | groq | openai | gemini | deepseek (+ more now)
  providerURL="http://localhost:11434"
  model="llama3"
  apiKey="…"
  tools={tools}              // same { name, description, parameters, call } shape
  title="Support"
  theme="dark"
  primaryColor="#6366f1"
/>
```

Your `tools` array and all UI props (`title`, `align`, `theme`, `width`, `height`, `primaryColor`, `borderRadius`, `placeholder`, `buttonLabel`) work as before.

## Behaviour changes

| Before (0.0.x) | Now (1.0) |
| --- | --- |
| Two model calls per message: pick a tool via a JSON prompt, then answer | Native function calling in a loop; the model can chain several calls |
| No conversation memory | Client-side [history](/docs/guides/system-prompt-and-history) sent with each request |
| Fixed internal prompt: *“Respond ONLY using the information in the context”* | A sensible [default prompt](/docs/reference/chat-config#the-default-system-prompt), replaceable via `systemPrompt` |
| Tool errors broke the reply | Errors are returned to the model so it can recover |
| Tool results cut to 4000 characters | `maxToolResultChars` (default 8000), configurable |
| Gemini key in the URL | Sent in the `x-goog-api-key` header |
| Options for 5 providers | 10 providers plus `openai-compatible` |

## Breaking changes

- **The `Agent` class and `MARKDOWN_SYSTEM_PROMPT` export were removed.** They were internal in practice. If you imported them, use `ChatEngine`/`createProvider` and the `systemPrompt` prop instead.
- **The default system prompt is different.** If your bot relied on the old “answer only from the tool output” rule, add it back explicitly:

  ```tsx
  systemPrompt="Answer ONLY from the API results. If the answer is not there, say you could not find it."
  ```

- **The model must support tool calling.** The old approach worked with any text model, because it asked for JSON. The new one uses each provider&rsquo;s native function calling, which is far more reliable but requires a tool-capable model.
- **`require()` now works.** The `exports` map previously pointed `require` at an ES module. This is fixed.

## New things to adopt

- Describe endpoints declaratively with [`api`](/docs/guides/describing-your-api) instead of writing `call` functions that wrap `fetch`.
- Import an [OpenAPI spec](/docs/guides/openapi-import).
- Add [guardrails](/docs/guides/guardrails): confirm writes with `beforeToolCall`.
- Persist history with `persist`; clear it via the built-in button or the ref.
- Customise freely: [theme, colours, fonts, icons](/docs/guides/customization).

## Converting a hand-written tool

Before:

```tsx
{
  name: "get_order",
  description: "Get an order",
  parameters: { id: { type: "string" } },
  call: async ({ id }) => (await fetch(`/api/orders/${id}`)).json(),
}
```

After (no code needed):

```tsx
api={{
  baseURL: "/api",
  endpoints: [
    { name: "get_order", description: "Get an order", path: "/orders/{id}", parameters: { id: { type: "string" } } },
  ],
}}
```

The old form still works. Keep it for logic that is not a plain REST call.
