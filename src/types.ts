export * from "./core/types";
import type { CSSProperties, ReactNode } from "react";
import type { Components } from "react-markdown";
import type { ChatConfig } from "./core/types";
import type { ThemeTokens } from "./helpers/buildTokens";

export type { ThemeTokens as MCPThemeColors } from "./helpers/buildTokens";

export type BaseUIProps = {
  // ── Basics ──
  title?: string;
  /** Text under the title. Default "Online". Pass `null` to hide the line. */
  subtitle?: string | null;
  align?: "left" | "right";
  width?: number;
  height?: number;
  placeholder?: string;
  buttonLabel?: string;

  // ── Look & feel ──
  /** Accent colour (launcher, user bubbles, links, focus ring). */
  primaryColor?: string;
  /** `"auto"` follows the visitor's OS setting. Default `"dark"`. */
  theme?: "light" | "dark" | "auto";
  /**
   * Override any individual colour of the active theme, e.g.
   * `{ bg: "#fff", aiBubble: "#f1f5f9", userBubble: "#0ea5e9" }`.
   */
  colors?: Partial<ThemeTokens>;
  borderRadius?: number;
  /** CSS font-family for the whole widget. */
  fontFamily?: string;
  /** Extra class / inline style for the chat window (not the launcher). */
  className?: string;
  style?: CSSProperties;

  // ── Content ──
  /** Header avatar: an emoji/text, an image URL (http…, /…, data:…) or any React node. */
  avatar?: ReactNode;
  /** Icon inside the floating button when closed. Default 💬. */
  launcherIcon?: ReactNode;
  /** Empty-state icon, headline and sentence. */
  welcomeIcon?: ReactNode;
  welcomeTitle?: string;
  welcomeMessage?: string;
  /** Clickable starter prompts shown in the empty chat. */
  suggestions?: string[];
  /** Replace how Markdown elements render, e.g. `{ a: MyLink }`. */
  markdownComponents?: Components;
  /** Show the trash button in the header. Default true. */
  showClearButton?: boolean;

  // ── Position ──
  /** Distance from the bottom / chosen side of the viewport in px. Default 24. */
  bottomOffset?: number;
  sideOffset?: number;
  /** Base z-index of the chat window (launcher is +1). Default 9998. */
  zIndex?: number;

  // ── Open state ──
  /** Start open (uncontrolled). Default false. */
  defaultOpen?: boolean;
  /** Control the window yourself. Combine with `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the floating button, e.g. to open the chat from your own button. Default true. */
  showLauncher?: boolean;
};

export type MCPAgentProps = ChatConfig & BaseUIProps;

/** Imperative handle available through `ref` on `<MCPAgent />`. */
export type MCPAgentHandle = {
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  send: (text: string) => Promise<void>;
  stop: () => void;
};
