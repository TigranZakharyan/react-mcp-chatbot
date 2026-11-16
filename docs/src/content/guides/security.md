---
title: Security
section: Guides
order: 11
description: What running fully client-side means for API keys, permissions, CORS and stored data, and how to stay safe.
---

# Security

Because the whole chatbot runs in the browser, the security model is different from a server-side bot. Read this page before shipping to real users.

## 1. LLM API keys are visible to users

Anything you pass to `apiKey` is in the browser, so a user can find it in dev tools. For a **public** app that means anyone can copy your key and spend your money.

| Situation | What to do |
| --- | --- |
| Internal tool, trusted users | A key in the client may be acceptable. Use a key with a spending cap |
| Prototype / demo | Use your own key briefly, or let visitors paste theirs (as the [playground](/playground) does) |
| Public production app | Put a **thin proxy** in front of the provider and point `providerURL` at it. See the [proxy example](/docs/examples/api-key-proxy) |
| Fully private | Use a local model with Ollama |

A proxy does not need any chatbot logic. It only adds the key and forwards the request, so you keep the main benefit of this package: no chat backend to build. A proxy is also the right place to add rate limits, quotas and per-user abuse protection.

## 2. The assistant acts with the user&rsquo;s own credentials

Tool calls are plain `fetch` requests from the browser, using the headers and cookies you configured. That is good, because **your existing authentication and authorization apply**. It also means:

- The assistant can do anything the signed-in user could do via your API. Only describe endpoints you are comfortable with that.
- **Your backend must enforce permissions.** Never use the system prompt as access control.
- Confirm destructive actions with [`beforeToolCall`](/docs/guides/guardrails).

## 3. Your data goes to the model provider

When the assistant calls your API, the **response is sent to the LLM provider** so it can answer. Do not expose endpoints that return data your agreements do not allow you to share with that vendor. A local model keeps everything on the user&rsquo;s machine.

## 4. Prompt injection

Text returned by your API (reviews, tickets, names) can contain instructions meant for the model. Treat tool results as untrusted input: confirm write actions, enforce server-side authorization, and keep the system prompt explicit. See [Guardrails](/docs/guides/guardrails#prompt-injection).

## 5. CORS

Browser calls require CORS to be allowed on **both** sides:

- Your **API** must allow your app&rsquo;s origin (and credentials if you use cookies).
- The **LLM provider** must allow browser calls. Most major providers do; otherwise use a proxy. For Ollama, set `OLLAMA_ORIGINS` to include your app&rsquo;s origin.

## 6. Stored conversations

With `persist`, history including **API results** is written to `localStorage`. On shared devices or for sensitive data, leave it off, key it per user, and call `clear()` on logout. See [System prompt & history](/docs/guides/system-prompt-and-history#persistence).

## 7. Rendering model output

Replies are rendered with `react-markdown`, which does **not** render raw HTML, so model output cannot inject scripts or markup. If you override `markdownComponents`, do not re-introduce unsafe rendering (for example `dangerouslySetInnerHTML`), and consider dropping images.

## Checklist

- [ ] The key is capped, scoped, or hidden behind a proxy
- [ ] Only the endpoints you want exposed are described
- [ ] The backend enforces authorization for every endpoint
- [ ] Write actions require confirmation (`beforeToolCall`)
- [ ] `persist` is off, or per-user and cleared on logout
- [ ] You are comfortable with API responses being sent to the LLM provider
- [ ] A rate limit exists somewhere (proxy or provider dashboard)
