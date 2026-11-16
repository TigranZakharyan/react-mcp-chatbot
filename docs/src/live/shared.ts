import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiEndpoint, ProviderName } from "react-mcp-chatbot";

/** The only thing the demo chatbot knows about the (fake, in-browser) backend. */
export const endpoints: ApiEndpoint[] = [
  {
    name: "list_orders",
    description: "List orders, optionally filtered by status",
    path: "/orders",
    parameters: {
      status: { type: "string", enum: ["processing", "shipped", "delivered", "cancelled"], optional: true },
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
    description: "Cancel an order that has not been delivered",
    method: "POST",
    path: "/orders/{id}/cancel",
    parameters: { id: { type: "string" } },
  },
];

export type ProviderChoice = {
  id: ProviderName;
  label: string;
  model: string;
  keyless?: boolean;
  demo?: boolean;
};

export const PROVIDERS: ProviderChoice[] = [
  { id: "openai-compatible", label: "Demo mode · free", model: "rule-based-demo", keyless: true, demo: true },
  { id: "openai", label: "OpenAI", model: "gpt-4o-mini" },
  { id: "anthropic", label: "Anthropic", model: "claude-haiku-4-5" },
  { id: "gemini", label: "Gemini", model: "gemini-2.5-flash" },
  { id: "deepseek", label: "DeepSeek", model: "deepseek-chat" },
  { id: "groq", label: "Groq", model: "llama-3.3-70b-versatile" },
  { id: "ollama", label: "Ollama (local)", model: "llama3.1", keyless: true },
];

export type Order = { id: string; customer: string; status: string; total: number };
export type LogEntry = { id: number; method: string; url: string; ok: boolean; note: string };

/** Live view of the fake orders API; rows flash when a status changes. */
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [flash, setFlash] = useState<Set<string>>(new Set());
  const prev = useRef<Record<string, string>>({});

  const refresh = useCallback(async () => {
    const data: Order[] = await (await fetch("/api/orders")).json();
    const changed = new Set(
      data.filter((o) => prev.current[o.id] && prev.current[o.id] !== o.status).map((o) => o.id)
    );
    prev.current = Object.fromEntries(data.map((o) => [o.id, o.status]));
    setOrders(data);
    setFlash(changed);
    if (changed.size) setTimeout(() => setFlash(new Set()), 1900);
  }, []);

  useEffect(() => void refresh(), [refresh]);
  return { orders, flash, refresh };
}

/** Turn a tool call into the HTTP request it caused (for the activity log). */
export function describeCall(name: string, args: Record<string, unknown>) {
  const ep = endpoints.find((e) => e.name === name);
  if (!ep) return { method: "GET", url: name };
  let url = ep.path;
  const rest: Record<string, string> = {};
  for (const [k, v] of Object.entries(args)) {
    if (url.includes(`{${k}}`)) url = url.replace(`{${k}}`, String(v));
    else rest[k] = String(v);
  }
  const qs = new URLSearchParams(rest).toString();
  return { method: ep.method ?? "GET", url: `/api${url}${qs ? "?" + qs : ""}` };
}
