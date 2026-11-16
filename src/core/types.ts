// ─────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────

export type ToolParameterType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array";

export type MCPToolParameter = {
  type: ToolParameterType;
  description?: string;
  /** Parameters are required unless `optional: true`. */
  optional?: boolean;
  enum?: (string | number)[];
  /** For `array` parameters: JSON-schema of the items. */
  items?: Record<string, unknown>;
  /** For `object` parameters: JSON-schema properties. */
  properties?: Record<string, unknown>;
};

export type MCPTool<TArgs = any> = {
  name: string;
  description: string;
  parameters?: Record<string, MCPToolParameter>;
  call: (args: TArgs) => Promise<any> | any;
};

/** JSON-schema flavoured description of a tool, as sent to providers. */
export type ToolSpec = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, Record<string, unknown>>;
    required: string[];
  };
};

// ─────────────────────────────────────────────
// Backend API description (declarative tools)
// ─────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiParameter = MCPToolParameter & {
  /**
   * Where the value goes in the HTTP request.
   * Default: `path` if `{name}` appears in the path, otherwise `query` for
   * GET/DELETE and `body` for POST/PUT/PATCH.
   */
  in?: "path" | "query" | "body" | "header";
};

export type ApiEndpoint = {
  /** Tool name shown to the model, e.g. `get_order`. */
  name: string;
  /** What the endpoint does. This is what the model reads – be specific. */
  description: string;
  method?: HttpMethod;
  /** Path relative to `baseURL`, may contain `{placeholders}`. */
  path: string;
  parameters?: Record<string, ApiParameter>;
  /** Extra headers for this endpoint only. */
  headers?: Record<string, string>;
};

type HeadersInput =
  | Record<string, string>
  | (() => Record<string, string> | Promise<Record<string, string>>);

export type ApiConfig = {
  /** e.g. `https://api.myapp.com` or `/api` */
  baseURL: string;
  /** Static headers or a function (use it for auth tokens that can change). */
  headers?: HeadersInput;
  /** Pass `"include"` to send cookies to your backend. */
  credentials?: RequestCredentials;
  /** Hand-described endpoints. */
  endpoints?: ApiEndpoint[];
  /**
   * An OpenAPI 3 / Swagger 2 document (object) or a URL to one.
   * Every operation becomes a tool automatically.
   */
  openapi?: string | Record<string, any>;
  /** With `openapi`: only expose these operations (by tool name). */
  include?: string[];
  /** With `openapi`: hide these operations (by tool name). */
  exclude?: string[];
  /** Max characters of an API response given back to the model. Default 8000. */
  maxResponseChars?: number;
};

// ─────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────

export type ToolCall = {
  id: string;
  name: string;
  args: Record<string, any>;
  /** Provider-specific payload that must be echoed back (e.g. Gemini thought signatures). */
  raw?: unknown;
};

export type ChatMessage =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "assistant";
      content: string;
      toolCalls?: ToolCall[];
      /** UI-only error bubble. Never sent to the model. */
      error?: boolean;
    }
  | {
      id: string;
      role: "tool";
      toolCallId: string;
      name: string;
      content: string;
    };

// ─────────────────────────────────────────────
// Providers
// ─────────────────────────────────────────────

export type ProviderRequest = {
  system: string;
  messages: ChatMessage[];
  tools: ToolSpec[];
  temperature?: number;
  signal?: AbortSignal;
};

export type ProviderResponse = {
  content: string;
  toolCalls: ToolCall[];
};

export interface Provider {
  complete(req: ProviderRequest): Promise<ProviderResponse>;
}

export type ProviderName =
  | "openai"
  | "anthropic"
  | "gemini"
  | "deepseek"
  | "groq"
  | "ollama"
  | "openrouter"
  | "mistral"
  | "xai"
  | "together"
  | "openai-compatible";

export type ProviderConfig = {
  provider: ProviderName;
  model: string;
  /** Required for hosted providers. Note: it is visible to your users – see README. */
  apiKey?: string;
  /**
   * Override the API base URL. Point it at your own proxy to keep the key off
   * the client. Required for `openai-compatible`; defaults to
   * `http://localhost:11434` for `ollama`.
   */
  providerURL?: string;
  temperature?: number;
  /** Extra headers sent to the provider. */
  headers?: Record<string, string>;
};

// ─────────────────────────────────────────────
// Engine
// ─────────────────────────────────────────────

export const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant embedded in a web application.

- Use the available tools to look up real data or perform actions whenever the user's request needs them. Never invent data that a tool could provide.
- If a tool fails, read the error, fix the arguments and retry when it makes sense; otherwise explain the problem briefly.
- Ask a short clarifying question when a required value is missing.
- Reply in clean Markdown (lists, tables, **bold** for key values). Do not mention tool names or HTTP details unless asked.`;

export type ChatConfig = ProviderConfig & {
  /** Instructions that shape the assistant. Replaces the default prompt. */
  systemPrompt?: string;
  /** Custom JS tools. */
  tools?: MCPTool[];
  /** Describe your backend and the endpoints become tools automatically. */
  api?: ApiConfig;
  /** Save history to localStorage. `true` uses the default key; a string sets the key. Default false. */
  persist?: boolean | string;
  /** Messages sent to the model per request (older ones stay visible but are dropped). Default 40. */
  maxHistoryMessages?: number;
  /** Max tool-calling round trips per user message. Default 8. */
  maxToolRounds?: number;
  /** Max characters of a tool result given to the model. Default 8000. */
  maxToolResultChars?: number;
  /**
   * Called before every tool runs. Return `false` to block it – handy for
   * asking the user to confirm POST/PUT/DELETE calls.
   */
  beforeToolCall?: (call: {
    name: string;
    args: Record<string, any>;
    /** HTTP method for tools generated from `api`, otherwise undefined. */
    method?: HttpMethod;
  }) => boolean | Promise<boolean>;
  onToolCall?: (call: { name: string; args: Record<string, any>; result: unknown; error?: string }) => void;
  onError?: (error: Error) => void;
};

export type ChatState = {
  messages: ChatMessage[];
  loading: boolean;
  /** Human-readable progress, e.g. "Calling get_order…". */
  status: string | null;
};
