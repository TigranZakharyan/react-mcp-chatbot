export type MCPProvider = "ollama" | "openai" | "groq" | "gemini";

export type MCPToolParameter = {
  type: "string" | "number" | "boolean";
  description?: string;
  optional?: boolean; // 👈 make it optional
};

export type MCPTool<TArgs = any> = {
  name: string;
  description: string;

  parameters?: Record<string, MCPToolParameter>;

  call: (args: TArgs) => Promise<any>;
};

export type MCPAgentMessage = {
  role: "user" | "ai";
  content: string;
};

export type MCPAgentResponse =
  | {
      type: "message";
      content: string;
    }
  | {
      type: "tool_call";
      toolIndex: number;
    };

export type ToolDecision =
  | { tool: null }
  | { tool: string; arguments: Record<string, any> };

export abstract class Agent {
  tools: MCPTool[];
  model: string;
  url: string;

  constructor(model: string, url: string, tools: MCPTool[] = []) {
    this.tools = tools;
    this.url = url;
    this.model = model;
  }
  abstract decideTool(message: string): Promise<ToolDecision>;
  abstract ask(message: string): Promise<string>;
}

type BaseUIProps = {
  title?: string;
  align?: "left" | "right";
  primaryColor?: string;
  width?: number;
  height?: number;
  theme?: "light" | "dark";
  buttonLabel?: string;
  placeholder?: string;
  borderRadius?: number;
};

type BaseAgentProps = {
  model: string;
  tools: MCPTool[];
};

// Ollama agent props
export type OllamaAgentProps = BaseAgentProps & BaseUIProps & {
  provider: "ollama";
  providerURL: string;
  apiKey?: never;
};

// Groq agent props
export type GroqAgentProps = BaseAgentProps & BaseUIProps & {
  provider: "groq";
  apiKey: string;
  providerURL?: never;
};

export type OpenaiAgentProps = BaseAgentProps & BaseUIProps & {
  provider: "openai";
  apiKey: string;
  providerURL?: never;
};

export type GeminiAgentProps = BaseAgentProps & BaseUIProps & {
  provider: "gemini";
  apiKey: string;
  providerURL?: never;
};

// Union of the two full props
export type MCPAgentProps = OllamaAgentProps | GroqAgentProps | OpenaiAgentProps | GeminiAgentProps;