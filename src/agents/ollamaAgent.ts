import type { MCPTool, ToolDecision } from "../types";
import { Agent } from "../types";
import { MARKDOWN_SYSTEM_PROMPT } from "../MCPAgent";
import { buildToolDecisionPrompt } from "../helpers/prompts";

export class OllamaAgent extends Agent {
  constructor(
    model = "llama3.2:latest",
    providerURL: string,
    tools: MCPTool[] = []
  ) {
    super(model, providerURL, tools);
  }

  async decideTool(message: string): Promise<ToolDecision> {
    if (this.tools.length === 0) return { tool: null };
    console.log(this.url)
    const res = await fetch(`${this.url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        system: "You select tools and arguments. Output JSON only.",
        prompt: buildToolDecisionPrompt(this.tools, message),
        stream: false,
      }),
    });

    const data = await res.json();

    try {
      return JSON.parse(data.response);
    } catch {
      return { tool: null };
    }
  }

  async ask(message: string): Promise<string> {
    let toolContext = "";

    const decision = await this.decideTool(message);

    if (decision.tool) {
      const tool = this.tools.find(t => t.name === decision.tool);

      if (tool) {
        const result = await tool.call(decision.arguments);

        // 🔑 LIMIT + SUMMARIZE CONTEXT
        toolContext = `
Tool used: ${tool.name}
Result (partial):
\`\`\`json
${JSON.stringify(result, null, 2).slice(0, 4000)}
\`\`\`
`;
      }
    }

    const finalPrompt = `
User request:
${message}

${toolContext}

Respond in clean, well-formatted Markdown.
Use lists, tables, and headings where appropriate.
Do NOT mention tools or APIs explicitly.
`;

    const res = await fetch(`${this.url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        system: MARKDOWN_SYSTEM_PROMPT,
        prompt: finalPrompt,
        stream: false,
      }),
    });

    const data = await res.json();
    return data.response;
  }
}

