---
title: Headless usage
section: Guides
order: 9
description: Build your own chat UI with useChat, or use the ChatEngine without React.
---

# Headless usage

The floating widget is just one front-end on top of the engine. If you want your own UI, such as a full-page chat, an embedded panel or a command palette, use the `useChat` hook. It gives you all the logic (history, tool loop, persistence) with none of the markup.

```tsx
import { useChat } from "react-mcp-chatbot";

function SupportChat() {
  const { messages, loading, status, send, clear, stop } = useChat({
    provider: "openai",
    model: "gpt-4o-mini",
    apiKey: key,
    systemPrompt: "You are a concise support agent.",
    api: { baseURL: "/api", endpoints },
  });

  const [text, setText] = useState("");

  return (
    <div>
      {messages
        .filter((m) => (m.role === "user" || m.role === "assistant") && m.content.trim())
        .map((m) => (
          <p key={m.id} className={m.role}>
            {m.content}
          </p>
        ))}

      {loading && <p>{status ?? "Thinking…"}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
          setText("");
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button disabled={loading}>Send</button>
        <button type="button" onClick={loading ? stop : clear}>
          {loading ? "Stop" : "Clear"}
        </button>
      </form>
    </div>
  );
}
```

## What `useChat` returns

| Field | Type | Description |
| --- | --- | --- |
| `messages` | `ChatMessage[]` | Everything in the conversation, including tool messages |
| `loading` | `boolean` | A request is in flight |
| `status` | `string \| null` | Progress text such as `Calling get_order…` |
| `send(text)` | `Promise<void>` | Send a user message. Ignored while loading or if empty |
| `clear()` | `void` | Cancel and wipe the conversation |
| `stop()` | `void` | Cancel the request in flight |
| `engine` | `ChatEngine` | The underlying engine |

It takes the same [configuration](/docs/reference/chat-config) as `<MCPAgent />` minus the visual props.

## Rendering messages

`messages` contains **four kinds** of entries. Typically you show only the first two:

```ts
type ChatMessage =
  | { id; role: "user"; content }
  | { id; role: "assistant"; content; toolCalls?; error? }
  | { id; role: "tool"; toolCallId; name; content };   // API results: hide these
```

- An assistant message with `toolCalls` and empty `content` is an intermediate step: hide it by filtering out empty content (as above).
- `error: true` marks a UI-only error bubble. Style it differently.
- Render assistant content as Markdown, for example with `react-markdown`.

Show what the assistant is doing by using `status` or the [`onToolCall`](/docs/guides/guardrails) callback.

## Config can change between renders

`useChat` keeps one engine for the lifetime of the component and applies new config on every render. Changing the model, system prompt or tools does **not** reset history. Changing `persist`&rsquo;s key loads the history saved under the new key.

## Using the engine without React

`ChatEngine` is the framework-agnostic core. Use it in Vue, Svelte, web components or plain scripts:

```ts
import { ChatEngine } from "react-mcp-chatbot";

const engine = new ChatEngine({
  provider: "ollama",
  model: "llama3.1",
  api: { baseURL: "/api", endpoints },
});

const unsubscribe = engine.subscribe(() => {
  const { messages, loading, status } = engine.getState();
  render(messages, loading, status);
});

await engine.send("Which orders are processing?");

engine.clear();
unsubscribe();
```

| Method | Description |
| --- | --- |
| `new ChatEngine(config)` | Create an engine. Loads saved history if `persist` is on |
| `getState()` | `{ messages, loading, status }`. A new object whenever something changes |
| `subscribe(listener)` | Call `listener` on every change. Returns an unsubscribe function |
| `send(text)` | Run a full turn, including tool calls |
| `abort()` | Cancel the request in flight |
| `clear()` | Cancel and wipe the conversation and its saved copy |
| `configure(config)` | Update configuration without losing history |

The engine itself contains no React code. React remains a peer dependency of the package, so it must be installed, but you never have to render a component.
