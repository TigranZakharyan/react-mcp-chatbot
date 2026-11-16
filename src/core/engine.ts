import { createProvider } from "../providers";
import { buildApiTools, prepareArgs, toToolSpec, type RuntimeTool } from "./tools";
import {
  DEFAULT_SYSTEM_PROMPT,
  type ChatConfig,
  type ChatMessage,
  type ChatState,
  type Provider,
  type ToolCall,
} from "./types";

const DEFAULT_KEY = "react-mcp-chatbot:history";

let counter = 0;
const uid = () => `m_${Date.now().toString(36)}_${(counter++).toString(36)}`;

/**
 * Framework-agnostic chat core: history, system prompt, tool-calling loop.
 * Everything runs in the browser.
 */
export class ChatEngine {
  private cfg: ChatConfig;
  private provider: Provider;
  private providerSig = "";
  private state: ChatState = { messages: [], loading: false, status: null };
  private listeners = new Set<() => void>();
  private abortCtl: AbortController | null = null;
  private apiTools: Promise<RuntimeTool[]> | null = null;
  private apiSig = "";

  constructor(config: ChatConfig) {
    this.cfg = config;
    this.provider = this.makeProvider();
    this.state.messages = this.load();
  }

  // ── config ──────────────────────────────────

  /** Update config without losing history. Safe to call on every render. */
  configure(config: ChatConfig) {
    const prevKey = this.storageKey();
    this.cfg = config;

    const sig = this.sigOf();
    if (sig !== this.providerSig) this.provider = this.makeProvider();

    // API tools only need rebuilding when the described API changes.
    const aSig = JSON.stringify(config.api ?? null, (_k, v) => (typeof v === "function" ? "fn" : v));
    if (aSig !== this.apiSig) {
      this.apiSig = aSig;
      this.apiTools = null;
    }

    if (this.storageKey() !== prevKey) {
      this.state = { ...this.state, messages: this.load() };
      this.emit();
    }
  }

  private sigOf() {
    const { provider, model, apiKey, providerURL, temperature, headers } = this.cfg;
    return JSON.stringify([provider, model, apiKey, providerURL, temperature, headers]);
  }

  private makeProvider() {
    this.providerSig = this.sigOf();
    return createProvider(this.cfg);
  }

  // ── state / subscription ────────────────────

