import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatEngine } from "../src/core/engine";
import { endpointsFromOpenAPI } from "../src/core/tools";

type Call = { url: string; init: any; body: any };
let calls: Call[];
let script: any[];

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  calls = [];
  script = [];
  vi.stubGlobal("fetch", async (url: string, init: any = {}) => {
    calls.push({ url: String(url), init, body: init.body ? JSON.parse(init.body) : null });
    if (String(url).startsWith("https://backend.test")) {
      if (String(url).includes("/orders/42")) return json({ id: 42, total: 99 });
      if (String(url).endsWith("/orders") && init.method === "POST") return json({ created: true });
      return json({ message: "nope" }, 404);
    }
    return json(script.shift());
  });
});

const api = {
  baseURL: "https://backend.test/",
  headers: () => ({ Authorization: "Bearer T" }),
  endpoints: [
    {
      name: "get_order",
      description: "Get an order",
      path: "/orders/{id}",
      parameters: { id: { type: "integer" as const }, verbose: { type: "boolean" as const, optional: true } },
    },
    {
      name: "create_order",
      description: "Create",
      method: "POST" as const,
      path: "/orders",
      parameters: { item: { type: "string" as const } },
    },
  ],
};

const toolCall = (id: string, name: string, args: unknown) => ({
  choices: [{ message: { tool_calls: [{ id, function: { name, arguments: JSON.stringify(args) } }] } }],
});
const text = (content: string) => ({ choices: [{ message: { content } }] });
const providerCalls = (host: string) => calls.filter((c) => c.url.includes(host));

describe("tool-calling loop", () => {
  it("calls the described API with path/query args and auth headers, then answers", async () => {
    script = [toolCall("c1", "get_order", { id: "42", verbose: true }), text("Order 42 total is 99")];
    const e = new ChatEngine({ provider: "openai", model: "m", apiKey: "k", api, systemPrompt: "SYS" });
    await e.send("order 42?");

    const backend = calls.find((c) => c.url.startsWith("https://backend.test/orders/42"))!;
    expect(backend.url).toBe("https://backend.test/orders/42?verbose=true");
    expect(backend.init.headers.Authorization).toBe("Bearer T");

    const [first, second] = providerCalls("openai.com");
    expect(first.body.messages[0]).toEqual({ role: "system", content: "SYS" });
    expect(first.body.tools[0].function.parameters.required).toEqual(["id"]);
    expect(second.body.messages.map((m: any) => m.role)).toEqual(["system", "user", "assistant", "tool"]);
    expect(e.getState().messages.at(-1)).toMatchObject({ role: "assistant", content: "Order 42 total is 99" });
    expect(e.getState().loading).toBe(false);
  });

  it("returns tool errors to the model instead of throwing, and sends POST bodies", async () => {
    script = [
      {
        choices: [{ message: { tool_calls: [
          { id: "a", function: { name: "get_order", arguments: '{"id":7}' } },
          { id: "b", function: { name: "create_order", arguments: '{"item":"x"}' } },
        ] } }],
      },
      text("done"),
    ];
    const e = new ChatEngine({ provider: "openai", model: "m", apiKey: "k", api });
    await e.send("go");
    const tools = e.getState().messages.filter((m) => m.role === "tool") as any[];
    expect(tools[0].content).toMatch(/HTTP 404/);
    expect(tools[1].content).toBe('{"created":true}');
    expect(calls.find((c) => c.url.startsWith("https://backend.test") && c.init.method === "POST")!.body).toEqual({ item: "x" });
  });

  it("blocks a tool when beforeToolCall returns false", async () => {
    script = [toolCall("a", "create_order", { item: "x" }), text("ok")];
    const e = new ChatEngine({ provider: "openai", model: "m", apiKey: "k", api, beforeToolCall: () => false });
    await e.send("go");
    expect(calls.some((c) => c.url.startsWith("https://backend.test"))).toBe(false);
    expect((e.getState().messages.find((m) => m.role === "tool") as any).content).toMatch(/declined/);
  });

  it("withholds tools after maxToolRounds to force a final answer", async () => {
    script = [...Array(3).fill(toolCall("z", "get_order", { id: 42 })), text("gave up")];
    const e = new ChatEngine({ provider: "openai", model: "m", apiKey: "k", api, maxToolRounds: 3 });
    await e.send("loop");
    expect(e.getState().messages.at(-1)).toMatchObject({ content: "gave up" });
    expect(providerCalls("openai.com").at(-1)!.body.tools).toBeUndefined();
  });
});

