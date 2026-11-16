import { createRoot } from "react-dom/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MCPAgent, type ApiEndpoint, type ProviderName } from "react-mcp-chatbot";
import "./styles.css";
import { installMockApi } from "./mockApi";

installMockApi(); // demo-only: fake backend in the browser

// ── The only thing the chatbot knows about the backend ─────────────────────
const endpoints: ApiEndpoint[] = [
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

const PROVIDERS: { id: ProviderName; label: string; model: string; keyless?: boolean; demo?: boolean }[] = [
  // Default: a simulated model that runs in the browser – no key, no cost (see mockLLM.ts)
  { id: "openai-compatible", label: "Demo mode · free", model: "rule-based-demo", keyless: true, demo: true },
  { id: "openai", label: "OpenAI", model: "gpt-4o-mini" },
  { id: "anthropic", label: "Anthropic", model: "claude-haiku-4-5" },
  { id: "gemini", label: "Gemini", model: "gemini-2.5-flash" },
  { id: "deepseek", label: "DeepSeek", model: "deepseek-chat" },
  { id: "groq", label: "Groq", model: "llama-3.3-70b-versatile" },
  { id: "ollama", label: "Ollama (local)", model: "llama3.1", keyless: true },
];

type Order = { id: string; customer: string; status: string; total: number };
type LogEntry = { id: number; method: string; url: string; ok: boolean; note: string };

function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [flash, setFlash] = useState<Set<string>>(new Set());
  const prev = useRef<Record<string, string>>({});

  const refresh = useCallback(async () => {
    const data: Order[] = await (await fetch("/api/orders")).json();
    const changed = new Set(data.filter((o) => prev.current[o.id] && prev.current[o.id] !== o.status).map((o) => o.id));
    prev.current = Object.fromEntries(data.map((o) => [o.id, o.status]));
    setOrders(data);
    setFlash(changed);
    if (changed.size) setTimeout(() => setFlash(new Set()), 1900);
  }, []);

  useEffect(() => void refresh(), [refresh]);
  return { orders, flash, refresh };
}

