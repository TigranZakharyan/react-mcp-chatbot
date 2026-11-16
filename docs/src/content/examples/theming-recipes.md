---
title: Theming recipes
section: Examples
order: 7
description: Ready-made looks: brand light theme, OS-aware, compact, serif, and fully custom palettes.
---

# Theming recipes

Copy and adjust. All of these use only props; see [Customization](/docs/guides/customization) for the live editor and every option.

## Follow the visitor&rsquo;s OS

```tsx
<MCPAgent theme="auto" primaryColor="#5b3df5" />
```

## Brand light theme

```tsx
<MCPAgent
  theme="light"
  primaryColor="#0f766e"
  title="Acme Help"
  avatar="/brand/avatar.png"
  subtitle="Usually replies in a minute"
  borderRadius={14}
  fontFamily="'Inter', system-ui, sans-serif"
/>
```

## Warm paper palette

```tsx
<MCPAgent
  theme="light"
  primaryColor="#b45309"
  fontFamily="Georgia, 'Times New Roman', serif"
  colors={{
    bg: "#fffbeb",
    surface: "#fef9e7",
    border: "#f3e4b5",
    aiBubble: "#fef3c7",
    aiBubbleText: "#78350f",
    text: "#451a03",
    inputBg: "#fffdf5",
  }}
/>
```

## Midnight blue dark

```tsx
<MCPAgent
  theme="dark"
  primaryColor="#38bdf8"
  colors={{
    bg: "#0b1220",
    surface: "#0f1a2e",
    aiBubble: "#13203a",
    border: "#1d2c4a",
    inputBg: "#0c1527",
  }}
/>
```

## Compact, bottom-left

```tsx
<MCPAgent
  align="left"
  bottomOffset={12}
  sideOffset={12}
  width={340}
  height={460}
  borderRadius={10}
  showClearButton={false}
/>
```

## Square, high-contrast

```tsx
<MCPAgent
  theme="light"
  primaryColor="#000000"
  borderRadius={0}
  colors={{ border: "#000000", userBubble: "#000000", aiBubble: "#ffffff", aiBubbleText: "#000000", shadow: "6px 6px 0 #000" }}
/>
```

## Match your design system&rsquo;s classes

```tsx
<MCPAgent className="my-chat" style={{ outline: "1px solid var(--border)" }} />
```

```css
.my-chat { backdrop-filter: blur(10px); }
```

## Replace the icons

```tsx
<MCPAgent
  avatar={<BrandLogo width={22} />}
  launcherIcon={<SparklesIcon />}
  welcomeIcon={<SparklesIcon size={26} />}
  buttonLabel="Ask AI"
/>
```

## Custom links and images in replies

```tsx
<MCPAgent
  markdownComponents={{
    a: (props) => <a {...props} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }} />,
    img: () => null,
  }}
/>
```
