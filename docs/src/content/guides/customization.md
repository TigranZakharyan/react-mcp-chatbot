---
title: Customization
section: Guides
order: 7
description: Theme, colours, fonts, text, icons, position and Markdown rendering. Try every option live.
---

# Customization

Everything about the widget&rsquo;s look and feel is a prop. No CSS overrides are needed. Try the options below: the chat in the corner of this page updates live, and the code underneath is generated for you.

```component:Customizer
```

> **New** Most options on this page arrived in **1.1.0**: `theme="auto"`, `colors`, `fontFamily`, `avatar`, `launcherIcon`, `subtitle`, `welcome*`, `markdownComponents`, positioning and the controlled open state.

## Theme and colours

```tsx
<MCPAgent
  theme="auto"            // "dark" (default) | "light" | "auto"
  primaryColor="#0ea5e9"  // accent: launcher, user bubbles, links, focus ring
/>
```

`theme="auto"` follows the visitor&rsquo;s operating-system setting and updates live when it changes.

### Override individual colours

`colors` accepts any subset of the theme tokens. Anything you do not set keeps the value from the active theme:

```tsx
<MCPAgent
  theme="light"
  primaryColor="#0ea5e9"
  colors={{
    bg: "#fffbeb",
    surface: "#fef9e7",
    aiBubble: "#fef3c7",
    aiBubbleText: "#78350f",
  }}
/>
```

| Token | Controls |
| --- | --- |
| `bg` | Window background and header (light theme) |
| `surface` | Message area and header (dark theme) |
| `surfaceHover` | Hover state of header buttons |
| `border` | All borders and table lines |
| `text` / `textMuted` | Primary and secondary text |
| `accent` / `accentHover` | Accent colour and its hover shade |
| `userBubble` / `userBubbleText` | Your messages |
| `aiBubble` / `aiBubbleText` | Assistant messages |
| `inputBg` / `inputBorder` / `inputFocus` | Message box |
| `scrollbar` / `scrollbarThumb` | Scrollbar track and thumb |
| `shadow` | Window shadow (CSS `box-shadow` value) |
| `headerGlow` | Soft glow behind the header avatar |
| `codeBg` / `codeText` | Inline `code` in replies |
| `preBg` | Code blocks in replies |
| `tableHeadBg` | Table header cells in replies |

## Text

```tsx
<MCPAgent
  title="Acme Support"
  subtitle="Typically replies in a minute"   // default "Online"; null hides the line
  placeholder="Ask about your order…"
  welcomeTitle="Need a hand?"
  welcomeMessage="Ask about orders, shipping or returns."
  buttonLabel="Ask AI"                        // adds a label next to the launcher icon
  suggestions={["Where is my order?", "Cancel order 1002"]}
/>
```

## Icons and images

`avatar`, `launcherIcon` and `welcomeIcon` accept an emoji, text, or any React node. `avatar` also accepts an image URL (`http…`, `/path`, `./path` or `data:`):

```tsx
<MCPAgent
  avatar="/logo.png"
  launcherIcon={<ChatBubbleIcon size={22} />}
  welcomeIcon="🛍️"
/>
```

## Shape, size and type

```tsx
<MCPAgent
  width={420}                 // default 600
  height={640}                // default 900
  borderRadius={12}           // default 20
  fontFamily="Inter, sans-serif"
  className="my-chat"         // class on the chat window
  style={{ boxShadow: "0 0 0 1px #000" }}   // inline style on the chat window
/>
```

The window never exceeds the viewport: width and height are capped to the available space, so it fits phones without extra work.

## Position

```tsx
<MCPAgent
  align="left"        // or "right" (default)
  bottomOffset={16}   // px from the bottom, default 24
  sideOffset={16}     // px from the chosen side, default 24
  zIndex={5000}       // chat window; the launcher sits one above. Default 9998
/>
```

## Rendering replies

Assistant replies are rendered as Markdown (GitHub-flavoured: tables, task lists, code). Replace how elements render with `markdownComponents`, the same `components` map `react-markdown` uses:

```tsx
<MCPAgent
  markdownComponents={{
    a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
    img: () => null,   // never render images from model output
  }}
/>
```

> **Note** Raw HTML in replies is **not** rendered as HTML, so model output cannot inject markup or scripts into your page.

## The Clear button

```tsx
<MCPAgent showClearButton={false} />   // hide the header button
```

## All visual props

See the full table in the [`<MCPAgent />` props reference](/docs/reference/mcpagent-props), and open-state options in [Controlling the widget](/docs/guides/controlling-the-widget).
