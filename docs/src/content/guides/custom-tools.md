---
title: Custom tools
section: Guides
order: 3
description: Give the model abilities that are not REST calls: app state, navigation, SDKs, local logic.
---

# Custom tools

Not everything is a REST endpoint. With the `tools` prop you can expose **any JavaScript function** to the model: read app state, navigate, open a modal, call an SDK.

```tsx
import { MCPAgent, type MCPTool } from "react-mcp-chatbot";

const tools: MCPTool[] = [
  {
    name: "get_cart",
    description: "Return the current contents of the user's shopping cart",
    parameters: {},
    call: async () => store.getState().cart,
  },
  {
    name: "go_to_page",
    description: "Navigate the user to a page of the app",
    parameters: {
      page: { type: "string", enum: ["orders", "settings", "billing"], description: "Destination" },
    },
    call: async ({ page }) => {
      router.push(`/${page}`);
      return { navigated: page };
    },
  },
];

<MCPAgent provider="openai" model="gpt-4o-mini" apiKey={key} tools={tools} />
```

## The `MCPTool` shape

| Field | Description |
| --- | --- |
| `name` | Unique tool name (`A-Z a-z 0-9 _ -`). |
| `description` | When and why to use it. Same advice as for [endpoint descriptions](/docs/guides/describing-your-api). |
| `parameters` | Same format as endpoint parameters (without `in`). Omit or `{}` for no arguments. |
| `call` | `(args) => result`. May be `async`. |

## Return values and errors

- **Return anything JSON-serializable.** It is converted to text for the model, and cut at `maxToolResultChars`.
- **Throw to signal failure.** The message is returned to the model as an error so it can react. Nothing reaches your UI.
- Arguments are validated and type-converted **before** `call` runs, using your `parameters`, so you can trust them.

```tsx
call: async ({ sku }) => {
  const item = await inventory.find(sku);
  if (!item) throw new Error(`No product with SKU ${sku}`);   // the model sees this message
  return item;
}
```

## Mixing with `api`

`tools` and `api` work together. If a custom tool and an API endpoint share a name, **the custom tool wins**.

```tsx
<MCPAgent
  /* … */
  tools={[getCartTool, navigateTool]}
  api={{ baseURL: "/api", endpoints }}
/>
```

## Ideas

| Tool | Why it is useful |
| --- | --- |
| `get_current_user` | Lets the model personalise answers without an API call |
| `navigate` | “Take me to billing” becomes a router push |
| `open_modal` / `fill_form` | The chatbot operates your UI, not just your data |
| `search_docs` | Query a client-side search index (Algolia, Fuse.js) |
| SDK wrappers | Call Firebase, Supabase or Stripe.js from the browser, using the user&rsquo;s session |

> **Tip** `tools` are plain functions in your bundle. Keep the list in a module-level constant (or `useMemo`) so it is not rebuilt every render. The package copes either way, but a stable reference is cleaner.
