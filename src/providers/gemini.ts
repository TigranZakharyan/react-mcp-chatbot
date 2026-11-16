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
  const out: { role: "user" | "model"; parts: any[] }[] = [];
  const push = (role: "user" | "model", part: any) => {
    const last = out[out.length - 1];
    if (last && last.role === role) last.parts.push(part);
    else out.push({ role, parts: [part] });
  };

  for (const m of messages) {
    if (m.role === "user") push("user", { text: m.content });
    else if (m.role === "tool")
      push("user", {
        functionResponse: { name: m.name, response: { result: tryParse(m.content) } },
      });
    else {
      if (m.content) push("model", { text: m.content });
      for (const c of m.toolCalls ?? []) {
        // `raw` is the original part incl. thought signatures, which Gemini 2.5+/3 requires back.
        push("model", c.raw ?? { functionCall: { name: c.name, args: c.args } });
      }
    }
  }
  return out;
}

function tryParse(s: string) {
  try {
    const v = JSON.parse(s);
    return v;
  } catch {
    return s;
  }
}

/** Gemini rejects some JSON-schema keywords; keep to the supported subset. */
function cleanSchema(s: any): any {
  if (Array.isArray(s)) return s.map(cleanSchema);
  if (!s || typeof s !== "object") return s;
  const allowed = ["type", "description", "enum", "items", "properties", "required", "format", "nullable"];
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(s)) {
    if (!allowed.includes(k)) continue;
    out[k] = k === "properties"
      ? Object.fromEntries(Object.entries(v as object).map(([pk, pv]) => [pk, cleanSchema(pv)]))
      : cleanSchema(v);
  }
  return out;
}

export class GeminiProvider implements Provider {
  constructor(private o: Options) {}

  async complete(req: ProviderRequest): Promise<ProviderResponse> {
    const model = this.o.model.startsWith("models/") ? this.o.model : `models/${this.o.model}`;

    const body: any = {
      contents: toWire(req.messages),
      generationConfig: { temperature: req.temperature ?? this.o.temperature ?? 0.2 },
    };
    if (req.system) body.systemInstruction = { parts: [{ text: req.system }] };
    if (req.tools.length) {
      body.tools = [
        {
          functionDeclarations: req.tools.map((t) => ({
            name: t.name,
            description: t.description,
            // Gemini errors on an empty `properties` object.
            ...(Object.keys(t.parameters.properties).length
              ? {
                  parameters: cleanSchema({
                    ...t.parameters,
                    required: t.parameters.required.length ? t.parameters.required : undefined,
                  }),
                }
              : {}),
          })),
        },
      ];
    }

    const data = await postJSON(
      `${this.o.baseURL.replace(/\/+$/, "")}/${model}:generateContent`,
      { "x-goog-api-key": this.o.apiKey ?? "", ...this.o.headers },
      body,
      req.signal
    );

    const cand = data.candidates?.[0];
    if (!cand) {
      throw new Error(data.promptFeedback?.blockReason
        ? `Blocked by Gemini: ${data.promptFeedback.blockReason}`
        : "Provider returned no candidates.");
    }

    const parts: any[] = cand.content?.parts ?? [];
    return {
      // skip "thought" summary parts
      content: parts.filter((p) => typeof p.text === "string" && !p.thought).map((p) => p.text).join(""),
      toolCalls: parts
        .filter((p) => p.functionCall)
        .map((p, i) => ({
          id: `call_${i}_${Date.now()}`,
          name: p.functionCall.name,
          args: p.functionCall.args ?? {},
          raw: p,
        })),
    };
  }
}
