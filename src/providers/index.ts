import type { Provider, ProviderConfig, ProviderName } from "../core/types";
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";
import { OpenAICompatibleProvider } from "./openaiCompatible";

/** Default base URLs. Override with `providerURL`. */
export const PROVIDER_URLS: Record<Exclude<ProviderName, "openai-compatible" | "ollama">, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  deepseek: "https://api.deepseek.com/v1",
  groq: "https://api.groq.com/openai/v1",
  openrouter: "https://openrouter.ai/api/v1",
  mistral: "https://api.mistral.ai/v1",
  xai: "https://api.x.ai/v1",
  together: "https://api.together.xyz/v1",
};

export function createProvider(cfg: ProviderConfig): Provider {
  const { provider, model, apiKey, temperature, headers } = cfg;
  const common = { model, apiKey, temperature, headers };

  switch (provider) {
    case "ollama": {
      // Ollama's OpenAI-compatible endpoint supports tool calling.
      const root = (cfg.providerURL ?? "http://localhost:11434").replace(/\/+$/, "");
      return new OpenAICompatibleProvider({ ...common, baseURL: root.endsWith("/v1") ? root : `${root}/v1` });
    }
    case "openai-compatible":
      if (!cfg.providerURL) throw new Error('provider "openai-compatible" requires providerURL.');
      return new OpenAICompatibleProvider({ ...common, baseURL: cfg.providerURL });
    case "anthropic":
      return new AnthropicProvider({ ...common, baseURL: cfg.providerURL ?? PROVIDER_URLS.anthropic });
    case "gemini":
      return new GeminiProvider({ ...common, baseURL: cfg.providerURL ?? PROVIDER_URLS.gemini });
    default: {
      const baseURL = cfg.providerURL ?? PROVIDER_URLS[provider];
      if (!baseURL) throw new Error(`Unknown provider "${provider}".`);
      return new OpenAICompatibleProvider({ ...common, baseURL });
    }
  }
}

export { OpenAICompatibleProvider, AnthropicProvider, GeminiProvider };
