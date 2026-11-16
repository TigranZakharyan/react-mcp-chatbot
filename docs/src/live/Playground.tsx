import { useRef, useState } from "react";
import { MCPAgent, type MCPAgentHandle } from "react-mcp-chatbot";
import { useTheme } from "../lib/theme";
import { PROVIDERS, describeCall, endpoints, useOrders, type LogEntry } from "./shared";

/** Full interactive playground: pick a model, chat, watch the fake backend change. */
export function Playground() {
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [model, setModel] = useState(PROVIDERS[0].model);
  const [apiKey, setApiKey] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const { orders, flash, refresh } = useOrders();
  const seq = useRef(0);
  const agent = useRef<MCPAgentHandle>(null);
  const siteTheme = useTheme();
  const ready = provider.keyless || apiKey.trim().length > 0;

  return (
    <div className="playground">
      <div className="pg-grid">
        <div className="panel">
          <h3>1 · Choose a model</h3>
          <div className="chips-row">
            {PROVIDERS.map((p) => (
              <button
                key={p.id + p.label}
                className={`chip-btn ${p.label === provider.label ? "on" : ""}`}
                onClick={() => {
                  setProvider(p);
                  setModel(p.model);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="form-row">
            <label>
              Model
              <input value={model} disabled={provider.demo} onChange={(e) => setModel(e.target.value)} />
            </label>
            <label>
              API key
              <input
                type="password"
                autoComplete="off"
                value={apiKey}
                disabled={provider.keyless}
                placeholder={provider.keyless ? "not needed" : "paste your key"}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </label>
          </div>
          <p className="hint">
            <span className={`dot ${ready ? "ok" : "wait"}`} />
            {provider.demo
              ? "Demo mode is a simulated, rule-based model – no AI, no key, no cost."
              : ready
                ? "Requests go from your browser straight to the provider. The key never leaves this tab."
                : "Paste an API key, or use Demo mode / Ollama."}
          </p>
          <div className="row-actions">
            <button className="btn" onClick={() => agent.current?.open()}>
              Open chat
            </button>
            <button
              className="btn ghost"
              onClick={async () => {
                await fetch("/api/reset", { method: "POST" });
                setLog([]);
                agent.current?.clear();
                refresh();
              }}
            >
              Reset data &amp; chat
            </button>
          </div>
        </div>

        <div className="panel">
          <h3>2 · Your backend (live)</h3>
          <div className="table-wrap flush">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className={flash.has(o.id) ? "flash" : ""}>
                    <td className="mono muted">#{o.id}</td>
                    <td>{o.customer}</td>
                    <td>
                      <span className={`badge ${o.status}`}>{o.status}</span>
                    </td>
                    <td className="num">${o.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>3 · What the model just did</h3>
        <div className="log mono">
          {log.length === 0 && <div className="empty">No calls yet – try “Which orders are still processing?”</div>}
          {log.map((l) => (
            <div className="row" key={l.id}>
              <span className={`m ${l.method}`}>{l.method}</span>
              <span>{l.url}</span>
              <span className={`res ${l.ok ? "" : "err"}`}>{l.note}</span>
            </div>
          ))}
        </div>
      </div>

      <MCPAgent
        ref={agent}
        key={provider.label /* fresh conversation per provider */}
        provider={provider.id}
        providerURL={provider.demo ? "/mock-llm" : undefined}
        model={model}
        apiKey={apiKey}
        title="Orders Assistant"
        subtitle={provider.demo ? "Demo mode · simulated, no AI" : "Online"}
        theme={siteTheme}
        primaryColor="#7c5cff"
        width={410}
        height={580}
        defaultOpen={typeof window !== "undefined" && window.innerWidth >= 1240}
        suggestions={["Which orders are still processing?", "Cancel order 1002", "Total value of shipped orders?"]}
        systemPrompt="You are the support assistant for an online shop. Be brief and friendly. State only facts that appear in the API results; never promise refunds, emails or anything the API did not return."
        beforeToolCall={({ method, name, args }) =>
          method === "GET" || window.confirm(`Allow the assistant to run ${name}(${JSON.stringify(args)})?`)
        }
        onToolCall={({ name, args, error }) => {
          const { method, url } = describeCall(name, args);
          setLog((l) => [{ id: seq.current++, method, url, ok: !error, note: error ? "failed" : "200 OK" }, ...l].slice(0, 6));
          refresh();
        }}
        api={{ baseURL: "/api", endpoints }}
      />
    </div>
  );
}
