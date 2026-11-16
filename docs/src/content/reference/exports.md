---
title: Exports & TypeScript
section: Reference
order: 5
description: Everything the package exports, the module formats it ships, and how to type your props.
---

# Exports &amp; TypeScript

## Runtime exports

| Export | Kind | Docs |
| --- | --- | --- |
| `MCPAgent` | React component | [Props](/docs/reference/mcpagent-props) |
| `useChat` | React hook | [Hooks &amp; engine](/docs/reference/hooks-and-engine) |
| `ChatEngine` | Class | [Hooks &amp; engine](/docs/reference/hooks-and-engine) |
| `createProvider` | Function | [Hooks &amp; engine](/docs/reference/hooks-and-engine) |
| `endpointsFromOpenAPI` | Function | [OpenAPI import](/docs/guides/openapi-import) |
| `PROVIDER_URLS` | Object | [Providers](/docs/guides/providers) |
| `DEFAULT_SYSTEM_PROMPT` | String | [Engine options](/docs/reference/chat-config) |

## Type exports

```ts
import type {
  MCPAgentProps,      // props of <MCPAgent />
  MCPAgentHandle,     // ref handle
  MCPThemeColors,     // keys of the `colors` prop
  MCPTool,
  MCPToolParameter,
  ApiConfig,
  ApiEndpoint,
  ApiParameter,
  ChatConfig,
  ProviderConfig,
  ProviderName,
  Provider,
  ChatMessage,
  ChatState,
  ToolCall,
} from "react-mcp-chatbot";
```

## Module formats

| Entry | File |
| --- | --- |
| ESM (`import`) | `dist/index.js` |
| CommonJS (`require`) | `dist/index.cjs` |
| Types | `dist/index.d.ts` / `dist/index.d.cts` |

Both formats work out of the box in Vite, webpack, Next.js and Node. The CommonJS build bundles the ESM-only Markdown dependencies, so `require("react-mcp-chatbot")` works on every supported Node version.

## Typing your configuration

Share a typed config between components:

```tsx
import type { ApiConfig, MCPAgentProps } from "react-mcp-chatbot";

const api: ApiConfig = {
  baseURL: "/api",
  endpoints: [/* autocomplete works here */],
};

const props: MCPAgentProps = {
  provider: "openai",
  model: "gpt-4o-mini",
  api,
};

<MCPAgent {...props} />
```

> **Tip** Literal values like `type: "string"` need to stay literal types. Declare the config with a type annotation (as above) or `as const`; otherwise TypeScript widens them to `string`.

## Side effects and bundle size

The package is marked `sideEffects: false` and ships no CSS files, so unused exports tree-shake. Runtime dependencies are `react-markdown` and `remark-gfm`; React and React DOM are peer dependencies.
