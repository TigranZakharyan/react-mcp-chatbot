---
title: Quick start
section: Getting started
order: 2
description: Build a chatbot that calls your API in about five minutes.
---

# Quick start

In this guide you will add a chatbot that can look up and cancel orders through a REST API. It takes about five minutes.

## 1. Install

```bash
npm install react-mcp-chatbot
```

## 2. Render the component

```tsx
import { MCPAgent } from "react-mcp-chatbot";

export default function App() {
  return (
    <MCPAgent
      // which model to talk to
      provider="openai"
      model="gpt-4o-mini"
      apiKey={import.meta.env.VITE_OPENAI_KEY}

      // how the assistant should behave
      systemPrompt="You are the support assistant for Acme. Be brief and friendly."

      // what it can do: your existing endpoints
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
            description: "Cancel an order that has not shipped",
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
  );
}
```

A floating chat button appears in the corner of the page. That is the whole integration.

## 3. Try it

Open the chat and ask:

- *“Where is order 1002?”*: the model calls `get_order`.
- *“Cancel it, the customer changed their mind.”*: it calls `cancel_order` with a reason.

Behind the scenes the package sent your endpoint descriptions to the model as function-calling tools, ran the `fetch` calls in the browser with your auth header, and fed the responses back so the model could write its answer.

## Don&rsquo;t have a backend or an API key yet?

Use a **free** setup to experiment:

- **Ollama** runs models on your own machine with no key. See the [Ollama example](/docs/examples/ollama-local).
- The [live playground](/playground) has a **Demo mode** that needs nothing at all.

## What each part does

| Part | Purpose |
| --- | --- |
| `provider`, `model`, `apiKey` | Which LLM to use. See [Providers](/docs/guides/providers). |
| `systemPrompt` | Instructions for the assistant. See [System prompt & history](/docs/guides/system-prompt-and-history). |
| `api` | Your backend, described once. See [Describing your API](/docs/guides/describing-your-api). |
| `headers` | Auth for your API. A function, so tokens stay fresh. See [Authentication](/docs/guides/authentication). |

## Make write calls safer

The assistant can call `POST`, `PUT` and `DELETE` endpoints with the user&rsquo;s credentials. Ask the user before it does:

```tsx
<MCPAgent
  /* … */
  beforeToolCall={({ method, name, args }) =>
    method === "GET" || window.confirm(`Allow: ${name}(${JSON.stringify(args)})?`)
  }
/>
```

More in [Guardrails](/docs/guides/guardrails).

## Next steps

- Already have an OpenAPI spec? [Import it](/docs/guides/openapi-import) instead of writing endpoints by hand.
- Make it match your brand: [Customization](/docs/guides/customization).
- Understand what happens on every message: [How it works](/docs/getting-started/how-it-works).
