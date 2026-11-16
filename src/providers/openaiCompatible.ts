import type { ChatMessage, Provider, ProviderRequest, ProviderResponse } from "../core/types";
import { parseArgs, postJSON } from "./http";

type Options = {
  baseURL: string;
  apiKey?: string;
  model: string;
  temperature?: number;
  headers?: Record<string, string>;
};

function toWire(system: string, messages: ChatMessage[]) {
  const out: any[] = [];
  if (system) out.push({ role: "system", content: system });

  for (const m of messages) {
    if (m.role === "user") out.push({ role: "user", content: m.content });
    else if (m.role === "tool")
      out.push({ role: "tool", tool_call_id: m.toolCallId, content: m.content });
    else {
      const msg: any = { role: "assistant", content: m.content || null };
      if (m.toolCalls?.length) {
        msg.tool_calls = m.toolCalls.map((c) => ({
          id: c.id,
          type: "function",
          function: { name: c.name, arguments: JSON.stringify(c.args) },
        }));
      }
      out.push(msg);
    }
  }
  return out;
}

/** Works with OpenAI, Groq, DeepSeek, Ollama (/v1), OpenRouter, Mistral, xAI, Together and any other OpenAI-style API. */
export class OpenAICompatibleProvider implements Provider {
  constructor(private o: Options) {}

  async complete(req: ProviderRequest): Promise<ProviderResponse> {
    const body: any = {
      model: this.o.model,
      messages: toWire(req.system, req.messages),
      temperature: req.temperature ?? this.o.temperature ?? 0.2,
    };
    if (req.tools.length) {
      body.tools = req.tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    }

    const headers: Record<string, string> = { ...this.o.headers };
    if (this.o.apiKey) headers.Authorization = `Bearer ${this.o.apiKey}`;

    const data = await postJSON(
      `${this.o.baseURL.replace(/\/+$/, "")}/chat/completions`,
      headers,
      body,
      req.signal
    );

    const msg = data.choices?.[0]?.message;
    if (!msg) throw new Error("Provider returned no message.");

    return {
      content: msg.content ?? "",
      toolCalls: (msg.tool_calls ?? []).map((c: any, i: number) => ({
        id: c.id ?? `call_${i}_${Date.now()}`,
        name: c.function?.name,
        args: parseArgs(c.function?.arguments),
      })),
    };
  }
}
