import { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MCPAgentMessage, MCPAgentProps } from "./types";
import { OllamaAgent } from "./agents/ollamaAgent";
import SendIcon from './assets/send.svg'
import { TypingDots } from "./components/TypingDots";
import { buildTokens } from "./helpers/buildTokens";

// ─────────────────────────────────────────────
// System Prompt
// ─────────────────────────────────────────────
export const MARKDOWN_SYSTEM_PROMPT = `
You are a helpful AI assistant.

Formatting rules:
- Always respond in Markdown
- Use bullet lists for multiple items
- Use **bold** for important values
- Use tables when comparing data
- Use \`inline code\` for variables or keys
- Use code blocks only when necessary
- Keep responses clean and readable
`;

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export function MCPAgent({
  provider,
  providerURL,
  model,
  tools = [],
  title = "AI Assistant",
  align = "right",
  primaryColor = "#6366f1",
  width = 600,
  height = 900,
  theme = "dark",
  buttonLabel,
  placeholder = "Message…",
  borderRadius = 20,
}: MCPAgentProps) {
  const isDark = theme === "dark";
  const t = buildTokens(primaryColor, isDark);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<MCPAgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Animate window open
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setAnimateIn(true));
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      setAnimateIn(false);
    }
  }, [open]);

  const agent = useMemo(() => {
    if (provider === "ollama") {
      return new OllamaAgent(model, providerURL, tools);
    }
    return new OllamaAgent(model, providerURL, tools);
  }, [provider, model, providerURL, tools]);


  // ── Send logic ──
  async function send(): Promise<void> {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await agent.ask(userMessage);

      setMessages(prev => [
        ...prev,
        { role: "ai", content: response }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "ai", content: "⚠️ **Error:** Unable to fetch response." }
      ]);
    } finally {
      setLoading(false);
    }
  }


  const side = align === "right" ? { right: 24 } : { left: 24 };

  // ── Injected global styles ──
  const styleTag = `
    .mcp-input:focus { outline: none; box-shadow: 0 0 0 2.5px ${t.inputFocus}33; border-color: ${t.inputFocus} !important; }
    .mcp-input::placeholder { color: ${t.textMuted}; }
    .mcp-scrollpane::-webkit-scrollbar { width: 6px; }
    .mcp-scrollpane::-webkit-scrollbar-track { background: ${t.scrollbar}; }
    .mcp-scrollpane::-webkit-scrollbar-thumb { background: ${t.scrollbarThumb}; border-radius: 3px; }
    .mcp-scrollpane::-webkit-scrollbar-thumb:hover { background: ${t.textMuted}44; }
    .mcp-btn-send:hover { background: ${t.accentHover} !important; transform: translateY(-1px); }
    .mcp-btn-send:active { transform: translateY(0); }
    .mcp-bubble-ai a { color: ${t.accent}; }
    .mcp-bubble-ai code { background: ${isDark ? "#2a2e3d" : "#eef1f5"}; color: ${isDark ? "#c9cdd8" : "#e11d48"}; padding: 2px 6px; border-radius: 4px; font-size: 0.82em; }
    .mcp-bubble-ai pre { background: ${isDark ? "#161923" : "#f0f2f5"}; padding: 10px 12px; border-radius: 8px; overflow-x: auto; font-size: 0.8em; margin: 6px 0; }
    .mcp-bubble-ai table { border-collapse: collapse; width: 100%; font-size: 0.82em; margin: 6px 0; }
    .mcp-bubble-ai th, .mcp-bubble-ai td { border: 1px solid ${t.border}; padding: 5px 8px; text-align: left; }
    .mcp-bubble-ai th { background: ${isDark ? "#232736" : "#eef1f5"}; font-weight: 600; }
    .mcp-bubble-ai p { margin: 4px 0; }
    .mcp-bubble-ai ul, .mcp-bubble-ai ol { margin: 4px 0; padding-left: 18px; }
    .mcp-bubble-ai li { margin: 2px 0; }
    .mcp-float-btn:hover { transform: scale(1.08); box-shadow: 0 14px 36px ${primaryColor}55 !important; }
    .mcp-float-btn:active { transform: scale(0.96); }
  `;

  return (
    <>
      <style>{styleTag}</style>

      {/* ── Floating Toggle Button ── */}
      <button
        className="mcp-float-btn"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 24,
          ...side,
          background: open
            ? (isDark ? t.surface : t.border)
            : primaryColor,
          color: open ? t.textMuted : "#fff",
          borderRadius: 999,
          padding: buttonLabel ? "13px 22px" : "16px 18px",
          border: "none",
          cursor: "pointer",
          boxShadow: open
            ? `0 8px 24px rgba(0,0,0,.15)`
            : `0 12px 32px ${primaryColor}44`,
          fontWeight: 600,
          fontSize: 15,
          display: "flex",
          alignItems: "center",
          gap: 8,
          transition: "all .25s cubic-bezier(.4,0,.2,1)",
          zIndex: 9999,
          userSelect: "none",
        }}
      >
        <span style={{ fontSize: open ? 18 : 20, transition: "font-size .2s" }}>
          {open ? "✕" : "💬"}
        </span>
        {buttonLabel && !open && <span>{buttonLabel}</span>}
      </button>

      {/* ── Chat Window ── */}
      <div
        style={{
          position: "fixed",
          bottom: 84,
          ...side,
          width,
          height,
          background: t.bg,
          borderRadius,
          display: "flex",
          flexDirection: "column",
          boxShadow: t.shadow,
          overflow: "hidden",
          zIndex: 9998,
          pointerEvents: open ? "auto" : "none",
          opacity: open && animateIn ? 1 : 0,
          transform: open && animateIn ? "translateY(0) scale(1)" : "translateY(18px) scale(.96)",
          transition: "opacity .3s cubic-bezier(.4,0,.2,1), transform .3s cubic-bezier(.4,0,.2,1)",
          fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            background: isDark ? t.surface : t.bg,
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle accent glow behind avatar */}
          <div
            style={{
              position: "absolute",
              top: -20,
              left: "50%",
              transform: "translateX(-50%)",
              width: 120,
              height: 60,
              background: t.headerGlow,
              filter: "blur(20px)",
              pointerEvents: "none",
            }}
          />
          {/* Avatar circle */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}88)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
              position: "relative",
              zIndex: 1,
            }}
          >
            🤖
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ color: t.text, fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
              {title}
            </div>
            <div style={{ color: t.textMuted, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 6px #22c55e66",
                  display: "inline-block",
                }}
              />
              Online
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          className="mcp-scrollpane"
          ref={scrollRef}
          style={{
            flex: 1,
            padding: "16px 14px",
            overflowY: "auto",
            background: t.surface,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: t.textMuted,
                fontSize: 13,
                textAlign: "center",
                padding: "0 16px",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}44)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                👋
              </div>
              <span style={{ fontWeight: 600, color: t.text, fontSize: 14 }}>
                Hey there!
              </span>
              <span>How can I help you today?</span>
            </div>
          )}

          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  animation: "msgSlideIn .22s ease forwards",
                }}
              >
                <div
                  className={isUser ? "" : "mcp-bubble-ai"}
                  style={{
                    maxWidth: "82%",
                    padding: "10px 14px",
                    borderRadius: isUser ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
                    background: isUser ? t.userBubble : t.aiBubble,
                    color: isUser ? t.userBubbleText : t.aiBubbleText,
                    boxShadow: isDark
                      ? "0 2px 10px rgba(0,0,0,.2)"
                      : "0 2px 10px rgba(0,0,0,.07)",
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    wordBreak: "break-word",
                  }}
                >
                  {isUser ? (
                    m.content
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  background: t.aiBubble,
                  padding: "10px 16px",
                  borderRadius: "18px 18px 18px 6px",
                  boxShadow: isDark
                    ? "0 2px 10px rgba(0,0,0,.2)"
                    : "0 2px 10px rgba(0,0,0,.07)",
                }}
              >
                <TypingDots color={primaryColor} />
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: "10px 12px",
            background: isDark ? t.surface : t.bg,
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <input
            ref={inputRef}
            className="mcp-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={placeholder}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 12,
              border: `1.5px solid ${t.inputBorder}`,
              background: t.inputBg,
              color: t.text,
              fontSize: 13.5,
              outline: "none",
              transition: "border-color .2s, box-shadow .2s",
              fontFamily: "inherit",
            }}
          />
          <button
            className="mcp-btn-send"
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? t.textMuted + "55" : primaryColor,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              transition: "all .2s cubic-bezier(.4,0,.2,1)",
              flexShrink: 0,
            }}
          >
            <img src={SendIcon} width={24} />
          </button>
        </div>
      </div>

      {/* Message slide-in keyframes */}
      <style>{`
        @keyframes msgSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}