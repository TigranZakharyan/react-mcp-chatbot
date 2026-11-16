export * from "./core/types";
import type { ChatConfig } from "./core/types";

export type BaseUIProps = {
  title?: string;
  align?: "left" | "right";
  primaryColor?: string;
  width?: number;
  height?: number;
  theme?: "light" | "dark";
  buttonLabel?: string;
  placeholder?: string;
  borderRadius?: number;
  /** Show the trash button in the header. Default true. */
  showClearButton?: boolean;
};

export type MCPAgentProps = ChatConfig & BaseUIProps;

/** Imperative handle available through `ref` on `<MCPAgent />`. */
export type MCPAgentHandle = {
  clear: () => void;
  send: (text: string) => Promise<void>;
  stop: () => void;
};