  getState = (): ChatState => this.state;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  private set(patch: Partial<ChatState>) {
    this.state = { ...this.state, ...patch };
    if (patch.messages) this.save();
    this.emit();
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  // ── persistence ─────────────────────────────

  private storageKey(): string | null {
    const p = this.cfg.persist;
    if (!p) return null;
    return typeof p === "string" ? p : DEFAULT_KEY;
  }

  private load(): ChatMessage[] {
    const key = this.storageKey();
    if (!key || typeof localStorage === "undefined") return [];
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private save() {
    const key = this.storageKey();
    if (!key || typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(this.state.messages));
    } catch {
      /* quota exceeded or storage blocked – history just stays in memory */
    }
  }

  // ── public actions ──────────────────────────

  /** Wipe the conversation (and the saved copy). Also cancels a request in flight. */
  clear() {
    this.abort();
    const key = this.storageKey();
    if (key && typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    this.set({ messages: [], loading: false, status: null });
  }

  abort() {
    this.abortCtl?.abort();
  }

  async send(text: string): Promise<void> {
    const content = text.trim();
    if (!content || this.state.loading) return;

    const ctl = new AbortController();
    this.abortCtl = ctl;

    const base = this.state.messages;
    this.set({
      messages: [...base, { id: uid(), role: "user", content }],
      loading: true,
      status: null,
    });

    try {
      await this.run(ctl.signal);
    } catch (e) {
      if (ctl.signal.aborted) {
        // Cancelled: drop any half-finished tool round. (After clear() the list is already empty.)
        if (this.abortCtl === ctl) {
          this.set({ messages: this.state.messages.slice(0, this.lastIndexOf("user") + 1) });
        }
      } else {
        const err = e instanceof Error ? e : new Error(String(e));
        this.cfg.onError?.(err);
        // Drop half-finished tool rounds so history stays valid, keep the user message.
        const lastUser = this.lastIndexOf("user");
        this.set({
          messages: [
            ...this.state.messages.slice(0, lastUser + 1),
            { id: uid(), role: "assistant", content: `⚠️ **Error:** ${err.message}`, error: true },
          ],
        });
      }
    } finally {
      // A newer request may have started after clear(); only the owner resets state.
      if (this.abortCtl === ctl) {
        this.abortCtl = null;
        this.set({ loading: false, status: null });
      }
    }
  }

  // ── core loop ───────────────────────────────

  private lastIndexOf(role: ChatMessage["role"]) {
    const m = this.state.messages;
    for (let i = m.length - 1; i >= 0; i--) if (m[i].role === role) return i;
    return -1;
  }

  private async getTools(): Promise<RuntimeTool[]> {
    const custom = (this.cfg.tools ?? []) as RuntimeTool[];
    let api: RuntimeTool[] = [];
    if (this.cfg.api) {
      const pending = (this.apiTools ??= buildApiTools(this.cfg.api, () => this.cfg.api!));
      try {
        api = await pending;
      } catch (e) {
        this.apiTools = null; // allow retry on next message
        throw e;
      }
    }
    // custom tools win on name clash
    const names = new Set(custom.map((t) => t.name));
    return [...custom, ...api.filter((t) => !names.has(t.name))];
  }

  /** Messages sent to the model: no UI-only errors, windowed to maxHistoryMessages at a turn boundary. */
  private requestMessages(): ChatMessage[] {
    const all = this.state.messages.filter((m) => !(m.role === "assistant" && m.error));
    const max = this.cfg.maxHistoryMessages ?? 40;
    if (all.length <= max) return all;

    let start = all.length - max;
    // never start in the middle of a tool exchange
    while (start < all.length && all[start].role !== "user") start++;
    return start < all.length ? all.slice(start) : all.slice(-1);
  }

  private async run(signal: AbortSignal) {
    const tools = await this.getTools();
    const specs = tools.map(toToolSpec);
    const system = this.cfg.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    const maxRounds = this.cfg.maxToolRounds ?? 8;

    for (let round = 0; ; round++) {
      // After the round limit, force a plain answer by withholding tools.
      const allowTools = round < maxRounds;
      const res = await this.provider.complete({
        system,
        messages: this.requestMessages(),
        tools: allowTools ? specs : [],
        temperature: this.cfg.temperature,
        signal,
      });

      const calls = allowTools ? res.toolCalls.filter((c) => c.name) : [];
      this.set({
        messages: [
          ...this.state.messages,
          {
            id: uid(),
            role: "assistant",
            content: res.content,
            ...(calls.length ? { toolCalls: calls } : {}),
          },
        ],
      });

      if (!calls.length) return;

      const results = await Promise.all(calls.map((c) => this.execute(c, tools)));
      if (signal.aborted) throw new Error("aborted");
      this.set({
        messages: [...this.state.messages, ...results],
        status: "Thinking…",
      });
    }
  }

  private async execute(call: ToolCall, tools: RuntimeTool[]): Promise<ChatMessage> {
    const tool = tools.find((t) => t.name === call.name);
    let result: unknown;
    let error: string | undefined;

    this.set({ status: `Calling ${call.name}…` });

    if (!tool) {
      error = `Unknown tool "${call.name}". Available: ${tools.map((t) => t.name).join(", ") || "none"}.`;
    } else {
      const prepared = prepareArgs(tool, call.args);
      if ("error" in prepared) error = prepared.error;
      else {
        try {
          const allowed = await this.cfg.beforeToolCall?.({
            name: tool.name,
            args: prepared.args,
            method: tool.method,
          });
          if (allowed === false) error = "The user declined to run this action.";
          else result = await tool.call(prepared.args);
        } catch (e) {
          error = e instanceof Error ? e.message : String(e);
        }
      }
    }

    this.cfg.onToolCall?.({ name: call.name, args: call.args, result, error });

    const max = this.cfg.maxToolResultChars ?? 8000;
    let content = error ? JSON.stringify({ error }) : safeStringify(result);
    if (content.length > max) {
      content = content.slice(0, max) + `\n…[truncated ${content.length - max} characters]`;
    }

    return { id: uid(), role: "tool", toolCallId: call.id, name: call.name, content };
  }
}

function safeStringify(v: unknown): string {
  if (v === undefined) return "null";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
