import { createRoot } from "react-dom/client";
import { useState } from "react";
import { MCPAgent, type ProviderName } from "react-mcp-chatbot";

const MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5",
  gemini: "gemini-2.5-flash",
  deepseek: "deepseek-chat",
  groq: "llama-3.3-70b-versatile",
  ollama: "llama3.1",
};

function App() {
  const [provider, setProvider] = useState<ProviderName>("openai");
  const [model, setModel] = useState(MODELS.openai);
  const [apiKey, setApiKey] = useState("");

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 560, margin: "40px auto", padding: 16 }}>
      <h1>react-mcp-chatbot demo</h1>
      <p>
        The chatbot below talks to a fake orders API (<code>/api/orders</code>, served by Vite).
        Try: <em>“Which orders are still processing?”</em> or <em>“Cancel order 1002”</em>.
      </p>

      <label>
        Provider{" "}
        <select
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value as ProviderName);
            setModel(MODELS[e.target.value] ?? "");
          }}
        >
          {Object.keys(MODELS).map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>{" "}
      <label>
        Model <input value={model} onChange={(e) => setModel(e.target.value)} />
      </label>
      <br />
      <br />
      <label>
        API key{" "}
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={provider === "ollama" ? "not needed" : "paste a key (stays in this tab)"}
          style={{ width: 300 }}
        />
      </label>

      <MCPAgent
        provider={provider}
        model={model}
        apiKey={apiKey}
        title="Orders Assistant"
        width={420}
        height={560}
        persist
        systemPrompt="You are the support assistant for an online shop. Be brief."
        // Writes need a click from the user:
        beforeToolCall={({ method, name, args }) =>
          method === "GET" || window.confirm(`Allow the assistant to run ${name}(${JSON.stringify(args)})?`)
        }
        api={{
          baseURL: "/api",
          endpoints: [
            {
              name: "list_orders",
              description: "List orders, optionally filtered by status",
              path: "/orders",
              parameters: {
                status: {
                  type: "string",
                  enum: ["processing", "shipped", "delivered", "cancelled"],
                  optional: true,
                },
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
          ],
        }}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
