---
title: Next.js with a key-safe proxy
section: Examples
order: 3
description: Use the chatbot in the Next.js App Router with the LLM key kept on the server.
---

# Next.js with a key-safe proxy

This setup keeps your OpenAI key on the server, using one small route handler, while the chatbot itself still runs in the browser. There is no chat logic on the server: the route only adds the key and forwards the request.

## 1. The proxy route

```ts
// app/api/llm/v1/chat/completions/route.ts
export async function POST(req: Request) {
  // TODO: verify the user's session and apply a rate limit before forwarding.

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // server-only env var
    },
    body: await req.text(),
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
```

Put `OPENAI_API_KEY` in `.env.local` **without** the `NEXT_PUBLIC_` prefix, so it never reaches the browser.

## 2. A client component

```tsx
// components/Chatbot.tsx
"use client";

import { MCPAgent } from "react-mcp-chatbot";

export function Chatbot() {
  return (
    <MCPAgent
      provider="openai"
      model="gpt-4o-mini"
      providerURL="/api/llm/v1"          // our proxy: no apiKey needed in the browser
      title="Assistant"
      systemPrompt="You are the in-app assistant. Be concise."
      api={{
        baseURL: "/api",                 // your own Next.js API routes
        credentials: "same-origin",      // session cookie goes along automatically
        endpoints: [
          {
            name: "list_projects",
            description: "List the current user's projects",
            path: "/projects",
          },
          {
            name: "create_project",
            description: "Create a new project",
            method: "POST",
            path: "/projects",
            parameters: { name: { type: "string" } },
          },
        ],
      }}
      beforeToolCall={({ method }) => method === "GET" || window.confirm("Allow this change?")}
    />
  );
}
```

## 3. Mount it once

```tsx
// app/layout.tsx
import { Chatbot } from "@/components/Chatbot";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
```

## Why this works well

- The browser talks to **your own origin** for both the model (`/api/llm/v1`) and your data (`/api`), so there is **no CORS** to configure.
- The user&rsquo;s session cookie authenticates both, so the proxy can check *who* is asking and rate-limit per user.
- No `apiKey` prop is set, so nothing secret is ever shipped to the client.

## Hardening the proxy

- Reject requests without a valid session.
- Rate limit per user and cap total spend at the provider.
- Pin the model server-side (`JSON.parse` the body, overwrite `model`) so a user cannot ask for a more expensive one.
- Reject oversized bodies.

See also: the [proxy example for other runtimes](/docs/examples/api-key-proxy).
