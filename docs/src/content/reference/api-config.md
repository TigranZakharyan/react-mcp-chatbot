---
title: API & tool config
section: Reference
order: 3
description: Types for ApiConfig, ApiEndpoint, ApiParameter and MCPTool.
---

# API &amp; tool config

```ts
import type { ApiConfig, ApiEndpoint, ApiParameter, MCPTool, MCPToolParameter } from "react-mcp-chatbot";
```

## `ApiConfig`

```ts
type ApiConfig = {
  baseURL: string;
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  credentials?: RequestCredentials;
  endpoints?: ApiEndpoint[];
  openapi?: string | Record<string, any>;
  include?: string[];
  exclude?: string[];
  maxResponseChars?: number;
};
```

| Field | Default | Description |
| --- | --- | --- |
| `baseURL` | required | Absolute or relative base for every endpoint |
| `headers` | none | Sent with every request. A function is evaluated on each request |
| `credentials` | `fetch` default | e.g. `"include"` for cookies |
| `endpoints` | none | Hand-described endpoints |
| `openapi` | none | OpenAPI/Swagger document or URL. Every operation becomes a tool |
| `include` / `exclude` | none | Filter OpenAPI operations by tool name |
| `maxResponseChars` | `8000` | Cut plain-text responses beyond this length |

Guide: [Describing your API](/docs/guides/describing-your-api), [OpenAPI import](/docs/guides/openapi-import).

## `ApiEndpoint`

```ts
type ApiEndpoint = {
  name: string;
  description: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";   // default "GET"
  path: string;                                            // may contain {placeholders}
  parameters?: Record<string, ApiParameter>;
  headers?: Record<string, string>;
};
```

## `ApiParameter`

```ts
type ApiParameter = MCPToolParameter & {
  in?: "path" | "query" | "body" | "header";
};

type MCPToolParameter = {
  type: "string" | "number" | "integer" | "boolean" | "object" | "array";
  description?: string;
  optional?: boolean;                       // required unless true
  enum?: (string | number)[];
  items?: Record<string, unknown>;          // array: JSON-schema of items
  properties?: Record<string, unknown>;     // object: JSON-schema properties
};
```

| Option | Description |
| --- | --- |
| `type` | JSON type of the value |
| `description` | What to put here. Include formats and examples |
| `optional` | Not required |
| `enum` | Allowed values |
| `items`, `properties` | Nested schema for `array` and `object` |
| `in` | Request location. Default: `path` if `{name}` is in the path, else `query` for GET/DELETE and `body` for POST/PUT/PATCH |

## `MCPTool`

```ts
type MCPTool<TArgs = any> = {
  name: string;
  description: string;
  parameters?: Record<string, MCPToolParameter>;
  call: (args: TArgs) => Promise<any> | any;
};
```

Guide: [Custom tools](/docs/guides/custom-tools).

## Generated tool descriptions

For tools generated from `api`, the package appends the HTTP method and path to your description so the model sees, for example:

```
Cancel an order that has not been delivered. (POST /orders/{id}/cancel)
```
