import type { MCPTool, ToolDecision } from "../types";
import { Agent } from "../types";
import { MARKDOWN_SYSTEM_PROMPT } from "../MCPAgent";
import { buildToolDecisionPrompt } from "../helpers/prompts";

export class GeminiAgent extends Agent {
  private apiKey: string;

  constructor(
    apiKey: string,
    model = "models/gemini-1.5-pro",
    providerURL = "https://generativelanguage.googleapis.com/v1beta",
    tools: MCPTool[] = []
  ) {
    super(model, providerURL, tools);
    this.apiKey = apiKey;
  }

  async decideTool(message: string): Promise<ToolDecision> {
    if (this.tools.length === 0) return { tool: null };

    const res = await fetch(
      `${this.url}/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "You select tools and arguments. Respond ONLY with valid JSON.\n\n" +
                    buildToolDecisionPrompt(this.tools, message),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
          },
        }),
      }
    );

    const data = await res.json();
    const content =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    try {
      return JSON.parse(content);
    } catch {
      return { tool: null };
    }
  }

  async ask(message: string): Promise<string> {
    let toolContext = "";

    const decision = await this.decideTool(message);

    if (decision.tool) {
      const tool = this.tools.find((t) => t.name === decision.tool);
      if (tool) {
        const result = await tool.call(decision.arguments);

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

Context rules:
- Respond ONLY using the information provided in the context.
- Do NOT generate or assume any information not present in the context.
- If the answer cannot be found in the context, respond exactly:
"No relevant information was found."
`;

    const res = await fetch(
      `${this.url}/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: MARKDOWN_SYSTEM_PROMPT }],
            },
            {
              role: "user",
              parts: [{ text: finalPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0,
          },
        }),
      }
    );

    const data = await res.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    );
  }
}
