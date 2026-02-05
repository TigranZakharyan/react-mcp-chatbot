<p align="center">
  <a href="https://www.npmjs.com/package/react-mcp-chatbot">
    <img src="https://img.shields.io/npm/v/react-mcp-chatbot" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/react-mcp-chatbot">
    <img src="https://img.shields.io/npm/dm/react-mcp-chatbot" alt="npm downloads" />
  </a>
  <a href="https://github.com/TigranZakharyan/react-mcp-chatbot/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/react-mcp-chatbot" alt="license" />
  </a>
  <a href="https://github.com/TigranZakharyan/react-mcp-chatbot/stargazers">
    <img
      src="https://img.shields.io/github/stars/TigranZakharyan/react-mcp-chatbot?style=flat"
      alt="GitHub stars"
    />
  </a>
</p>

<h1 align="center">🤖 React MCP Chatbot</h1>

<p align="center">
  <strong>AI-powered React chatbot with intelligent API tool calling</strong>
</p>

<p align="center">
  A production-ready chat widget that understands user intent, selects the correct API,
  executes it, and responds with clean Markdown-formatted answers.
</p>

<hr />

<h2>✨ What is React MCP Chatbot?</h2>

<p>
  <strong>React MCP Chatbot</strong> is a customizable AI chatbot component that connects
  <strong>natural language user requests</strong> to <strong>real API calls</strong>
  using an LLM-powered agent.
</p>

<p>
  Instead of writing complex conditional logic, you simply define
  <strong>tools (API functions)</strong> —
  the AI automatically decides <strong>when and how</strong> to call them.
</p>

<p>
  This makes it ideal for <strong>real-world, data-driven AI applications</strong>.
</p>

<hr />

<h2>🎥 Demo</h2>

<p>
  Example: user asks a question → AI decides → API is called → formatted response
</p>

<p align="center">
  <img src="./assets/demo.gif" alt="React MCP Chatbot Demo" width="800" />
</p>

<hr />

<h2>🚀 Features</h2>

<ul>
  <li>🤖 AI-driven tool selection</li>
  <li>🔌 Pluggable API tools</li>
  <li>🧠 LLM-powered intent detection</li>
  <li>🧩 Fully typed (TypeScript)</li>
  <li>🎨 Modern floating chat UI</li>
  <li>🌗 Dark & Light themes</li>
  <li>📐 Highly customizable</li>
  <li>📝 Markdown responses (tables, lists, code)</li>
  <li>⚡ Ollama / Groq / OpenAI</li>
  <li>🛠 Optional & validated tool parameters</li>
</ul>

<hr />

<h2>🧠 How It Works</h2>

<pre><code>
User Message
     ↓
LLM analyzes intent
     ↓
Tool decision (or no tool)
     ↓
API function executed
     ↓
Markdown-formatted response
</code></pre>

<hr />

<h2>📦 Installation</h2>

<pre><code>npm install react-mcp-chatbot</code></pre>

<p>or</p>

<pre><code>yarn add react-mcp-chatbot</code></pre>

<hr />

<h2>⚡ Quick Start</h2>

<pre><code>import { MCPAgent } from "react-mcp-chatbot";

&lt;MCPAgent
  provider="ollama" // or "groq"
  providerURL="http://localhost:11434"
  model="llama3"
  tools={tools}
/&gt;
</code></pre>

<hr />

<h2>🛠 Defining API Tools</h2>

<pre><code>import type { MCPTool } from "react-mcp-chatbot";

const weatherTool: MCPTool = {
  name: "get_weather",
  description: "Get current weather for a city",
  parameters: {
    city: {
      type: "string",
      description: "City name",
    },
    units: {
      type: "string",
      optional: true,
      description: "metric or imperial",
    },
  },
  call: async ({ city, units }) =&gt; {
    const res = await fetch(
      `https://api.example.com/weather?q=${city}&units=${units ?? "metric"}`
    );
    return res.json();
  },
};
</code></pre>

<hr />

<h2>🎨 UI Customization</h2>

<pre><code>&lt;MCPAgent
  title="Support Assistant"
  align="right"
  theme="dark"
  width={420}
  height={640}
  primaryColor="#6366f1"
  borderRadius={20}
  placeholder="Ask me anything…"
/&gt;
</code></pre>

<hr />

<h2>🧭 Use Cases</h2>

<ul>
  <li>AI customer support bots</li>
  <li>Internal admin dashboards</li>
  <li>API copilots</li>
  <li>SaaS onboarding assistants</li>
  <li>Analytics chatbots</li>
  <li>Developer tools</li>
  <li>Portfolio projects</li>
</ul>

<hr />

<h2>📜 License</h2>

<p>
  MIT © <a href="https://github.com/TigranZakharyan">Tigran Zakharyan</a>
</p>

<hr />

<h2>⭐ Star the Project</h2>

<p>
  If this project helped you or inspired you, please consider giving it a star ⭐<br />
  It helps a lot and motivates further development.
</p>
