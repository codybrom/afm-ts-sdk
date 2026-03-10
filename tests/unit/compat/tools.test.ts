import { describe, it, expect } from "vitest";
import {
  buildToolInstructions,
  buildToolSchema,
  parseToolResponse,
} from "../../../src/compat/tools.js";
import type { ChatCompletionTool } from "../../../src/compat/types.js";

const sampleTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get the current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "The city and state" },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the web for information",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
];

describe("buildToolInstructions", () => {
  it("generates text containing tool names and descriptions", () => {
    const result = buildToolInstructions(sampleTools);
    expect(result).toContain("get_weather");
    expect(result).toContain("Get the current weather for a location");
    expect(result).toContain("search_web");
    expect(result).toContain("Search the web for information");
  });

  it("mentions tool_call and text response types", () => {
    const result = buildToolInstructions(sampleTools);
    expect(result).toContain("tool_call");
    expect(result).toContain("text");
  });

  it("includes serialized parameters", () => {
    const result = buildToolInstructions(sampleTools);
    expect(result).toContain('"location"');
    expect(result).toContain('"query"');
  });

  it("handles tools with missing description and parameters", () => {
    const tools: ChatCompletionTool[] = [
      {
        type: "function",
        function: { name: "bare_tool" },
      } as ChatCompletionTool,
    ];
    const result = buildToolInstructions(tools);
    expect(result).toContain("bare_tool");
    expect(result).toContain("Parameters: {}");
  });

  it("starts with a leading newline", () => {
    const result = buildToolInstructions(sampleTools);
    expect(result.startsWith("\n")).toBe(true);
  });

  it("lists all tools under a Tools: header", () => {
    const result = buildToolInstructions(sampleTools);
    expect(result).toContain("Tools:");
  });
});

describe("buildToolSchema", () => {
  it("returns an object with type object and required type field", () => {
    const schema = buildToolSchema(sampleTools);
    expect(schema.type).toBe("object");
    expect(schema.required).toEqual(["type"]);
    expect(schema.additionalProperties).toBe(false);
  });

  it("has a type property with enum of text and tool_call", () => {
    const schema = buildToolSchema(sampleTools);
    const props = schema.properties as Record<string, unknown>;
    const typeProp = props.type as Record<string, unknown>;
    expect(typeProp.type).toBe("string");
    expect(typeProp.enum).toEqual(["text", "tool_call"]);
  });

  it("has a content string property", () => {
    const schema = buildToolSchema(sampleTools);
    const props = schema.properties as Record<string, unknown>;
    const contentProp = props.content as Record<string, unknown>;
    expect(contentProp.type).toBe("string");
  });

  it("includes tool_call property with correct structure", () => {
    const schema = buildToolSchema(sampleTools);
    const props = schema.properties as Record<string, unknown>;
    const toolCallProp = props.tool_call as Record<string, unknown>;
    expect(toolCallProp.type).toBe("object");
    expect(toolCallProp.required).toEqual(["name", "arguments"]);
    expect(toolCallProp.additionalProperties).toBe(false);
  });

  it("populates tool name enum dynamically from provided tools", () => {
    const schema = buildToolSchema(sampleTools);
    const props = schema.properties as Record<string, unknown>;
    const toolCallProp = props.tool_call as Record<string, unknown>;
    const toolCallProps = toolCallProp.properties as Record<string, unknown>;
    const nameProp = toolCallProps.name as Record<string, unknown>;
    expect(nameProp.enum).toEqual(["get_weather", "search_web"]);
  });

  it("works with a single tool", () => {
    const schema = buildToolSchema([sampleTools[0]]);
    const props = schema.properties as Record<string, unknown>;
    const toolCallProp = props.tool_call as Record<string, unknown>;
    const toolCallProps = toolCallProp.properties as Record<string, unknown>;
    const nameProp = toolCallProps.name as Record<string, unknown>;
    expect(nameProp.enum).toEqual(["get_weather"]);
  });
});

describe("parseToolResponse", () => {
  it("returns text result when type is text", () => {
    const result = parseToolResponse({ type: "text", content: "Hello, world!" });
    expect(result.type).toBe("text");
    expect(result.content).toBe("Hello, world!");
    expect(result.toolCall).toBeUndefined();
  });

  it("returns empty string content when type is text and content is missing", () => {
    const result = parseToolResponse({ type: "text" });
    expect(result.type).toBe("text");
    expect(result.content).toBe("");
  });

  it("returns tool_call result with id, type function, and stringified arguments", () => {
    const result = parseToolResponse({
      type: "tool_call",
      tool_call: {
        name: "get_weather",
        arguments: { location: "San Francisco, CA" },
      },
    });

    expect(result.type).toBe("tool_call");
    expect(result.toolCall).toBeDefined();
    expect(result.toolCall!.id).toMatch(/^call_/);
    expect(result.toolCall!.type).toBe("function");
    expect(result.toolCall!.function.name).toBe("get_weather");
    expect(result.toolCall!.function.arguments).toBe(
      JSON.stringify({ location: "San Francisco, CA" }),
    );
    expect(result.content).toBeUndefined();
  });

  it("generates a unique id for each tool call", () => {
    const r1 = parseToolResponse({
      type: "tool_call",
      tool_call: { name: "search_web", arguments: { query: "test" } },
    });
    const r2 = parseToolResponse({
      type: "tool_call",
      tool_call: { name: "search_web", arguments: { query: "test" } },
    });
    expect(r1.toolCall!.id).not.toBe(r2.toolCall!.id);
  });

  it("handles tool_call with missing arguments", () => {
    const result = parseToolResponse({
      type: "tool_call",
      tool_call: { name: "no_args" },
    });
    expect(result.type).toBe("tool_call");
    expect(result.toolCall!.function.arguments).toBe("{}");
  });

  it("falls back to text when type is tool_call but tool_call is missing", () => {
    const result = parseToolResponse({ type: "tool_call" });
    expect(result.type).toBe("text");
    expect(result.content).toBe("");
  });

  it("falls back to text for unknown type", () => {
    const result = parseToolResponse({ type: "unknown_type", content: "some text" });
    expect(result.type).toBe("text");
    expect(result.content).toBe("some text");
  });
});
