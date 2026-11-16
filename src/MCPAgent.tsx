import { forwardRef, useState, useRef, useEffect, useImperativeHandle, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MCPAgentHandle, MCPAgentProps } from "./types";
import SendIcon from "./assets/send.svg";
import { TypingDots } from "./components/TypingDots";
import { buildTokens } from "./helpers/buildTokens";
import { useChat } from "./useChat";

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
/** Follows `prefers-color-scheme` when theme="auto". */
function useSystemDark(enabled: boolean) {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [enabled]);
  return dark;
}

function renderAvatar(avatar: ReactNode) {
  if (typeof avatar === "string" && /^(https?:|data:|\/|\.\/)/.test(avatar)) {
    return <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  }
  return avatar;
}

export const MCPAgent = forwardRef<MCPAgentHandle, MCPAgentProps>(function MCPAgent(props, ref) {
  // UI props are pulled out here; whatever is left in `config` goes to the chat engine.
  const {
    title = "AI Assistant",
    subtitle = "Online",
    align = "right",
    primaryColor = "#6366f1",
    width = 600,
    height = 900,
    theme = "dark",
    colors,
    buttonLabel,
    placeholder = "Message…",
    borderRadius = 20,
    fontFamily = "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    className,
    style: userStyle,
    avatar = "🤖",
    launcherIcon = "💬",
    welcomeIcon = "👋",
    welcomeTitle = "Hey there!",
    welcomeMessage = "How can I help you today?",
    suggestions,
    markdownComponents,
    showClearButton = true,
    bottomOffset = 24,
    sideOffset = 24,
    zIndex = 9998,
    defaultOpen = false,
    open: openProp,
    onOpenChange,
    showLauncher = true,
    ...config
  } = props;

  const systemDark = useSystemDark(theme === "auto");
  const isDark = theme === "auto" ? systemDark : theme === "dark";
  const t = { ...buildTokens(primaryColor, isDark), ...colors };
  const accent = t.accent;

  const chat = useChat(config);
  const { loading, status } = chat;

  // Open state: controlled when `open` is passed, otherwise internal.
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const setOpen = (v: boolean) => {
    if (openProp === undefined) setOpenState(v);
    onOpenChange?.(v);
  };

  useImperativeHandle(ref, () => ({
    clear: chat.clear,
    send: chat.send,
    stop: chat.stop,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!open),
  }));

  // Tool-call bookkeeping messages are not shown.
  const messages = chat.messages.filter(
    (m) => (m.role === "user" || m.role === "assistant") && m.content.trim()
  );

  async function send(): Promise<void> {
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    await chat.send(text);
  }

  const [input, setInput] = useState("");
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

  const side = align === "right" ? { right: sideOffset } : { left: sideOffset };
  const windowBottom = bottomOffset + 60;

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
    .mcp-bubble-ai code { background: ${t.codeBg}; color: ${t.codeText}; padding: 2px 6px; border-radius: 4px; font-size: 0.82em; }
    .mcp-bubble-ai pre { background: ${t.preBg}; padding: 10px 12px; border-radius: 8px; overflow-x: auto; font-size: 0.8em; margin: 6px 0; }
    .mcp-bubble-ai table { border-collapse: collapse; width: 100%; font-size: 0.82em; margin: 6px 0; }
    .mcp-bubble-ai th, .mcp-bubble-ai td { border: 1px solid ${t.border}; padding: 5px 8px; text-align: left; }
    .mcp-bubble-ai th { background: ${t.tableHeadBg}; font-weight: 600; }
    .mcp-bubble-ai p { margin: 4px 0; }
    .mcp-bubble-ai ul, .mcp-bubble-ai ol { margin: 4px 0; padding-left: 18px; }
    .mcp-bubble-ai li { margin: 2px 0; }
    .mcp-clear-btn:not(:disabled):hover { color: ${t.text} !important; background: ${t.surfaceHover} !important; }
    .mcp-chip:hover:not(:disabled) { border-color: ${t.accent} !important; color: ${t.accent} !important; transform: translateY(-1px); }
    .mcp-float-btn:hover { transform: scale(1.08); box-shadow: 0 14px 36px ${accent}55 !important; }
    .mcp-float-btn:active { transform: scale(0.96); }
  `;

  return (
    <>
      <style>{styleTag}</style>

      {/* ── Floating Toggle Button ── */}
      {showLauncher && (
      <button
        className="mcp-float-btn"
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: bottomOffset,
          ...side,
          background: open
            ? (isDark ? t.surface : t.border)
            : accent,
          color: open ? t.textMuted : "#fff",
          borderRadius: 999,
          padding: buttonLabel ? "13px 22px" : "16px 18px",
          border: "none",
          cursor: "pointer",
          boxShadow: open
            ? `0 8px 24px rgba(0,0,0,.15)`
            : `0 12px 32px ${accent}44`,
          fontWeight: 600,
          fontSize: 15,
          display: "flex",
          alignItems: "center",
          gap: 8,
          transition: "all .25s cubic-bezier(.4,0,.2,1)",
          zIndex: zIndex + 1,
          fontFamily,
          userSelect: "none",
        }}
      >
        <span style={{ fontSize: open ? 18 : 20, transition: "font-size .2s" }}>
          {open ? "✕" : launcherIcon}
        </span>
        {buttonLabel && !open && <span>{buttonLabel}</span>}
      </button>
      )}

      {/* ── Chat Window ── */}
      <div
        className={className}
        role="dialog"
        aria-label={title}
        aria-hidden={!open}
        style={{
          position: "fixed",
          bottom: windowBottom,
          ...side,
          // never wider/taller than the viewport (phones)
          width: `min(${width}px, calc(100vw - 32px))`,
          height: `min(${height}px, calc(100vh - ${windowBottom + 26}px))`,
          background: t.bg,
          borderRadius,
          display: "flex",
          flexDirection: "column",
          boxShadow: t.shadow,
          overflow: "hidden",
          zIndex,
          pointerEvents: open ? "auto" : "none",
          opacity: open && animateIn ? 1 : 0,
          transform: open && animateIn ? "translateY(0) scale(1)" : "translateY(18px) scale(.96)",
          transition: "opacity .3s cubic-bezier(.4,0,.2,1), transform .3s cubic-bezier(.4,0,.2,1)",
          fontFamily,
          ...userStyle,
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
              background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
              position: "relative",
              zIndex: 1,
              overflow: "hidden",
              color: "#fff",
            }}
          >
            {renderAvatar(avatar)}
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ color: t.text, fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
              {title}
            </div>
            {subtitle !== null && (
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
                {subtitle}
              </div>
            )}
          </div>
          {showClearButton && (
            <button
              className="mcp-clear-btn"
              onClick={chat.clear}
              disabled={chat.messages.length === 0}
              title="Clear chat"
              aria-label="Clear chat"
              style={{
                marginLeft: "auto",
                position: "relative",
                zIndex: 1,
                background: "transparent",
                border: `1px solid ${t.border}`,
                color: t.textMuted,
                borderRadius: 8,
                padding: "5px 10px",
                fontSize: 12,
                cursor: chat.messages.length === 0 ? "default" : "pointer",
                opacity: chat.messages.length === 0 ? 0.4 : 1,
                fontFamily: "inherit",
              }}
            >
              Clear
            </button>
          )}
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
                  background: `linear-gradient(135deg, ${accent}22, ${accent}44)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                {welcomeIcon}
              </div>
              <span style={{ fontWeight: 600, color: t.text, fontSize: 14 }}>
                {welcomeTitle}
              </span>
              <span>{welcomeMessage}</span>
              {suggestions && suggestions.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 6 }}>
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      className="mcp-chip"
                      disabled={loading}
                      onClick={() => chat.send(q)}
                      style={{
                        background: t.bg,
                        color: t.text,
                        border: `1px solid ${t.border}`,
                        borderRadius: 999,
                        padding: "7px 13px",
                        fontSize: 12.5,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all .15s",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
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
                <TypingDots color={accent} />
                {status && (
                  <span style={{ color: t.textMuted, fontSize: 11, marginLeft: 8 }}>{status}</span>
                )}
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
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
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
              background: loading || !input.trim() ? t.textMuted + "55" : accent,
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
});
