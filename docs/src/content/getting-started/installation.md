---
title: Installation
section: Getting started
order: 1
description: Install react-mcp-chatbot and check that your project meets the requirements.
---

# Installation

`react-mcp-chatbot` is a React component (plus a headless hook and engine) that adds an AI chatbot to your app. It calls your existing REST APIs for you, entirely from the browser.

```bash
npm install react-mcp-chatbot
```

```bash
yarn add react-mcp-chatbot
pnpm add react-mcp-chatbot
```

## Requirements

| Requirement | Version |
| --- | --- |
| React and React DOM | 18 or newer (peer dependencies) |
| Node.js (for your build tooling) | 18 or newer |
| A tool-calling LLM | Any [supported provider](/docs/guides/providers) whose model supports function calling |
| A REST API (optional) | Anything you can call with `fetch` from the browser |

The package has **two runtime dependencies**: `react-markdown` and `remark-gfm`, used to render assistant replies. Everything else is your own code.

## What you get

- ESM and CommonJS builds, both with bundled TypeScript types. No separate `@types` package is needed.
- No CSS file to import. Styles are injected by the component.
- No global side effects: the package is marked `sideEffects: false`, so it tree-shakes.

## Framework notes

### Vite, Create React App, Remix SPA mode

Nothing to configure. Import and render.

### Next.js (App Router)

The component uses React state and browser APIs, so it must be rendered from a **Client Component**. Create a small wrapper:

```tsx
// components/Chatbot.tsx
"use client";

import { MCPAgent } from "react-mcp-chatbot";

export function Chatbot() {
  return (
    <MCPAgent
      provider="openai"
      model="gpt-4o-mini"
      apiKey={process.env.NEXT_PUBLIC_OPENAI_KEY!}
      api={{ baseURL: "/api", endpoints: [/* … */] }}
    />
  );
}
```

Then use `<Chatbot />` in any layout or page. See the [Next.js example](/docs/examples/nextjs) for a complete setup, including a proxy route that keeps the key off the client.

> **Warning** Anything prefixed `NEXT_PUBLIC_` (or `VITE_`) is shipped to the browser. Read [Security](/docs/guides/security) before putting a real key in a public app.

### Server-side rendering

The component renders nothing meaningful on the server and starts working after hydration. It is safe to include in an SSR page.

## Verify the install

```tsx
import { MCPAgent } from "react-mcp-chatbot";
console.log(typeof MCPAgent); // "object" (a forwardRef component)
```

Next: build your first chatbot in the [Quick start](/docs/getting-started/quick-start).
