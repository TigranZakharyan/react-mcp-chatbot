---
title: Troubleshooting
section: Help
order: 2
description: Fix common errors: 401, CORS, "Failed to fetch", tools not called, wrong arguments, Ollama and more.
---

# Troubleshooting

Find your symptom below. Error messages from the provider are shown in the chat as a red bubble and passed to `onError`.

## Errors in the chat

### `401` or “You didn&rsquo;t provide an API key”

The provider rejected the key.

- Check `apiKey` is set and not `undefined` (an unset env var is the usual cause). With Vite use `import.meta.env.VITE_…`; with Next.js client code use `NEXT_PUBLIC_…`. Restart the dev server after changing `.env`.
- Make sure the key matches the provider you selected.
- If you use a proxy, the client sends **no** key, and the proxy must add it.

### `429` rate limit or quota

You exceeded the provider&rsquo;s limits, or the account has no credit. Wait, upgrade the plan, or try a different model/provider. Free tiers have tight limits.

### `404` model not found

The `model` name does not exist for that provider or account. Check the provider&rsquo;s current model list.

### `Failed to fetch` / `TypeError: NetworkError`

The browser could not complete the request. Open the dev tools **Network** and **Console** tabs:

- A red **CORS** error: the target does not allow requests from your origin. For the LLM provider, use a [proxy](/docs/examples/api-key-proxy). For your own API, add CORS headers. For Ollama, set `OLLAMA_ORIGINS`.
- Connection refused: the server is not running or the URL is wrong (`providerURL`, `api.baseURL`).
- Mixed content: an `https://` page cannot call `http://` URLs (except often `localhost`).

### `400` with a message about tools, schema or function names

- Tool names may contain only letters, digits, `_` and `-` (max 64). Rename any that do not.
- A parameter definition is invalid, for example an `array` without sensible `items`, or an `enum` with duplicates.
- The model does not support tool calling. Choose one that does.

### “Unknown tool …” in a tool result

The model tried to call a name that does not exist. Rename tools to be clearer and more distinct, and keep the tool list small.

## The assistant does not use my API

| Check | Fix |
| --- | --- |
| Is the model tool-capable? | Switch to a model that supports function calling. Very small local models often do not |
| Is the description clear? | Say what the endpoint does and when to use it. Add examples in parameter descriptions |
| Too many tools? | Fewer, sharper tools are chosen more reliably. Use `include` with OpenAPI |
| Prompt forbids it? | Review your `systemPrompt` for conflicting rules |
| Did `onToolCall` fire? | Log it. If it never fires, the model chose not to call anything |

## The assistant calls the wrong endpoint or invents values

- Add `enum`s for any parameter with a fixed set of values.
- Put formats and examples in `description` (“Order id, e.g. 1001”).
- Add a rule to the system prompt: *“State only facts that appear in the API results.”*
- Try a stronger model. Small models guess more.

## My API call fails

The tool result shown to the model includes the HTTP status and the start of the body. Surface it yourself while debugging:

```tsx
<MCPAgent
  /* … */
  onToolCall={({ name, args, result, error }) => console.log(name, args, error ?? result)}
/>
```

Common causes:

- **`HTTP 401/403`**: the auth header is missing. Check `api.headers` (is it a function returning the *current* token?), or add `credentials: "include"` for cookies.
- **`HTTP 404`**: wrong `baseURL` or `path`. Remember the base and path are joined: `https://x.com/api` + `/orders`.
- **`HTTP 400/422`**: the arguments do not match your API. Check parameter locations (`in`) and types.
- **CORS error**: your API must allow your app&rsquo;s origin. With cookies also send `Access-Control-Allow-Credentials: true` and a specific origin.

## Responses are cut off or the answer misses data

Large API results are truncated before reaching the model (`maxToolResultChars`, default 8000, and `api.maxResponseChars`). Prefer endpoints that return focused results (filters, pagination, summaries), or raise the limits if your model has a large context window.

## It keeps calling tools in a loop

After `maxToolRounds` (default 8) tools are withheld and the model must answer. If it happens often, your tool descriptions are probably ambiguous, or results do not contain what the model needs. Improve descriptions or lower `maxToolRounds`.

## History problems

- **Chat resets on reload**: that is the default. Enable `persist`.
- **Old messages seem forgotten**: only the last `maxHistoryMessages` (default 40) are sent to the model.
- **Another user sees an old chat on a shared computer**: do not use `persist`, or key it per user and call `clear()` on logout.

## Ollama

| Symptom | Fix |
| --- | --- |
| `Failed to fetch` | Start Ollama, or set `OLLAMA_ORIGINS` to include your origin, then restart it |
| Never calls tools | Use a tool-capable model such as `llama3.1`, and check descriptions |
| Slow first reply | The model is loading into memory. Later replies are faster |

## UI

| Symptom | Fix |
| --- | --- |
| Nothing renders (Next.js) | Render `<MCPAgent />` from a file with `"use client"` |
| Window covered by something | Raise `zIndex` |
| Overlaps another floating widget | Change `bottomOffset` / `sideOffset` or `align` |
| Chat window is hidden | Set `defaultOpen`, or provide your own button with `showLauncher={false}` |
| Styles look different from the docs | The widget injects its own styles and uses inline styles for layout. Aggressive global CSS (resets on `button` or `input`) can still affect it, so test with your global styles |

## Still stuck?

[Open an issue](https://github.com/TigranZakharyan/react-mcp-chatbot/issues/new/choose) with your configuration (**without API keys**), the provider and model, and the exact error text.
