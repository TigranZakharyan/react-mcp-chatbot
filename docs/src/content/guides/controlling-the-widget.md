---
title: Controlling the widget
section: Guides
order: 8
description: Open and close the chat from your own UI, control it as a React state, and call it through a ref.
---

# Controlling the widget

By default `<MCPAgent />` shows a floating launcher button and manages its own open/closed state. You can take over any part of that.

## Start open

```tsx
<MCPAgent defaultOpen />   // uncontrolled: starts open, user can close it
```

## Your own button

Hide the floating launcher and open the chat from anywhere using a **ref**:

```tsx
import { useRef } from "react";
import { MCPAgent, type MCPAgentHandle } from "react-mcp-chatbot";

function Page() {
  const chat = useRef<MCPAgentHandle>(null);

  return (
    <>
      <button onClick={() => chat.current?.toggle()}>Ask AI</button>
      <MCPAgent ref={chat} showLauncher={false} /* … */ />
    </>
  );
}
```

## Fully controlled

Pass `open` and `onOpenChange` to keep the state in your own component (for example to open the chat from a keyboard shortcut or a URL):

```tsx
const [open, setOpen] = useState(false);

useEffect(() => {
  const onKey = (e: KeyboardEvent) => e.key === "k" && e.metaKey && setOpen((o) => !o);
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, []);

<MCPAgent open={open} onOpenChange={setOpen} /* … */ />
```

`onOpenChange` is called whenever the open state is changed through the launcher button or the ref methods. Without `open`, it is only a notification.

## The ref handle

| Method | Description |
| --- | --- |
| `open()` | Open the window |
| `close()` | Close the window |
| `toggle()` | Open if closed, close if open |
| `send(text)` | Send a message as the user. Returns a promise that resolves when the reply is done |
| `stop()` | Cancel the request in flight |
| `clear()` | Cancel any request and wipe the conversation (and its saved copy) |

### Send a message from outside the chat

```tsx
// a "Ask about this order" button next to each row
<button
  onClick={() => {
    chat.current?.open();
    chat.current?.send(`Tell me about order ${order.id}`);
  }}
>
  Ask AI
</button>
```

### Clear on logout

```tsx
function logout() {
  chat.current?.clear();
  auth.signOut();
}
```

## Several chatbots on one page

Each `<MCPAgent />` keeps its own conversation. Give each a different `persist` key if you persist, and different `bottomOffset` / `sideOffset` so the floating buttons do not overlap.

## Accessibility

The launcher has an accessible name (“Open chat” / “Close chat”) and `aria-expanded`. The window is a labelled dialog (its label is the `title`) and is hidden from assistive technology while closed.

Need a completely different UI? Use the [headless hook](/docs/guides/headless-usage).
