# Changelog

All notable changes are documented here. This project follows [Semantic Versioning](https://semver.org/).

## 1.0.0

First stable release. Public API (`MCPAgent`, `useChat`, `ChatEngine`, config types) is now covered by semantic versioning.

### Added
- `ChatEngine`: provider-neutral core with a native tool-calling loop, client-side history, system prompt and `clear()`.
- Declarative backend description via `api` (`baseURL`, `headers`, `endpoints`) – endpoints become tools automatically.
- OpenAPI / Swagger import via `api.openapi`.
- Providers: Anthropic, OpenRouter, Mistral, xAI, Together and any OpenAI-compatible endpoint, alongside OpenAI, Gemini, DeepSeek, Groq and Ollama.
- `useChat` headless hook, `ref` handle (`clear`, `send`, `stop`), Clear button, `persist` option.
- `beforeToolCall` / `onToolCall` / `onError` hooks, `maxToolRounds`, `maxHistoryMessages`, `maxToolResultChars`.
- CommonJS build, test suite, CI, `LICENSE`, `defaultOpen` and `suggestions` props.
- Live demo (GitHub Pages) with an in-browser mock backend: see `demo/`.

### Changed (breaking)
- Tool selection now uses each provider's native function calling instead of a prompt-based two-step flow.
- Removed the exported `Agent` class and `MARKDOWN_SYSTEM_PROMPT`; the default system prompt no longer restricts answers to tool output.
- Gemini API key is sent in the `x-goog-api-key` header instead of the URL.

### Fixed
- Chat window no longer overflows narrow (phone) viewports.
- `require()` previously pointed at an ES module.
- The send icon is inlined, so bundlers no longer have to resolve a separate `.svg` asset.

## 0.0.6
- DeepSeek support.
