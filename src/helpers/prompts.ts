import { MCPTool } from "../types";

export const buildToolDecisionPrompt = (tools: MCPTool[], message: string) => `
You are an API query planner.

Available tools:
${tools.map(t => `
Tool: ${t.name}
Description: ${t.description}
Parameters:
${Object.entries(t.parameters ?? [])
  .map(([k, v]) => {
    const optional =
      typeof (v as any).optional === "boolean"
        ? (v as any).optional
        : true; // default assumption

    return `- ${k} (${v.type})${optional ? " optional" : ""}`;
  })
  .join("\n")}
`).join("\n")}

User request:
${message}

Rules:
- Decide the best tool to use
- Extract correct parameter values from the user message
- Only include parameters relevant to the request
- If no tool is needed, return { "tool": null }

Respond ONLY with valid JSON.
`;
