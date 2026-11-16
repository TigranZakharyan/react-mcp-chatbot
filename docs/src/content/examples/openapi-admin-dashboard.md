---
title: Admin dashboard from an OpenAPI spec
section: Examples
order: 2
description: Expose a curated slice of a large OpenAPI spec to the assistant and refine descriptions.
---

# Admin dashboard from an OpenAPI spec

You have an internal admin API with an OpenAPI document and many operations. You want an assistant for the **safe, useful subset**.

## 1. See what the spec contains

```tsx
import spec from "./openapi.json";
import { endpointsFromOpenAPI } from "react-mcp-chatbot";

console.table(
  endpointsFromOpenAPI(spec).map((e) => ({ name: e.name, method: e.method, path: e.path }))
);
```

This prints every operation with the tool name the package would use (your `operationId`).

## 2. Allow-list what the bot may use

```tsx
<MCPAgent
  provider="anthropic"
  model="claude-haiku-4-5"
  apiKey={key}
  title="Admin Copilot"
  systemPrompt="You help support staff look things up. Be precise and cite ids."
  api={{
    baseURL: "https://admin.acme.com/api",
    credentials: "include",                       // staff are signed in with a session cookie
    openapi: spec,
    include: ["listUsers", "getUser", "listInvoices", "getInvoice", "refundInvoice"],
  }}
  beforeToolCall={({ method, name, args }) =>
    method === "GET" || window.confirm(`Run ${name}?\n${JSON.stringify(args, null, 2)}`)
  }
/>
```

Only five tools are sent to the model, even if the spec has two hundred. That keeps requests small and answers accurate. Writes (`refundInvoice`) require confirmation.

## 3. Improve a weak description

If a spec says `summary: "Get"` for an operation, the model has little to go on. Override it with a hand-written endpoint of the same name. **Hand-written endpoints win on a name clash:**

```tsx
api={{
  baseURL: "https://admin.acme.com/api",
  openapi: spec,
  include: ["getUser", "listUsers", "refundInvoice"],
  endpoints: [
    {
      name: "getUser",
      description: "Look up a customer by id. Use this whenever the staff member mentions a user id like usr_123.",
      path: "/users/{id}",
      parameters: { id: { type: "string", description: "User id, starts with usr_" } },
    },
  ],
}}
```

(Better still: fix the description in the spec, which also improves your API docs.)

## 4. Try prompts like these

- *“Show me the last three invoices for usr_482.”* → `listInvoices` with a user filter
- *“Refund invoice inv_9921, it was charged twice.”* → asks for confirmation, then `refundInvoice`
- *“Who is usr_77 and what plan are they on?”* → `getUser`

## Tips

- **Load the spec from a URL** (`openapi: "https://…/openapi.json"`) to stay in sync automatically, or import the JSON for a build-time snapshot.
- Specs that use external `$ref` files must be bundled into one document first.
- The staff member&rsquo;s session cookie is used, so the backend still decides what they may see or change.
