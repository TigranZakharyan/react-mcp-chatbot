import type { ChatMessage, Provider, ProviderRequest, ProviderResponse } from "../core/types";
import { postJSON } from "./http";

type Options = {
  baseURL: string;
  apiKey?: string;
  model: string;
  temperature?: number;
  headers?: Record<string, string>;
};

function toWire(messages: ChatMessage[]) {
  const out: { role: "user" | "assistant"; content: any[] }[] = [];
  const push = (role: "user" | "assistant", block: any) => {
    const last = out[out.length - 1];
    // Anthropic wants alternating turns; tool results of one round share a user turn.
    if (last && last.role === role) last.content.push(block);
    else out.push({ role, content: [block] });
  };

  for (const m of messages) {
    if (m.role === "user") push("user", { type: "text", text: m.content });
    else if (m.role === "tool")
      push("user", { type: "tool_result", tool_use_id: m.toolCallId, content: m.content });
    else {
      if (m.content) push("assistant", { type: "text", text: m.content });
      for (const c of m.toolCalls ?? [])
        push("assistant", { type: "tool_use", id: c.id, name: c.name, input: c.args });
    }
  }
  return out;
}

export class AnthropicProvider implements Provider {
  constructor(private o: Options) {}

  async complete(req: ProviderRequest): Promise<ProviderResponse> {
    const body: any = {
      model: this.o.model,
      max_tokens: 4096,
      system: req.system || undefined,
      messages: toWire(req.messages),
      temperature: req.temperature ?? this.o.temperature ?? 0.2,
    };
    if (req.tools.length) {
      body.tools = req.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    const data = await postJSON(
      `${this.o.baseURL.replace(/\/+$/, "")}/v1/messages`,
      {
        "x-api-key": this.o.apiKey ?? "",
        "anthropic-version": "2023-06-01",
        // Required by Anthropic for calls made straight from a browser.
        "anthropic-dangerous-direct-browser-access": "true",
        ...this.o.headers,
      },
      body,
      req.signal
    );

    const blocks: any[] = data.content ?? [];
    return {
      content: blocks.filter((b) => b.type === "text").map((b) => b.text).join(""),
      toolCalls: blocks
        .filter((b) => b.type === "tool_use")
        .map((b) => ({ id: b.id, name: b.name, args: b.input ?? {} })),
    };
  }
}
