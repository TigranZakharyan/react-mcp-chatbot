import { useState } from "react";
import { Link } from "react-router-dom";
import { CodeBlock } from "../components/CodeBlock";
import { NPM, REPO } from "../components/Topbar";

const HERO_CODE = `import { MCPAgent } from "react-mcp-chatbot";

<MCPAgent
  provider="openai" model="gpt-4o-mini" apiKey={key}
  systemPrompt="You are the support assistant for Acme."
  api={{
    baseURL: "https://api.acme.com",
    headers: () => ({ Authorization: \`Bearer \${getToken()}\` }),
    endpoints: [
      { name: "get_order", description: "Look up an order",
        path: "/orders/{id}",
        parameters: { id: { type: "string" } } },
      { name: "cancel_order", description: "Cancel an order",
        method: "POST", path: "/orders/{id}/cancel",
        parameters: { id: { type: "string" } } },
    ],
  }}
/>`;

const FEATURES = [
  { icon: "🧩", title: "No backend needed", text: "The tool-calling loop, history and system prompt all run in the browser. There is no chat server to build, host or secure." },
  { icon: "📝", title: "Describe or import", text: "List endpoints with a name, a sentence and parameters, or point at your OpenAPI / Swagger spec and every operation becomes a tool." },
  { icon: "🔧", title: "Native tool calling", text: "Uses each provider's real function calling. The model can chain several calls, and API errors go back to it so it can recover." },
  { icon: "🔌", title: "10+ providers", text: "OpenAI, Anthropic, Gemini, DeepSeek, Groq, Ollama, OpenRouter, Mistral, xAI, Together, or any OpenAI-compatible URL." },
  { icon: "💬", title: "History you control", text: "Conversation history lives client-side with windowing, optional localStorage persistence and a one-click Clear." },
  { icon: "🛡️", title: "Guardrails built in", text: "Confirm or block any call with beforeToolCall, include / exclude OpenAPI operations, cap tool rounds, truncate big responses." },
  { icon: "🎨", title: "Fully themeable", text: "Light, dark or auto; override every colour token, font, avatar, icons, size and position. Or go headless with useChat." },
  { icon: "🔐", title: "Your user's own auth", text: "Calls are plain fetch from the browser, so your existing cookies, tokens, CORS and permissions apply unchanged." },
  { icon: "📦", title: "Typed and tiny", text: "TypeScript types included, ESM + CommonJS builds, two runtime dependencies (react-markdown and remark-gfm)." },
];

const PROVIDERS = ["OpenAI", "Anthropic", "Gemini", "DeepSeek", "Groq", "Ollama", "OpenRouter", "Mistral", "xAI", "Together", "Any OpenAI-compatible"];

function Install() {
  const [done, setDone] = useState(false);
  const cmd = "npm install react-mcp-chatbot";
  return (
    <div className="install">
      <code>
        <span className="prompt">$</span> {cmd}
      </code>
      <button
        className="btn small"
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

function Flow() {
  return (
    <div className="flow" role="img" aria-label="Diagram: the user's browser runs the chatbot, asks the model which API to call, then calls your API directly">
      <div className="flow-node">
        <b>User</b>
        <span>“Cancel order 1002”</span>
      </div>
      <div className="flow-arrow">→</div>
      <div className="flow-node accent">
        <b>Browser</b>
        <span>react-mcp-chatbot</span>
        <small>history · prompt · tool loop</small>
      </div>
      <div className="flow-col">
        <div className="flow-link">
          <span>① which tool?</span>
          <i>⇄</i>
          <div className="flow-node small">
            <b>LLM provider</b>
            <small>OpenAI · Gemini · Ollama …</small>
          </div>
        </div>
        <div className="flow-link">
          <span>② call it</span>
          <i>⇄</i>
          <div className="flow-node small">
            <b>Your API</b>
            <small>existing REST endpoints</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Home() {
  return (
    <div className="home">
      <section className="hero">
        <span className="pill">
          <b /> No backend. No glue code. Just describe your API.
        </span>
        <h1>
          An AI chatbot that <span className="grad">operates your app</span> through your own APIs.
        </h1>
        <p className="sub">
          Describe your REST endpoints once. The model decides when to call them, <strong>your user&rsquo;s browser</strong> makes the
          requests, and answers come back as Markdown. History, system prompt and tool calling are all client-side.
        </p>
        <Install />
        <div className="cta">
          <Link className="btn primary" to="/docs/getting-started/quick-start">
            Get started →
          </Link>
          <Link className="btn" to="/playground">
            Try the live playground
          </Link>
          <a className="btn ghost" href={REPO} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
        <div className="hero-shot">
          <img src="/demo.gif" alt="The chatbot lists processing orders, asks permission, cancels order 1002, and the orders table updates" loading="lazy" />
        </div>
      </section>

      <section className="block">
        <h2>How it works</h2>
        <p className="lead">The chatbot lives in your frontend. The only servers involved are the model provider and the API you already have.</p>
        <Flow />
      </section>

      <section className="block two">
        <div>
          <h2>The whole integration</h2>
          <p className="lead">
            Give it a model and a description of your endpoints. Everything else, including the tool-calling loop, argument filling,
            error recovery and history, is handled for you.
          </p>
          <ul className="ticks">
            <li>Parameters go to the path, query, header or JSON body automatically.</li>
            <li>
              Already have an OpenAPI spec? Use <code className="inline-code">api.openapi</code> instead of listing endpoints.
            </li>
            <li>Write calls can require a user confirmation with one hook.</li>
          </ul>
          <Link className="btn" to="/docs/guides/describing-your-api">
            Read the guide →
          </Link>
        </div>
        <CodeBlock code={HERO_CODE} lang="tsx" />
      </section>

      <section className="block">
        <h2>Everything you need, nothing you don&rsquo;t</h2>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <h2>Works with your model</h2>
        <p className="lead">One configuration, native function calling for each provider. Switch models by changing two props.</p>
        <div className="chips-row big">
          {PROVIDERS.map((p) => (
            <span className="chip" key={p}>
              {p}
            </span>
          ))}
        </div>
        <p className="muted small-note">
          Prefer not to pay? <Link to="/docs/guides/providers#free-and-local-options">Free and local options →</Link>
        </p>
      </section>

      <section className="block">
        <h2>Is it the right tool?</h2>
        <div className="fit-grid">
          <div className="fit good">
            <h3>✅ Great fit</h3>
            <ul>
              <li>Admin panels and internal tools</li>
              <li>SaaS dashboards with an existing REST API</li>
              <li>Prototypes and demos</li>
              <li>Local-first apps with Ollama</li>
              <li>Apps where the API already enforces permissions per user</li>
            </ul>
          </div>
          <div className="fit bad">
            <h3>⚠️ Think twice</h3>
            <ul>
              <li>Public apps where the model API key must stay secret (use a thin proxy)</li>
              <li>Business logic that must never be exposed to the browser</li>
              <li>APIs with no per-user authorization</li>
            </ul>
            <Link to="/docs/guides/security">Read the security guide →</Link>
          </div>
        </div>
      </section>

      <section className="block cta-band">
        <h2>Add it in five minutes</h2>
        <p className="lead">Install, describe two endpoints, ask a question.</p>
        <Install />
        <div className="cta center">
          <Link className="btn primary" to="/docs/getting-started/installation">
            Read the docs
          </Link>
          <a className="btn" href={NPM} target="_blank" rel="noreferrer">
            View on npm
          </a>
        </div>
      </section>
    </div>
  );
}
