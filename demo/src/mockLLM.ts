// "Demo mode": a tiny rule-based stand-in for a language model, so the live demo works with no
// API key and no cost. It speaks the OpenAI chat-completions wire format, so the real
// react-mcp-chatbot code (adapter, tool-calling loop, history) runs unchanged against it.
//
// It is NOT an AI: it only understands a handful of order questions. Use a real provider
// (OpenAI, Gemini, Groq, Ollama…) for open-ended conversation.

type Msg = { role: string; content?: string | null; tool_calls?: any[]; name?: string };

const call = (name: string, args: Record<string, unknown>) => ({
  role: "assistant",
  content: null,
  tool_calls: [
    {
      id: `call_${Math.random().toString(36).slice(2, 9)}`,
      type: "function",
      function: { name, arguments: JSON.stringify(args) },
    },
  ],
});
const say = (content: string) => ({ role: "assistant", content });

const STATUSES = ["processing", "shipped", "delivered", "cancelled"];
const money = (n: number) => `$${n.toFixed(2)}`;
const table = (orders: any[]) =>
  "| Order | Customer | Status | Total |\n| --- | --- | --- | ---: |\n" +
  orders.map((o) => `| #${o.id} | ${o.customer} | ${o.status} | ${money(o.total)} |`).join("\n");

const HELP =
  "I'm the **demo-mode assistant** – a small rule-based stand-in, not a real AI. Try:\n\n" +
  "- *Which orders are still processing?*\n- *Cancel order 1002*\n- *What is the status of order 1003?*\n" +
  "- *Total value of shipped orders?*\n\nPick a real provider above for open-ended chat.";

function decide(messages: Msg[]) {
  const last = messages[messages.length - 1];
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const q = lastUser.toLowerCase();

  // ── second step: turn the tool result into a reply ──
  if (last.role === "tool") {
    const asked = [...messages].reverse().find((m) => m.role === "assistant" && m.tool_calls)?.tool_calls?.[0]
      ?.function;
    const name = asked?.name;
    const args = asked ? JSON.parse(asked.arguments || "{}") : {};
    let data: any;
    try {
      data = JSON.parse(last.content ?? "null");
    } catch {
      data = last.content;
    }

    if (data?.error) {
      const e = String(data.error);
      if (/declined/i.test(e)) return say("Okay – I didn't do that. Nothing was changed.");
      if (/404/.test(e)) return say(`I couldn't find order **#${args.id}**.`);
      if (/409/.test(e)) return say(`I can't cancel order **#${args.id}** – it has already been delivered.`);
      return say(`That didn't work: ${e}`);
    }
    if (name === "cancel_order") return say(`Order **#${data.id}** (${data.customer}) is now **${data.status}**.`);
    if (name === "get_order")
      return say(`Order **#${data.id}** – ${data.customer} · **${data.status}** · ${money(data.total)}.`);
    if (name === "list_orders" && Array.isArray(data)) {
      if (!data.length) return say("No orders match that.");
      const sum = /total|sum|worth|value|how much/.test(q);
      const head = sum
        ? `The ${data.length} ${args.status ?? ""} order${data.length > 1 ? "s" : ""} add up to **${money(
            data.reduce((s: number, o: any) => s + o.total, 0)
          )}**.`
        : `${data.length} order${data.length > 1 ? "s" : ""}${args.status ? ` ${args.status}` : ""}:`;
      return say(`${head}\n\n${table(data)}`);
    }
    return say("Done.");
  }

  // ── first step: pick a tool from the user's words ──
  const id = q.match(/\b(\d{4})\b/)?.[1];
  const status = STATUSES.find((s) => q.includes(s));

  if (/\bcancel\b/.test(q) && id) return call("cancel_order", { id });
  if (id) return call("get_order", { id });
  if (status || /order|list|all|show/.test(q)) return call("list_orders", status ? { status } : {});
  return say(HELP);
}

export async function mockChatCompletion(body: { messages: Msg[] }) {
  await new Promise((r) => setTimeout(r, 450)); // feels like a model thinking
  const message = decide(body.messages.filter((m) => m.role !== "system"));
  return { id: "demo", object: "chat.completion", choices: [{ index: 0, message, finish_reason: "stop" }] };
}
