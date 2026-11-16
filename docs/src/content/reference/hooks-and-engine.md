---
title: Hooks & engine
section: Reference
order: 4
description: useChat, ChatEngine, createProvider, endpointsFromOpenAPI and other runtime exports.
---

# Hooks &amp; engine

```ts
import {
  MCPAgent,
  useChat,
  ChatEngine,
  createProvider,
  endpointsFromOpenAPI,
  PROVIDER_URLS,
  DEFAULT_SYSTEM_PROMPT,
} from "react-mcp-chatbot";
```

## `useChat(config)`

```ts
function useChat(config: ChatConfig): {
  messages: ChatMessage[];
  loading: boolean;
  status: string | null;
  send: (text: string) => Promise<void>;
  clear: () => void;
  stop: () => void;
  engine: ChatEngine;
};
```

A headless React hook with the full chat logic. One engine is created per component instance; configuration changes are applied on each render without resetting history. Guide: [Headless usage](/docs/guides/headless-usage).

## `ChatEngine`

```ts
class ChatEngine {
  constructor(config: ChatConfig);
  configure(config: ChatConfig): void;
  getState(): ChatState;                       // { messages, loading, status }
  subscribe(listener: () => void): () => void; // returns an unsubscribe function
  send(text: string): Promise<void>;
  clear(): void;
  abort(): void;
}
```

| Method | Details |
| --- | --- |
| `constructor` | Loads saved history when `persist` is enabled |
| `configure` | Updates options in place. Rebuilds the provider only if provider settings changed, and the API tools only if `api` changed |
| `getState` | Returns a stable object until the next change, suitable for `useSyncExternalStore` |
| `send` | Ignores empty text and calls made while loading. Resolves when the turn is complete |
| `clear` | Aborts the active request, removes the saved history, empties the conversation |
| `abort` | Cancels the active request and drops any half-finished tool round |

## `createProvider(config)`

```ts
function createProvider(config: ProviderConfig): Provider;

interface Provider {
  complete(req: ProviderRequest): Promise<ProviderResponse>;
}

type ProviderRequest = {
  system: string;
  messages: ChatMessage[];
  tools: ToolSpec[];
  temperature?: number;
  signal?: AbortSignal;
};

type ProviderResponse = { content: string; toolCalls: ToolCall[] };
```

Returns the adapter used by the engine. Useful for tests, or to call a model directly in the same normalized format.

## `endpointsFromOpenAPI(document)`

```ts
function endpointsFromOpenAPI(doc: Record<string, any>): ApiEndpoint[];
```

Converts an OpenAPI/Swagger document into endpoint descriptions. See [OpenAPI import](/docs/guides/openapi-import).

## Constants

| Export | Description |
| --- | --- |
| `PROVIDER_URLS` | Default base URLs for hosted providers |
| `DEFAULT_SYSTEM_PROMPT` | The built-in system prompt |

## Messages and state

```ts
type ChatMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; content: string; toolCalls?: ToolCall[]; error?: boolean }
  | { id: string; role: "tool"; toolCallId: string; name: string; content: string };

type ToolCall = {
  id: string;
  name: string;
  args: Record<string, any>;
  raw?: unknown;       // provider-specific payload that must be sent back unchanged
};

type ChatState = {
  messages: ChatMessage[];
  loading: boolean;
  status: string | null;   // "Calling get_order…", "Thinking…"
};
```

An assistant message with `error: true` is a UI-only error bubble and is never sent to the model.
