---
title: Providers
section: Guides
order: 4
description: Every supported LLM provider, default endpoints, browser/CORS notes, and free or local options.
---

# Providers

Choose the model with two props, `provider` and `model`. Switching vendors never changes the rest of your code.

```tsx
<MCPAgent provider="anthropic" model="claude-haiku-4-5" apiKey={key} api={api} />
```

## Supported providers

| `provider` | Default base URL | Notes |
| --- | --- | --- |
| `openai` | `https://api.openai.com/v1` | |
| `anthropic` | `https://api.anthropic.com` | Sends the `anthropic-dangerous-direct-browser-access` header Anthropic requires for browser calls |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta` | Key sent in the `x-goog-api-key` header (not the URL) |
| `deepseek` | `https://api.deepseek.com/v1` | |
| `groq` | `https://api.groq.com/openai/v1` | |
| `openrouter` | `https://openrouter.ai/api/v1` | One key, many models |
| `mistral` | `https://api.mistral.ai/v1` | |
| `xai` | `https://api.x.ai/v1` | |
| `together` | `https://api.together.xyz/v1` | |
| `ollama` | `http://localhost:11434` | Local models; no key. The package appends `/v1` for you |
| `openai-compatible` | **you must set `providerURL`** | LM Studio, vLLM, LiteLLM, your own gateway, or any OpenAI-style API |

Model names are whatever the provider calls them. Check the provider&rsquo;s docs for current names, since they change often. **The model must support tool (function) calling.**

## Common options

```tsx
<MCPAgent
  provider="openai"
  model="gpt-4o-mini"
  apiKey={key}
  providerURL="https://my-proxy.example.com/v1"   // override the base URL
  temperature={0.2}                               // default 0.2
  headers={{ "X-Team": "support" }}               // extra provider headers
/>
```

| Prop | Description |
| --- | --- |
| `apiKey` | Required for hosted providers. **It is visible to your users**: see [Security](/docs/guides/security). |
| `providerURL` | Replace the base URL. Use it for proxies, Azure-style gateways and self-hosted servers. |
| `temperature` | Sampling temperature. Lower is more predictable. Default `0.2`. |
| `headers` | Extra headers sent to the provider. |

## Browser access and CORS

Calls go **straight from the browser** to the provider, so the provider must allow cross-origin requests. OpenAI, Anthropic (with the opt-in header the package sends), Gemini and Groq support direct browser calls. If a provider blocks CORS, or you do not want the key in the browser at all, route through a [proxy](/docs/examples/api-key-proxy) with `providerURL`.

## Free and local options

You do not need a paid account to try the package.

- **Demo mode.** The [playground](/playground) includes a simulated, rule-based model that needs nothing. It is not an AI, only useful to see the UI and tool loop work.
- **Ollama (free, runs on your machine).** Install [Ollama](https://ollama.com), pull a tool-capable model, and use `provider="ollama"`. See the [Ollama example](/docs/examples/ollama-local).
- **Free tiers.** Some hosted providers, such as Groq and Gemini, offer free tiers. Limits and terms change, so check the provider&rsquo;s current pricing page.
- **OpenRouter** lists some free models too; availability varies.

## Choosing a model

| You want | Look for |
| --- | --- |
| Reliable tool calling | A current, mid-size or larger hosted model. Very small local models may call the wrong tool or invent facts |
| Low latency and cost | The provider&rsquo;s small / “mini” / “flash” tier |
| Privacy | A local model through Ollama, or a provider with the data terms you need |

> **Tip** If the assistant ignores a tool or fills arguments wrongly, first improve the tool *descriptions* and add `enum`s. Then try a stronger model.

## Custom or unsupported providers

Anything that speaks the OpenAI chat-completions format works with `provider="openai-compatible"`:

```tsx
<MCPAgent
  provider="openai-compatible"
  providerURL="http://localhost:1234/v1"   // LM Studio
  model="qwen2.5-7b-instruct"
  api={api}
/>
```

For a provider with a different wire format, you can build on the exported [`createProvider`](/docs/reference/hooks-and-engine) and `Provider` interface.
