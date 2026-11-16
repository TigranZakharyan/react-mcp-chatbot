---
title: E-commerce order assistant
section: Examples
order: 1
description: A complete support bot that looks up and cancels orders, with confirmation, suggestions and a tuned prompt.
---

# E-commerce order assistant

A complete, realistic setup: a support chatbot for an online shop that can list orders, look one up and cancel it. This is the same scenario as the [live playground](/playground).

## The backend contract

Your API already looks something like this:

| Request | Returns |
| --- | --- |
| `GET /orders?status=processing` | `[{ "id": "1002", "customer": "Alan Turing", "status": "processing", "total": 54.0 }, …]` |
| `GET /orders/1002` | `{ "id": "1002", … }` or `404` |
| `POST /orders/1002/cancel` | the updated order, or `409 {"error":"already delivered"}` |

## The component

```tsx
import { MCPAgent } from "react-mcp-chatbot";

const endpoints = [
  {
    name: "list_orders",
    description: "List orders, optionally filtered by status",
    path: "/orders",
    parameters: {
      status: {
        type: "string",
        enum: ["processing", "shipped", "delivered", "cancelled"],
        optional: true,
      },
    },
  },
  {
    name: "get_order",
    description: "Get one order by id",
    path: "/orders/{id}",
    parameters: { id: { type: "string", description: "Order id, e.g. 1001" } },
  },
  {
    name: "cancel_order",
    description: "Cancel an order that has not been delivered. Returns 409 if already delivered.",
    method: "POST",
    path: "/orders/{id}/cancel",
    parameters: { id: { type: "string" } },
  },
];

export function SupportBot() {
  return (
    <MCPAgent
      provider="openai"
      model="gpt-4o-mini"
      apiKey={import.meta.env.VITE_OPENAI_KEY}

      title="Orders Assistant"
      primaryColor="#7c5cff"
      suggestions={["Which orders are still processing?", "Cancel order 1002"]}
      systemPrompt="You are the support assistant for an online shop. Be brief and friendly. State only facts that appear in the API results; never promise refunds, emails or anything the API did not return."

      api={{
        baseURL: "/api",
        headers: () => ({ Authorization: `Bearer ${getToken()}` }),
        endpoints,
      }}

      // writes need a click from the user
      beforeToolCall={({ method, name, args }) =>
        method === "GET" || window.confirm(`Allow: ${name}(${JSON.stringify(args)})?`)
      }
    />
  );
}
```

## What a conversation looks like

> **User:** Which orders are still processing?
>
> *The model calls `list_orders` with `{ "status": "processing" }`.*
>
> **Assistant:** Two orders are processing: **#1002** (Alan Turing, $54.00) and **#1004** (Linus Torvalds, $89.50).

> **User:** Cancel 1002.
>
> *The user is asked to confirm `cancel_order({"id":"1002"})`, then the call runs.*
>
> **Assistant:** Order #1002 is now **cancelled**.

> **User:** Cancel 1003.
>
> *The API answers `409 already delivered`. The error goes back to the model.*
>
> **Assistant:** I can&rsquo;t cancel order #1003 because it has already been delivered.

## Why the system prompt has that last sentence

Small or local models sometimes embellish: after a cancellation they may add *“you will receive a refund within 3 days”* even though nothing in the API said so. A single instruction such as *“state only facts that appear in the API results”* removes most of that. See [System prompt &amp; history](/docs/guides/system-prompt-and-history).

## Variations

- **Read-only bot:** `beforeToolCall={({ method }) => method === "GET"}`, or simply do not describe `cancel_order`.
- **Show an activity feed:** use `onToolCall` to display each request. This is what the playground does.
- **Refresh your UI after a change:** call your data-fetching refresh inside `onToolCall`, so the page updates when the bot changes something.
- **Spec-driven:** swap the `endpoints` array for [`openapi` + `include`](/docs/examples/openapi-admin-dashboard).
