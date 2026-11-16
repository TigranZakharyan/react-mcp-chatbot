---
title: System prompt & history
section: Guides
order: 5
description: Shape the assistant with a system prompt; understand client-side history, persistence and clearing.
---

# System prompt & history

## System prompt

The system prompt tells the model who it is and how to behave. Set it with `systemPrompt`:

```tsx
<MCPAgent
  /* … */
  systemPrompt={`You are the support assistant for Acme Shop.
- Answer in the user's language, in at most three sentences.
- Only state facts that appear in API results; never promise refunds or delivery dates.
- Ask before cancelling anything.`}
/>
```

Providing a prompt **replaces** the default. The default is exported as `DEFAULT_SYSTEM_PROMPT` if you want to extend it:

```tsx
import { DEFAULT_SYSTEM_PROMPT } from "react-mcp-chatbot";

systemPrompt={`${DEFAULT_SYSTEM_PROMPT}\n\nAlways greet the user by first name: ${user.firstName}.`}
```

The default tells the model to use tools for real data, to retry or explain failures, to ask when a required value is missing, and to answer in clean Markdown.

### Prompt tips

- **Inject context** the model should know: the signed-in user&rsquo;s name, plan, locale, today&rsquo;s date.
- **Set boundaries**: what it must not do or promise. Small models in particular can embellish; a rule such as *“state only facts from API results”* helps a lot.
- **Keep it short.** The prompt is sent on every request.
- The prompt can change between renders. The latest value is always used for the next message.

## History

Conversation history is kept **client-side** and sent to the model with every request. The model has no memory of its own.

| Behaviour | Detail |
| --- | --- |
| Stored as | The full list of messages: user, assistant (with any tool calls) and tool results |
| Window | Only the latest `maxHistoryMessages` (default `40`) are sent. Older ones stay visible in the UI |
| Window edge | The cut always happens at a user turn, so a tool call is never separated from its result |
| Error bubbles | Shown in the UI, never sent to the model |
| Cancelled request | A half-finished tool round is removed so history stays valid |

```tsx
<MCPAgent /* … */ maxHistoryMessages={20} />
```

> **Tip** Long histories cost tokens on every message. If your assistant is mostly one-shot Q&A, lower `maxHistoryMessages`.

## Persistence

By default history lives in memory only and disappears on reload. Turn on persistence to keep it in `localStorage`:

```tsx
<MCPAgent /* … */ persist />                       // key: "react-mcp-chatbot:history"
<MCPAgent /* … */ persist={`chat:${user.id}`} />   // your own key, e.g. per user
```

> **Warning** Persisted history includes **tool results**, which means data returned by your API is written to `localStorage`. On shared computers, or for sensitive data, leave `persist` off, or key it per user and call `clear()` on logout.

Persistence is silently skipped if storage is unavailable (private mode, quota exceeded), and the chat keeps working in memory.

## Clearing the conversation

- The header has a **Clear** button (hide it with `showClearButton={false}`).
- Programmatically, use the [ref handle](/docs/guides/controlling-the-widget) or [`useChat`](/docs/guides/headless-usage):

```tsx
const ref = useRef<MCPAgentHandle>(null);

<MCPAgent ref={ref} /* … */ />

function onLogout() {
  ref.current?.clear();   // cancels any request in flight and removes the saved copy
}
```

## Greeting and starter prompts

The empty state shows a welcome message and optional clickable suggestions. These are UI only and are not added to the model&rsquo;s history:

```tsx
<MCPAgent
  welcomeTitle="Need a hand?"
  welcomeMessage="Ask about your orders."
  suggestions={["Where is my order?", "Cancel order 1002"]}
/>
```

See [Customization](/docs/guides/customization) for all visual options.