function CopyInstall() {
  const [done, setDone] = useState(false);
  const cmd = "npm install react-mcp-chatbot";
  return (
    <div className="install">
      <span className="mono">{cmd}</span>
      <button
        className="btn"
        onClick={() => {
          navigator.clipboard?.writeText(cmd);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
      >
        {done ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}

function App() {
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [model, setModel] = useState(PROVIDERS[0].model);
  const [apiKey, setApiKey] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  // live customizer
  const [theme, setTheme] = useState<"dark" | "light" | "auto">("dark");
  const [color, setColor] = useState("#7c5cff");
  const [title, setTitle] = useState("Orders Assistant");
  const [align, setAlign] = useState<"left" | "right">("right");
  const [radius, setRadius] = useState(20);
  const [avatar, setAvatar] = useState("🤖");
  const { orders, flash, refresh } = useOrders();
  const seq = useRef(0);

  const ready = provider.keyless || apiKey.trim().length > 0;

  return (
    <div className={`page ${align === "left" ? "chat-left" : ""}`}>
      <nav>
        <div className="logo"><i>🤖</i> react-mcp-chatbot</div>
        <div className="links">
          <a href="https://github.com/TigranZakharyan/react-mcp-chatbot" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://www.npmjs.com/package/react-mcp-chatbot" target="_blank" rel="noreferrer">npm</a>
        </div>
      </nav>

      <header className="hero">
        <span className="pill"><b /> No backend. No glue code. Just describe your API.</span>
        <h1>An AI chatbot that <span>operates your app</span> through your own APIs.</h1>
        <p className="sub">
          Describe your REST endpoints once. The model decides when to call them, <b>your user's browser</b> makes
          the requests, and answers come back as Markdown. History, system prompt and tool calling are all client-side.
        </p>
        <CopyInstall />
        <div className="cta">
          <a href="#try" style={{ textDecoration: "none" }}><button className="btn primary">Try it live ↓</button></a>
          <a href="https://github.com/TigranZakharyan/react-mcp-chatbot#readme" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <button className="btn">Read the docs</button>
          </a>
        </div>
      </header>

      <section>
        <div className="grid three">
          <div className="card step"><em>01</em><h3>Describe</h3><p>List endpoints with a name, a sentence and parameters. Or point at your OpenAPI spec.</p></div>
          <div className="card step"><em>02</em><h3>Ask</h3><p>Users chat in plain language. The model picks endpoints and fills in arguments.</p></div>
          <div className="card step"><em>03</em><h3>Done</h3><p>Calls run from the browser with your normal auth. Errors go back to the model to recover.</p></div>
        </div>
      </section>

      <section id="try">
        <h2>1 · Connect a model</h2>
        <p className="lead">
          Start with <b>Demo mode</b> – no key, no cost. For a real model, <b>Ollama</b> runs free on your machine, and
          providers like <b>Groq</b> and <b>Gemini</b> offer free tiers (limits change – check theirs). Your key stays in
          this tab's memory and is sent only to the provider you pick.
        </p>
        <div className="card">
          <div className="setup">
            <div className="full">
              <label>Provider</label>
              <div className="provs">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    className={`prov ${p.id === provider.id ? "on" : ""}`}
                    onClick={() => { setProvider(p); setModel(p.model); }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label>Model</label>
              <input className="field mono" value={model} disabled={provider.demo} onChange={(e) => setModel(e.target.value)} />
            </div>
            <div>
              <label>API key</label>
              <input
                className="field mono"
                type="password"
                value={apiKey}
                disabled={provider.keyless}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider.keyless ? "not needed" : "paste your key"}
                autoComplete="off"
              />
            </div>
          </div>
          <div className="hint">
            <span className={`dot ${ready ? "ok" : "wait"}`} />
            {ready
              ? "Ready – open the chat window."
              : "Paste an API key, or choose Ollama to run fully local."}
            {provider.demo && " Demo mode is a simulated model: simple rules, no AI, no key, no cost. It understands a few order questions."}
            {provider.id === "ollama" && " Requires Ollama running with a tool-capable model (OLLAMA_ORIGINS must allow this origin)."}
          </div>
        </div>
      </section>

      <section>
        <div className="bar">
          <div>
            <h2>2 · Your backend, live</h2>
            <p className="lead" style={{ margin: 0 }}>A fake orders API. Ask the chat to change something and watch the table.</p>
          </div>
          <button className="btn" onClick={async () => { await fetch("/api/reset", { method: "POST" }); setLog([]); refresh(); }}>
            Reset data
          </button>
        </div>
        <div className="card" style={{ padding: "18px 10px 8px" }}>
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Status</th><th className="num">Total</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className={flash.has(o.id) ? "flash" : ""}>
                  <td className="mono">#{o.id}</td>
                  <td>{o.customer}</td>
                  <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                  <td className="num">${o.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>3 · What the model just did</h2>
        <p className="lead">Every HTTP call the assistant makes on the user's behalf.</p>
        <div className="card log mono">
          {log.length === 0 && <div className="empty">No calls yet – try “Which orders are still processing?”</div>}
          {log.map((l) => (
            <div className="row" key={l.id}>
              <span className={`m ${l.method}`}>{l.method}</span>
              <span>{l.url}</span>
              <span className={`res ${l.ok ? "" : "err"}`}>{l.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>4 · Make it yours</h2>
        <p className="lead">Every option below is a prop. The chat updates live.</p>
        <div className="card">
          <div className="setup">
            <div>
              <label>Theme</label>
              <div className="provs">
                {(["dark", "light", "auto"] as const).map((x) => (
                  <button key={x} className={`prov ${theme === x ? "on" : ""}`} onClick={() => setTheme(x)}>{x}</button>
                ))}
              </div>
            </div>
            <div>
              <label>Position</label>
              <div className="provs">
                {(["left", "right"] as const).map((x) => (
                  <button key={x} className={`prov ${align === x ? "on" : ""}`} onClick={() => setAlign(x)}>{x}</button>
                ))}
              </div>
            </div>
            <div className="full">
              <label>Accent colour</label>
              <div className="provs">
                {["#7c5cff", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899"].map((c) => (
                  <button
                    key={c}
                    className={`swatch ${color === c ? "on" : ""}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    aria-label={`accent ${c}`}
                  />
                ))}
                <input type="color" className="swatch-input" value={color} onChange={(e) => setColor(e.target.value)} aria-label="custom colour" />
              </div>
            </div>
            <div>
              <label>Title</label>
              <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label>Avatar (emoji or image URL)</label>
              <input className="field" value={avatar} onChange={(e) => setAvatar(e.target.value)} />
            </div>
            <div className="full">
              <label>Corner radius · {radius}px</label>
              <input type="range" min={0} max={32} value={radius} onChange={(e) => setRadius(+e.target.value)} style={{ width: "100%", accentColor: color }} />
            </div>
          </div>
          <pre className="code" style={{ marginTop: 16 }}>
{"<"}<span className="f">MCPAgent</span>{"\n"}
{"  "}theme=<span className="s">"{theme}"</span> primaryColor=<span className="s">"{color}"</span>{"\n"}
{"  "}title=<span className="s">"{title}"</span> avatar=<span className="s">"{avatar}"</span>{"\n"}
{"  "}align=<span className="s">"{align}"</span> borderRadius={"{"}{radius}{"}"} <span className="c">/* + colors, fontFamily, suggestions… */</span>{"\n"}
{"/>"}
          </pre>
        </div>
      </section>

      <section>
        <h2>The entire integration</h2>
        <p className="lead">This is the code behind the chat on this page.</p>
        <pre className="code">
<span className="k">import</span> {"{ MCPAgent }"} <span className="k">from</span> <span className="s">"react-mcp-chatbot"</span>;{"\n\n"}
{"<"}<span className="f">MCPAgent</span>{"\n"}
{"  "}provider=<span className="s">"openai"</span> model=<span className="s">"gpt-4o-mini"</span> apiKey={"{key}"}{"\n"}
{"  "}systemPrompt=<span className="s">"You are the support assistant for an online shop. State only facts from the API results."</span>{"\n"}
{"  "}beforeToolCall={"{({ method }) => method === "}<span className="s">"GET"</span>{" || confirm("}<span className="s">"Allow?"</span>{")}"}{"\n"}
{"  "}api={"{{"}{"\n"}
{"    "}baseURL: <span className="s">"/api"</span>,{"\n"}
{"    "}endpoints: [{"\n"}
{"      "}{"{ "}name: <span className="s">"list_orders"</span>, description: <span className="s">"List orders by status"</span>, path: <span className="s">"/orders"</span> {"}"},{"\n"}
{"      "}{"{ "}name: <span className="s">"cancel_order"</span>, method: <span className="s">"POST"</span>, path: <span className="s">"/orders/{"{id}"}/cancel"</span>, <span className="c">/* … */</span> {"}"},{"\n"}
{"    "}],{"\n"}
{"  "}{"}}"}{"\n"}
{"/>"}
        </pre>
      </section>

      <section>
        <h2>Works with your model</h2>
        <p className="lead">One API, native tool calling for each provider.</p>
        <div className="chips">
          {["OpenAI", "Anthropic", "Gemini", "DeepSeek", "Groq", "Ollama", "OpenRouter", "Mistral", "xAI", "Together", "Any OpenAI-compatible"].map((p) => (
            <span className="chip" key={p}>{p}</span>
          ))}
        </div>
      </section>

      <footer>
        <span>MIT © Tigran Zakharyan</span>
        <span>⭐ If this saves you a backend, star it on <a href="https://github.com/TigranZakharyan/react-mcp-chatbot">GitHub</a></span>
      </footer>

      <MCPAgent
        key={provider.id /* fresh chat per provider */}
        provider={provider.id}
        providerURL={provider.demo ? "/mock-llm" : undefined}
        subtitle={provider.demo ? "Demo mode · simulated, no AI" : "Online"}
        model={model}
        apiKey={apiKey}
        title={title}
        avatar={avatar}
        theme={theme}
        align={align}
        borderRadius={radius}
        primaryColor={color}
        width={410}
        height={580}
        defaultOpen={window.innerWidth >= 900}
        persist
        suggestions={["Which orders are still processing?", "Cancel order 1002", "Total value of shipped orders?"]}
        systemPrompt="You are the support assistant for an online shop. Be brief and friendly. State only facts that appear in the API results; never promise refunds, emails or anything the API did not return."
        beforeToolCall={({ method, name, args }) =>
          method === "GET" || window.confirm(`Allow the assistant to run ${name}(${JSON.stringify(args)})?`)
        }
        onToolCall={({ name, args, error }) => {
          const ep = endpoints.find((e) => e.name === name)!;
          let url = ep.path;
          const rest: Record<string, string> = {};
          for (const [k, v] of Object.entries(args)) {
            if (url.includes(`{${k}}`)) url = url.replace(`{${k}}`, String(v));
            else rest[k] = String(v);
          }
          const qs = new URLSearchParams(rest).toString();
          setLog((l) => [
            { id: seq.current++, method: ep.method ?? "GET", url: `/api${url}${qs ? "?" + qs : ""}`, ok: !error, note: error ? "failed" : "200 OK" },
            ...l,
          ].slice(0, 6));
          refresh();
        }}
        api={{ baseURL: "/api", endpoints }}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
