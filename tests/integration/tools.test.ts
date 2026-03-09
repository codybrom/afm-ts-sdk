import { describe, it, expect, afterAll } from "vitest";
import {
  SystemLanguageModel,
  LanguageModelSession,
  GenerationSchema,
  GeneratedContent,
  Tool,
} from "../../src/index.js";

class AddTool extends Tool {
  readonly name = "add";
  readonly description = "Adds two numbers and returns the sum.";
  readonly argumentsSchema = new GenerationSchema("AddParams", "Addition parameters")
    .property("a", "number", { description: "First number" })
    .property("b", "number", { description: "Second number" });

  async call(args: GeneratedContent): Promise<string> {
    const a = args.value<number>("a");
    const b = args.value<number>("b");
    return String(a + b);
  }
}

const model = new SystemLanguageModel();
const { available } = model.isAvailable();
const describeIfAvailable = available ? describe : describe.skip;

afterAll(() => model.dispose());

describeIfAvailable("tools (integration)", () => {
  it("invokes a tool and returns result", async () => {
    const tool = new AddTool();
    const session = new LanguageModelSession({
      instructions: "Use the add tool to answer math questions. Be concise.",
      tools: [tool],
    });
    const reply = await session.respond("What is 7 + 3?");
    expect(reply).toContain("10");
    session.dispose();
    tool.dispose();
  }, 120_000);
});
