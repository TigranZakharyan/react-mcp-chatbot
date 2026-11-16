---
title: Free local model with Ollama
section: Examples
order: 4
description: Run the chatbot against a model on your own machine. No API key, no cost, no data leaves your computer.
---

# Free local model with Ollama

[Ollama](https://ollama.com) runs open models on your computer. It is the easiest way to try the package for free, and also the most private option.

## 1. Install Ollama and pull a model

```bash
ollama pull llama3.1
```

Pick a model that supports **tool calling**. `llama3.1` is a good start. Very small models may choose the wrong tool or invent details, so keep your [system prompt](/docs/guides/system-prompt-and-history) strict.

Check it is running:

```bash
curl http://localhost:11434/api/tags
```

## 2. Point the component at it

```tsx
<MCPAgent
  provider="ollama"
  model="llama3.1"
  // providerURL="http://localhost:11434"   // default, only set it if yours differs
  systemPrompt="Be brief. State only facts that appear in the API results."
  api={{ baseURL: "/api", endpoints }}
/>
```

No `apiKey`. The package uses Ollama&rsquo;s OpenAI-compatible endpoint (`/v1`) automatically.

## 3. Allow your app&rsquo;s origin (CORS)

Ollama accepts browser requests from `localhost` origins by default, so `npm run dev` works out of the box. For a **deployed** site, tell Ollama which origin may call it by setting the `OLLAMA_ORIGINS` environment variable, then restart Ollama:

```bash
OLLAMA_ORIGINS="https://my-app.example.com" ollama serve
```

> **Note** An HTTPS page calling an `http://localhost` server can be blocked by browser mixed-content rules depending on the browser. For a public demo, share the app over a local dev server instead, or expose Ollama over HTTPS.

## What you can do with it

- Develop and test your tool descriptions offline and for free.
- Build internal tools where data must never leave the machine or network.
- Demonstrate the package without anyone needing an account.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Failed to fetch` | Ollama is not running, or the origin is not allowed. Check `OLLAMA_ORIGINS` |
| The model never calls tools | Use a tool-capable model, and improve tool descriptions |
| Wrong tool or invented values | Add `enum`s, tighten the prompt, or use a larger model |
| Slow replies | Smaller models are faster. First request loads the model into memory |

More in [Troubleshooting](/docs/help/troubleshooting).
