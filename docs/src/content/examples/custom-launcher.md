---
title: Custom launcher & shortcuts
section: Examples
order: 6
description: Open the chat from your own button, a keyboard shortcut, or a per-row "Ask AI" action.
---

# Custom launcher &amp; shortcuts

Hide the built-in floating button and drive the chat from your own UI.

## A header button and ⌘K / Ctrl+K

```tsx
import { useEffect, useRef } from "react";
import { MCPAgent, type MCPAgentHandle } from "react-mcp-chatbot";

export function AppShell({ children }: { children: React.ReactNode }) {
  const chat = useRef<MCPAgentHandle>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        chat.current?.toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header>
        <button onClick={() => chat.current?.toggle()}>✨ Ask AI <kbd>⌘K</kbd></button>
      </header>

      {children}

      <MCPAgent
        ref={chat}
        showLauncher={false}            // no floating button
        provider="openai"
        model="gpt-4o-mini"
        providerURL="/api/llm/v1"
        api={{ baseURL: "/api", endpoints }}
      />
    </>
  );
}
```

## “Ask AI about this” on every table row

```tsx
function OrderRow({ order, chat }: { order: Order; chat: React.RefObject<MCPAgentHandle> }) {
  return (
    <tr>
      <td>{order.id}</td>
      <td>{order.status}</td>
      <td>
        <button
          onClick={() => {
            chat.current?.open();
            chat.current?.send(`What is the status of order ${order.id}, and can it still be cancelled?`);
          }}
        >
          Ask AI
        </button>
      </td>
    </tr>
  );
}
```

`send()` behaves exactly as if the user had typed the text, including tool calls and history.

## Controlled from your own state

```tsx
const [open, setOpen] = useState(false);

<button onClick={() => setOpen(true)}>Help</button>
<MCPAgent open={open} onOpenChange={setOpen} showLauncher={false} /* … */ />
```

## Reset on logout or when the context changes

```tsx
useEffect(() => {
  chat.current?.clear();     // new user or new workspace → fresh conversation
}, [user.id]);
```

See [Controlling the widget](/docs/guides/controlling-the-widget) for the full API.
