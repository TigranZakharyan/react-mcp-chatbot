---
title: How it works
section: Getting started
order: 3
description: The tool-calling loop, what is sent to the model, and what stays in the browser.
---

# How it works

`react-mcp-chatbot` runs a small agent loop **inside the browser**. There is no server of ours in the middle: the only network calls are to your LLM provider and to your own API.

```
User message
    │
    ▼
ChatEngine (history + system prompt + tool list)
    │   ① "here is the conversation and the tools you may call"
    ▼
LLM provider ──► reply: either text, or "call tool X with these arguments"
    │
    ├─ text ─────────────────────────────► shown to the user. Done.
    │
    └─ tool call ► your API (fetch, with your auth) ► result
                         │
                         └── ② result added to history, back to the model
                                   (repeat, up to maxToolRounds)
```

## One message, step by step

Say the user types **“Cancel order 1002”**.

1. **Add to history.** The message is appended to the client-side conversation.
2. **Ask the model.** The engine sends the system prompt, the (windowed) history and the list of tools. Each tool is generated from your [endpoint descriptions](/docs/guides/describing-your-api) as a function-calling schema.
3. **The model decides.** Instead of answering, it replies *“call `cancel_order` with `{ "id": "1002" }`”*.
4. **Validate.** The engine checks required arguments and converts types (for example the string `"42"` to a number where the schema says number).
5. **Guardrail.** Your [`beforeToolCall`](/docs/guides/guardrails) hook can approve or block the call.
6. **Execute.** The package performs the `fetch`: path parameters are filled in, query and body are built, your headers are added.
7. **Return the result.** The response (or the error) is added to history as a tool message and sent back to the model.
8. **Final answer.** The model writes the reply: *“Order 1002 has been cancelled.”* This is what the user sees.

If the model needs several calls (look up a customer, then fetch their orders), steps 3 to 7 repeat. Calls requested together run in parallel.

## What is sent to the model

| Sent | Not sent |
| --- | --- |
| Your system prompt | Your API key for *your own* backend |
| The most recent `maxHistoryMessages` (default 40) | Messages older than that window |
| Each tool&rsquo;s name, description and parameters | Your backend URL (beyond what you put in descriptions) |
| API responses, truncated to `maxToolResultChars` (default 8000) | UI error bubbles |

> **Note** API responses are sent to the model provider so it can answer. Do not describe endpoints that return data you are not allowed to share with your LLM vendor.

## Errors are part of the conversation

If an API call fails (HTTP 404, 409, network error, invalid arguments), the error text is returned to the model as the tool result. A good model reads it, fixes its arguments or explains the problem to the user. Nothing is thrown at your UI.

Errors from the *provider* (bad key, rate limit, network) show up as a red error bubble and trigger `onError`. They are never sent back to the model.

## What lives where

| Thing | Where |
| --- | --- |
| Conversation history | In memory; optionally `localStorage` with [`persist`](/docs/guides/system-prompt-and-history) |
| The loop, validation, truncation | In your user&rsquo;s browser |
| Model inference | At your LLM provider (or on your machine with Ollama) |
| Your business data | Your API, called directly from the browser |

## Safety valves

- **`maxToolRounds`** (default 8): after this many round trips, tools are withheld and the model must answer in plain text, so a confused model cannot loop forever.
- **`maxToolResultChars`** (default 8000) and **`api.maxResponseChars`**: cap how much of a large response reaches the model.
- **Cancellation**: `stop()` aborts the in-flight request and removes any half-finished tool round from history; `clear()` also wipes the saved conversation.

Continue with [Describing your API](/docs/guides/describing-your-api).
