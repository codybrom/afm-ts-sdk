import { randomUUID } from "node:crypto";
import type { ChatCompletionTool, ChatCompletionMessageToolCall } from "./types.js";

export interface ToolParseResult {
  type: "text" | "tool_call";
  content?: string;
  toolCall?: ChatCompletionMessageToolCall;
}

/**
 * Generates prompt text describing available tools, appended to existing instructions.
 * The leading newline is intentional.
 */
export function buildToolInstructions(tools: ChatCompletionTool[]): string {
  const lines: string[] = [
    '\nYou have access to the following tools. When you want to call a tool, respond with type "tool_call". When you want to respond with text, respond with type "text".',
    "",
    "Tools:",
  ];

  for (const tool of tools) {
    const { name, description, parameters } = tool.function;
    lines.push(`- ${name}: ${description ?? ""}`);
    lines.push(`  Parameters: ${JSON.stringify(parameters ?? {})}`);
  }

  return lines.join("\n");
}

/**
 * Builds a JSON schema for structured output that discriminates between
 * a text response and a tool call.
 */
export function buildToolSchema(tools: ChatCompletionTool[]): Record<string, unknown> {
  const toolNames = tools.map((t) => t.function.name);

  return {
    type: "object",
    required: ["type"],
    additionalProperties: false,
    properties: {
      type: {
        type: "string",
        enum: ["text", "tool_call"],
      },
      content: {
        type: "string",
      },
      tool_call: {
        type: "object",
        required: ["name", "arguments"],
        additionalProperties: false,
        properties: {
          name: {
            type: "string",
            enum: toolNames,
          },
          arguments: {
            type: "object",
          },
        },
      },
    },
  };
}

/**
 * Parses the model's structured output into a ToolParseResult.
 */
export function parseToolResponse(parsed: Record<string, unknown>): ToolParseResult {
  if (parsed.type === "tool_call" && parsed.tool_call != null) {
    const toolCall = parsed.tool_call as Record<string, unknown>;
    const name = toolCall.name as string;
    const args = toolCall.arguments ?? {};

    return {
      type: "tool_call",
      toolCall: {
        id: "call_" + randomUUID(),
        type: "function",
        function: {
          name,
          arguments: JSON.stringify(args),
        },
      },
    };
  }

  return {
    type: "text",
    content: typeof parsed.content === "string" ? parsed.content : "",
  };
}
