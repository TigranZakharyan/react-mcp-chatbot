export type MCPProvider = "ollama" | "remote";

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
  providerURL: string;
};

type AgentProps = {
  providerURL: string;
  provider: "ollama";
  model: string;
  tools: MCPTool[]
}

export type MCPAgentProps = BaseUIProps & AgentProps

