import { describe, it, expect, afterAll } from "vitest";
import {
  SystemLanguageModel,
  LanguageModelSession,
  GenerationSchema,
  GeneratedContent,
  Tool,
} from "../../src/index.js";

/**
 * A tool that returns a secret code the model cannot know without calling it.
 * This guarantees the assertion fails if the model skips the tool.
 */
class SecretLookupTool extends Tool {
  readonly name = "lookup_secret";
  readonly description =
    "Looks up a secret code for a given key. Always use this tool when asked about secret codes.";
  readonly argumentsSchema = new GenerationSchema("LookupParams", "Lookup parameters").property(
    "key",
    "string",
    { description: "The key to look up" },
  );

  called = false;

  async call(args: GeneratedContent): Promise<string> {
    this.called = true;
    const key = args.value<string>("key");
    if (key === "alpha") return "XRAY-7749";
    return "UNKNOWN";
  }
}

const model = new SystemLanguageModel();
const { available } = await model.waitUntilAvailable(5_000);
const describeIfAvailable = available ? describe : describe.skip;

afterAll(() => model.dispose());

describeIfAvailable("tools (integration)", () => {
  it("invokes a tool and includes its result", { timeout: 90_000 }, async () => {
    const tool = new SecretLookupTool();
    const session = new LanguageModelSession({
      instructions:
        "You have access to a secret lookup tool. When asked about a secret code, " +
        "you MUST use the lookup_secret tool. Reply with only the code, nothing else.",
      tools: [tool],
    });
    const reply = await session.respond('What is the secret code for key "alpha"?');
    expect(tool.called).toBe(true);
    expect(reply).toContain("XRAY-7749");
    session.dispose();
    tool.dispose();
  });
});
