---
title: <MCPAgent /> props
section: Reference
order: 1
description: Every prop of the MCPAgent component: type, default, and the version it was added in.
---

# `<MCPAgent />` props

`MCPAgent` accepts **all [engine options](/docs/reference/chat-config)** (provider, model, tools, api…) plus the visual and behaviour props below. Every prop except `provider` and `model` is optional.

```tsx
import { MCPAgent, type MCPAgentProps, type MCPAgentHandle } from "react-mcp-chatbot";
```

The component forwards a ref of type `MCPAgentHandle` ([methods below](#ref-handle)).

## Model and behaviour

These configure the engine. Full details in [Engine options](/docs/reference/chat-config).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `provider` | `ProviderName` | required | Which LLM provider |
| `model` | `string` | required | Model name at that provider |
| `apiKey` | `string` | | Provider key (hosted providers) |
| `providerURL` | `string` | per provider | Override the provider base URL |
| `systemPrompt` | `string` | built-in | Instructions for the assistant |
| `api` | `ApiConfig` | | Describe your backend |
| `tools` | `MCPTool[]` | | Custom JS tools |
| `persist` | `boolean \| string` | `false` | Save history to `localStorage` |
| `beforeToolCall` | `(call) => boolean \| Promise<boolean>` | | Approve or block a tool call |
| `onToolCall` | `(call) => void` | | Called after each tool call |
| `onError` | `(error) => void` | | Provider-level failure |

## Text

| Prop | Type | Default | Since |
| --- | --- | --- | --- |
| `title` | `string` | `"AI Assistant"` | 0.x |
| `subtitle` | `string \| null` | `"Online"` (`null` hides) | 1.1.0 |
| `placeholder` | `string` | `"Message…"` | 0.x |
| `buttonLabel` | `string` | none | 0.x |
| `welcomeTitle` | `string` | `"Hey there!"` | 1.1.0 |
| `welcomeMessage` | `string` | `"How can I help you today?"` | 1.1.0 |
| `suggestions` | `string[]` | none | 1.0.0 |

## Appearance

| Prop | Type | Default | Since |
| --- | --- | --- | --- |
| `theme` | `"dark" \| "light" \| "auto"` | `"dark"` | `auto` in 1.1.0 |
| `primaryColor` | `string` | `"#6366f1"` | 0.x |
| `colors` | `Partial<ThemeTokens>` | none | 1.1.0 |
| `borderRadius` | `number` | `20` | 0.x |
| `fontFamily` | `string` | DM Sans / Segoe UI / system | 1.1.0 |
| `width` | `number` | `600` | 0.x |
| `height` | `number` | `900` | 0.x |
| `className` | `string` | none | 1.1.0 |
| `style` | `CSSProperties` | none | 1.1.0 |

Width and height are upper bounds: the window is also capped to the viewport (`100vw - 32px`, and the available height).

## Icons and content

| Prop | Type | Default | Since |
| --- | --- | --- | --- |
| `avatar` | `ReactNode` (emoji, text, image URL, or element) | `"🤖"` | 1.1.0 |
| `launcherIcon` | `ReactNode` | `"💬"` | 1.1.0 |
| `welcomeIcon` | `ReactNode` | `"👋"` | 1.1.0 |
| `markdownComponents` | `Components` (from `react-markdown`) | none | 1.1.0 |
| `showClearButton` | `boolean` | `true` | 1.0.0 |

## Position and stacking

| Prop | Type | Default | Since |
| --- | --- | --- | --- |
| `align` | `"left" \| "right"` | `"right"` | 0.x |
| `bottomOffset` | `number` (px) | `24` | 1.1.0 |
| `sideOffset` | `number` (px) | `24` | 1.1.0 |
| `zIndex` | `number` | `9998` (launcher: +1) | 1.1.0 |

## Open state

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `defaultOpen` | `boolean` | `false` | Start open (uncontrolled) |
| `open` | `boolean` | | Control the window yourself |
| `onOpenChange` | `(open: boolean) => void` | | Called when the open state changes through the launcher or ref |
| `showLauncher` | `boolean` | `true` | Show the floating button |

`defaultOpen` and `suggestions` arrived in 1.0.0; the controlled-open props in 1.1.0.

## Ref handle

```tsx
const ref = useRef<MCPAgentHandle>(null);
<MCPAgent ref={ref} /* … */ />
```

| Method | Signature | Description |
| --- | --- | --- |
| `open` | `() => void` | Open the window |
| `close` | `() => void` | Close the window |
| `toggle` | `() => void` | Toggle the window |
| `send` | `(text: string) => Promise<void>` | Send a user message |
| `stop` | `() => void` | Cancel the request in flight |
| `clear` | `() => void` | Cancel and wipe the conversation |

## Types

```ts
type MCPAgentProps = ChatConfig & BaseUIProps;   // engine options + the visual props above
```

`ThemeTokens` is exported as `MCPThemeColors`. The token list is in [Customization](/docs/guides/customization#override-individual-colours).

