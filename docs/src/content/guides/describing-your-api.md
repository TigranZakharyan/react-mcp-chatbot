---
title: Describing your API
section: Guides
order: 1
description: Turn REST endpoints into tools: paths, parameters, headers, and how responses and errors are handled.
---

# Describing your API

The `api` prop is the heart of the package. You describe your backend once, and every endpoint becomes a tool the model can call.

```tsx
<MCPAgent
  /* provider, model, apiKey… */
  api={{
    baseURL: "https://api.acme.com",
    headers: () => ({ Authorization: `Bearer ${getToken()}` }),
    credentials: "include",
    endpoints: [ /* see below */ ],
  }}
/>
```

## The `api` object

| Field | Type | Description |
| --- | --- | --- |
| `baseURL` | `string` | Required. Absolute (`https://api.acme.com`) or relative (`/api`). A trailing slash is fine. |
| `endpoints` | `ApiEndpoint[]` | Hand-described endpoints. |
| `openapi` | `string \| object` | An OpenAPI/Swagger document or URL. See [OpenAPI import](/docs/guides/openapi-import). |
| `include` / `exclude` | `string[]` | With `openapi`: only expose / hide these operations (by tool name). |
| `headers` | `object \| () => object \| Promise<object>` | Sent with every request. Use a function for tokens that change. |
| `credentials` | `RequestCredentials` | Pass `"include"` to send cookies to your backend. |
| `maxResponseChars` | `number` | Plain-text responses longer than this are cut. Default `8000`. |

## Describing an endpoint

```tsx
{
  name: "search_products",
  description: "Search the product catalogue by keyword and optional max price",
  method: "GET",                        // default GET
  path: "/products",
  parameters: {
    q:        { type: "string",  description: "Search keywords" },
    maxPrice: { type: "number",  description: "Upper price limit", optional: true },
    sort:     { type: "string",  enum: ["price", "rating"], optional: true },
  },
}
```

| Field | Description |
| --- | --- |
| `name` | The tool name the model sees. Use `snake_case`, letters, digits, `_` and `-` only (providers reject other characters). |
| `description` | **The most important field.** Say what the endpoint does and when to use it. The package appends `(GET /products)` automatically. |
| `method` | `GET` (default), `POST`, `PUT`, `PATCH` or `DELETE`. |
| `path` | Relative to `baseURL`. May contain `{placeholders}` filled from parameters. |
| `parameters` | The arguments the model may provide. See below. |
| `headers` | Extra headers for this endpoint only. |

> **Tip** Write descriptions for a smart colleague who has never seen your API: *“Cancel an order that has not been delivered. Fails with 409 if it already shipped.”* beats *“cancel order”*.

## Parameters

```tsx
parameters: {
  id:    { type: "string", description: "Order id, e.g. 1001" },   // required
  limit: { type: "integer", optional: true },                       // optional
}
```

Every parameter is **required unless you set `optional: true`**.

| Option | Description |
| --- | --- |
| `type` | `string`, `number`, `integer`, `boolean`, `object` or `array` |
| `description` | Tells the model what to put here. Include formats and examples. |
| `optional` | Not required. Omitted when the model leaves it out. |
| `enum` | Restrict to a fixed list of values. Models follow this well. |
| `items` | For `array`: a JSON-schema for the items, e.g. `{ type: "string" }`. |
| `properties` | For `object`: JSON-schema properties. |
| `in` | Where the value goes in the request. See next section. |

### Where does each parameter go?

If you do not set `in`, the package decides:

1. If `{name}` appears in the path, it goes into the **path** (URL-encoded).
2. Otherwise `GET` and `DELETE` put it in the **query string**.
3. Otherwise (`POST`, `PUT`, `PATCH`) it goes into the **JSON body**.

Override with `in: "path" | "query" | "body" | "header"`:

```tsx
{
  name: "update_order",
  description: "Update the shipping address of an order",
  method: "PATCH",
  path: "/orders/{id}",
  parameters: {
    id:      { type: "string" },                         // → path
    address: { type: "string" },                         // → JSON body
    notify:  { type: "boolean", in: "query", optional: true },   // → ?notify=true
    traceId: { type: "string", in: "header", optional: true },   // → request header
  },
}
```

Details:

- Arrays in the query are sent as repeated keys: `?tag=a&tag=b`. Objects are JSON-stringified.
- A body is sent only for non-`GET` requests, with `Content-Type: application/json`.
- Models sometimes send numbers as strings. Values are **converted** to the declared type before the call; if conversion is impossible the model gets an error and can retry.
- A missing required argument is not sent to your API at all. The model is told what is missing.

## Headers and authentication

Headers are merged in this order, later wins: `Accept: application/json` → `api.headers` → endpoint `headers` → parameters with `in: "header"`.

```tsx
api={{
  baseURL: "https://api.acme.com",
  headers: async () => ({ Authorization: `Bearer ${await auth.getAccessToken()}` }),
}}
```

The function runs **on every request**, so refreshed tokens are always used. More patterns in [Authentication](/docs/guides/authentication).

## What the model gets back

| Your API returns | The model receives |
| --- | --- |
| 2xx with JSON | The parsed JSON |
| 2xx with plain text | The text, cut at `maxResponseChars` |
| 2xx with an empty body | `{ "status": 204, "ok": true }` |
| 4xx / 5xx | An error: `HTTP 404 Not Found: <first 500 characters of the body>` |
| Network / CORS failure | An error message |

Whatever the model receives is also capped by `maxToolResultChars` (default 8000), so a huge list cannot blow up the context window. **Prefer endpoints that return small, focused results** (pagination, filters) over “return everything” endpoints.

## Design tips

- **Fewer, sharper tools beat many vague ones.** Every tool costs tokens on every request.
- **Add `enum`s** for fields like status, so the model cannot invent values.
- **Describe failures** (“returns 409 if already shipped”) so the model explains them well.
- **Keep dangerous endpoints out**, or guard them with [`beforeToolCall`](/docs/guides/guardrails).
- **Return useful errors** from your API. The text goes straight to the model.

## Complete example

```tsx
const api = {
  baseURL: "/api",
  credentials: "include" as const,
  endpoints: [
    {
      name: "list_orders",
      description: "List the signed-in user's orders, newest first. Optionally filter by status.",
      path: "/orders",
      parameters: {
        status: { type: "string", enum: ["processing", "shipped", "delivered", "cancelled"], optional: true },
        limit:  { type: "integer", description: "Max results, default 10", optional: true },
      },
    },
    {
      name: "get_order",
      description: "Get one order including its line items",
      path: "/orders/{id}",
      parameters: { id: { type: "string" } },
    },
    {
      name: "cancel_order",
      description: "Cancel an order that has not been delivered. Returns 409 if it was already delivered.",
      method: "POST",
      path: "/orders/{id}/cancel",
      parameters: { id: { type: "string" }, reason: { type: "string", optional: true } },
    },
  ],
};
```
