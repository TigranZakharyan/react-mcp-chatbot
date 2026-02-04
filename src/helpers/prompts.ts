import { MCPTool } from "../types";

export const buildToolDecisionPrompt = (
  tools: MCPTool[],
  message: string
) => `
You are a tool-selection engine.

Your job is to decide whether a tool should be called and extract arguments.

Available tools:
${tools
  .map(
    (t) => `
Tool name: ${t.name}
Description: ${t.description}
Parameters:
${Object.entries(t.parameters ?? {})
  .map(([k, v]) => {
    const optional =
      typeof (v as any).optional === "boolean"
        ? (v as any).optional
        : true;
    return `- ${k}: ${v.type}${optional ? " (optional)" : " (required)"}`;
  })
  .join("\n")}
`
  )
  .join("\n")}

User request:
${message}

STRICT OUTPUT RULES:
- Respond with ONLY a single valid JSON object
- The object MUST have exactly two top-level properties:
  - "tool": string | null
  - "arguments": object
- Do NOT include any other keys
- Do NOT include explanations, comments, or markdown
- If no tool applies, return:
  { "tool": null, "arguments": {} }
- If a tool applies:
  - "tool" must be the exact tool name
  - "arguments" must include ONLY parameters required by the request

Return ONLY valid JSON.
`;