describe("history", () => {
  it("is sent with later requests and wiped by clear()", async () => {
    script = [text("one"), text("two")];
    const e = new ChatEngine({ provider: "openai", model: "m", apiKey: "k" });
    await e.send("a");
    await e.send("b");
    expect(providerCalls("openai.com")[1].body.messages.map((m: any) => m.content)).toEqual([
      expect.any(String), "a", "one", "b",
    ]);
    e.clear();
    expect(e.getState().messages).toEqual([]);
  });

  it("windows at a user-turn boundary and never sends UI error bubbles", async () => {
    script = [text("1"), text("2"), text("3")];
    const e = new ChatEngine({ provider: "openai", model: "m", apiKey: "k", maxHistoryMessages: 3 });
    await e.send("a");
    await e.send("b");
    await e.send("c");
    const sent = providerCalls("openai.com")[2].body.messages.slice(1);
    expect(sent[0].role).toBe("user");
    expect(sent.length).toBeLessThanOrEqual(3);
  });

  it("surfaces provider errors as a bubble and keeps state valid", async () => {
    vi.stubGlobal("fetch", async () => json({ error: { message: "bad key" } }, 401));
    const onError = vi.fn();
    const e = new ChatEngine({ provider: "openai", model: "m", apiKey: "k", onError });
    await e.send("hi");
    const last = e.getState().messages.at(-1) as any;
    expect(last.error).toBe(true);
    expect(last.content).toMatch(/bad key/);
    expect(e.getState().loading).toBe(false);
    expect(onError).toHaveBeenCalled();
  });
});

describe("providers", () => {
  it("anthropic: tool_result blocks and browser-access header", async () => {
    script = [{ content: [{ type: "tool_use", id: "t1", name: "get_order", input: { id: 42 } }] }, { content: [{ type: "text", text: "ok" }] }];
    const e = new ChatEngine({ provider: "anthropic", model: "c", apiKey: "k", api, systemPrompt: "S" });
    await e.send("x");
    const last = providerCalls("anthropic.com").at(-1)!;
    expect(last.body.messages[2].content[0].type).toBe("tool_result");
    expect(last.body.system).toBe("S");
    expect(last.init.headers["anthropic-dangerous-direct-browser-access"]).toBe("true");
  });

  it("gemini: header auth and thought signatures echoed back", async () => {
    script = [
      { candidates: [{ content: { parts: [{ functionCall: { name: "get_order", args: { id: 42 } }, thoughtSignature: "SIG" }] } }] },
      { candidates: [{ content: { parts: [{ text: "ok" }] } }] },
    ];
    const e = new ChatEngine({ provider: "gemini", model: "gemini-2.5-flash", apiKey: "K", api });
    await e.send("x");
    const last = providerCalls("googleapis")[1];
    expect(last.init.headers["x-goog-api-key"]).toBe("K");
    expect(last.body.contents[1].parts[0].thoughtSignature).toBe("SIG");
    expect(last.body.contents[2].parts[0].functionResponse.response.result.total).toBe(99);
  });

  it("ollama uses the OpenAI-compatible /v1 endpoint", async () => {
    script = [text("hi")];
    await new ChatEngine({ provider: "ollama", model: "llama3.1" }).send("x");
    expect(calls[0].url).toBe("http://localhost:11434/v1/chat/completions");
  });
});

describe("OpenAPI import", () => {
  const spec = {
    openapi: "3.0.0",
    paths: {
      "/pets/{petId}": { get: { operationId: "getPet", summary: "Get pet", parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }] } },
      "/pets": { post: { operationId: "addPet", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Pet" } } } } } },
    },
    components: { schemas: { Pet: { type: "object", required: ["name"], properties: { name: { type: "string" }, age: { type: "integer" } } } } },
  };

  it("turns operations into tools, resolving $refs and honouring exclude", async () => {
    script = [text("ok")];
    const e = new ChatEngine({ provider: "groq", model: "m", apiKey: "k", api: { baseURL: "https://backend.test", openapi: spec, exclude: ["getPet"] } });
    await e.send("x");
    const tools = providerCalls("groq.com")[0].body.tools;
    expect(tools.map((t: any) => t.function.name)).toEqual(["addPet"]);
    expect(tools[0].function.parameters.required).toEqual(["name"]);
  });

  it("generates unique, provider-safe tool names", () => {
    const eps = endpointsFromOpenAPI({ paths: { "/a/{id}": { get: {}, delete: {} } } });
    expect(eps.map((e) => e.name)).toEqual(["get_a_id", "delete_a_id"]);
  });
});
