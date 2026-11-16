---
title: FAQ
section: Help
order: 1
description: Answers to the most common questions about react-mcp-chatbot.
---

# Frequently asked questions

## General

### Do I need a backend?

**No chat backend.** The conversation, tool loop and history run in the browser. You still need (a) an LLM, which is either a hosted provider or a local model, and (b) your own REST API if you want the assistant to act on your data. For a public app, a tiny proxy to hide the LLM key is recommended, but it contains no chatbot logic. See [Keep the API key off the client](/docs/examples/api-key-proxy).

### How is this different from the Vercel AI SDK, CopilotKit or similar?

Those toolkits are typically **server-centric**: a server route runs the model and the tools. This package is deliberately the opposite: everything runs client-side, and tools are your existing REST endpoints called with the signed-in user&rsquo;s credentials.

| | react-mcp-chatbot | Server-centric SDKs |
| --- | --- | --- |
| Tool loop runs | In the browser | Typically on your server |
| Chat backend needed | No | Usually yes |
| Tools are | REST endpoint descriptions or an OpenAPI spec | Server-side functions you write |
| LLM key | Visible to the client unless proxied | Stays on the server |

Pick a server-centric approach when secrets or business logic must never reach the browser. Pick this when your API already enforces permissions and you want a chat front-end for it. (Check each project&rsquo;s own docs, as they evolve.)

### Is it related to the Model Context Protocol (MCP)?

The name reflects the idea: connecting a model to tools. The package does not implement the MCP wire protocol; tools are described with simple objects (or an OpenAPI document) and called over `fetch`.

### Is it free? What is the license?

Yes. It is MIT licensed. Model providers have their own pricing; [Ollama and demo mode](/docs/guides/providers#free-and-local-options) cost nothing.

## Models and providers

### Which models work?

Any model that supports **tool/function calling**, through one of the [supported providers](/docs/guides/providers) or any OpenAI-compatible endpoint.

### Can I use a local model?

Yes. Use `provider="ollama"`. See [Free local model with Ollama](/docs/examples/ollama-local).

### Can I switch providers without changing code?

Yes. Change `provider`, `model` and `apiKey`. Tool descriptions and everything else stay the same.

### Does it stream responses?

Not yet. Replies appear when complete. The typing indicator and a status line (for example “Calling get_order…”) show progress. Streaming is not available yet and would be a welcome contribution.

## Tools and APIs

### Can it call GraphQL or non-REST APIs?

Use a [custom tool](/docs/guides/custom-tools): write a function that runs your GraphQL query (or any SDK call) and return the result.

### Can the assistant call several endpoints in one answer?

Yes. It can chain calls (up to `maxToolRounds`, default 8), and calls requested together run in parallel.

### How do I stop it from deleting things?

Don&rsquo;t describe destructive endpoints, and require confirmation with `beforeToolCall`. See [Guardrails](/docs/guides/guardrails).

### What happens when an API call fails?

The error (status and body) is returned to the model, which can retry with different arguments or explain the problem. See [How it works](/docs/getting-started/how-it-works#errors-are-part-of-the-conversation).

### Can I use my existing login (cookies, JWT)?

Yes. Calls use `fetch` from the browser with the headers and credentials you configure. See [Authentication](/docs/guides/authentication).

## UI

### Can I build my own interface?

Yes: [`useChat`](/docs/guides/headless-usage) gives you the logic with no UI, and `ChatEngine` works without React.

### Can I change colours, fonts, icons and size?

Yes, all of them. See [Customization](/docs/guides/customization).

### Does it work on mobile?

Yes. The window is capped to the viewport, so it fits phones.

### Does it support other languages?

The assistant replies in whatever language the model supports, and you can ask for a specific one in the system prompt. UI strings you control (title, placeholder, welcome text) are props.

## Data and privacy

### Where is the conversation stored?

In memory. With `persist`, in the browser&rsquo;s `localStorage`. Nothing is sent to us. See [System prompt &amp; history](/docs/guides/system-prompt-and-history).

### What data goes to the model provider?

The system prompt, recent messages, tool descriptions, and API responses the model asked for. See [Security](/docs/guides/security).

## Contributing and support

Found a bug or have an idea? [Open an issue](https://github.com/TigranZakharyan/react-mcp-chatbot/issues). Contributions are welcome: see the [repository](https://github.com/TigranZakharyan/react-mcp-chatbot).
