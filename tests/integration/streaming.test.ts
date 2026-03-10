import { describe, it, expect, afterAll } from "vitest";
import { SystemLanguageModel, LanguageModelSession } from "../../src/index.js";

const model = new SystemLanguageModel();
const { available } = await model.waitUntilAvailable(5_000);
const describeIfAvailable = available ? describe : describe.skip;

afterAll(() => model.dispose());

describeIfAvailable("streaming (integration)", () => {
  it("yields string chunks", async () => {
    const session = new LanguageModelSession();
    const chunks: string[] = [];
    for await (const chunk of session.streamResponse("Count from 1 to 3.")) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
    const full = chunks.join("");
    expect(full.length).toBeGreaterThan(0);
    session.dispose();
  }, 30_000);
});
