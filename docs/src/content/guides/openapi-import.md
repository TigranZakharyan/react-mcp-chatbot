---
title: OpenAPI import
section: Guides
order: 2
description: Generate tools automatically from an OpenAPI 3 or Swagger 2 document.
---

# OpenAPI import

If you already have an OpenAPI (Swagger) document, you do not need to describe endpoints by hand. Point `api.openapi` at it and every operation becomes a tool.

```tsx
<MCPAgent
  provider="gemini" model="gemini-2.5-flash" apiKey={key}
  api={{
    baseURL: "https://api.acme.com",
    openapi: "https://api.acme.com/openapi.json",   // a URL…
    exclude: ["deleteUser", "adminResetPassword"],   // …and hide what the bot must not touch
  }}
/>
```

`openapi` accepts either a **URL** (fetched once, with `api.credentials` applied) or the **document itself** as an object, for example from a bundled JSON file:

```tsx
import spec from "./openapi.json";

api={{ baseURL: "/api", openapi: spec, include: ["listProducts", "getProduct"] }}
```

## How operations become tools

| OpenAPI | Tool |
| --- | --- |
| `operationId` | Tool name. If missing, one is generated from the method and path (`get_orders_id`). Characters outside `A-Z a-z 0-9 _ -` are replaced; names are cut to 64 characters and de-duplicated. |
| `summary` + `description` | Tool description |
| `parameters` in `path`, `query`, `header` | Parameters in the same location. Path parameters are always required. |
| JSON `requestBody` whose schema is an object | Each top-level property becomes a body parameter, with its `required` flag |
| JSON `requestBody` of another type | A single `body` parameter |
| `enum`, `items`, nested `properties`, `description` | Carried over |

Supported methods are `GET`, `POST`, `PUT`, `PATCH` and `DELETE`. Local `$ref` references (`#/components/schemas/...`) are resolved; circular references are cut off safely. Swagger 2 documents (inline parameter types and `in: body`) are understood too.

> **Note** The server URL is not read from the spec. You always provide `baseURL`, so the same spec works against staging, production or a proxy.

## Choose what to expose

Real specs have dozens or hundreds of operations. Every tool is sent to the model with every request, so exposing too many hurts accuracy and costs tokens.

```tsx
api={{ baseURL, openapi: spec, include: ["listOrders", "getOrder", "cancelOrder"] }}  // allow-list
api={{ baseURL, openapi: spec, exclude: ["deleteAccount"] }}                            // block-list
```

Use `include` for anything user-facing. Names are the **tool names** (usually your `operationId`s).

## Mix with hand-written endpoints

Hand-written `endpoints` and `openapi` can be combined. On a name clash the hand-written endpoint wins, which lets you override a poorly worded generated description:

```tsx
api={{
  baseURL,
  openapi: spec,
  endpoints: [
    { name: "getOrder", description: "Look up an order. Use this whenever the user mentions an order number.", path: "/orders/{id}", parameters: { id: { type: "string" } } },
  ],
}}
```

## Inspect what was generated

`endpointsFromOpenAPI` is exported if you want to see (or post-process) the endpoints:

```tsx
import { endpointsFromOpenAPI } from "react-mcp-chatbot";

const endpoints = endpointsFromOpenAPI(spec);
console.table(endpoints.map((e) => ({ name: e.name, method: e.method, path: e.path })));
```

Then pass the (possibly edited) list as `endpoints` instead of `openapi`.

## Good to know

- The document is loaded **lazily on the first message** and cached until the `api` configuration changes. A failed load is retried on the next message.
- Spec-driven descriptions are only as good as the spec. If answers are poor, improve the `summary`/`description` fields in your spec. It helps your API docs too.
- Cross-file `$ref`s (`other.json#/...`) are not resolved. Bundle your spec into one document first.
