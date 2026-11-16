---
title: Keep the API key off the client
section: Examples
order: 5
description: A 20-line proxy (Node/Express or Cloudflare Worker) that adds your LLM key server-side.
---

# Keep the API key off the client

Any key in `apiKey` is visible to users. For public apps, put a **thin proxy** between the browser and the LLM provider. It contains no chatbot logic: it adds your secret key and forwards the request. The chatbot, history and tool loop still run in the browser.

```
Browser (react-mcp-chatbot)  ──►  your proxy (adds the key)  ──►  LLM provider
```

On the client, set `providerURL` to the proxy and omit `apiKey`:

```tsx
<MCPAgent
  provider="openai"
  model="gpt-4o-mini"
  providerURL="https://llm-proxy.example.com/v1"
  api={{ baseURL: "/api", endpoints }}
/>
```

The package calls `POST {providerURL}/chat/completions`, so your proxy needs to serve exactly that path (OpenAI-style providers) and answer the CORS preflight.

## Option A: Node + Express

```js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: "https://app.example.com" }));   // only your site
app.use(express.json({ limit: "200kb" }));

app.post("/v1/chat/completions", async (req, res) => {
  // TODO: authenticate the user and rate-limit here.

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    // pin the model so users cannot request an expensive one
    body: JSON.stringify({ ...req.body, model: "gpt-4o-mini" }),
  });

  res.status(upstream.status).type("json").send(await upstream.text());
});

app.listen(8787);
```

## Option B: Cloudflare Worker

```js
const CORS = {
  "Access-Control-Allow-Origin": "https://app.example.com",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (new URL(request.url).pathname !== "/v1/chat/completions") {
      return new Response("Not found", { status: 404, headers: CORS });
    }

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,   // set with `wrangler secret put`
      },
      body: await request.text(),
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  },
};
```

## What to add before going live

| Concern | What to do |
| --- | --- |
| **Who may call it** | Check a session cookie or token. Reject anonymous traffic |
| **Abuse and cost** | Rate limit per user/IP, and set a spending cap at the provider |
| **Model choice** | Overwrite `model` server-side (as above) |
| **Payload size** | Limit the request body |
| **Logging** | Log usage, not message contents, if privacy matters |

## Other providers

- **OpenAI-compatible providers** (Groq, DeepSeek, OpenRouter, Mistral, xAI, Together): the same proxy works, changing the upstream URL.
- **Anthropic** and **Gemini** use different request shapes and paths (`/v1/messages`, `…:generateContent`). Proxy those paths and set `providerURL` to your proxy&rsquo;s base. Keep the key in the proxy and forward the body unchanged.

For a framework-integrated version see the [Next.js example](/docs/examples/nextjs).
