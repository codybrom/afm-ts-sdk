import { describe, it, expect, afterAll } from "vitest";
import OpenAI from "../../src/compat/index.js";

const client = new OpenAI();
afterAll(() => client.close());

describe("OpenAI compat integration", () => {
  it("basic text generation", async () => {
    const response = await client.chat.completions.create({
      model: "apple-intelligence",
      messages: [
        { role: "system", content: "Always respond with exactly one word." },
        { role: "user", content: "What color is the sky?" },
      ],
    });

    expect(response.object).toBe("chat.completion");
    expect(response.choices).toHaveLength(1);
    expect(response.choices[0].message.role).toBe("assistant");
    expect(typeof response.choices[0].message.content).toBe("string");
    expect(response.choices[0].finish_reason).toBe("stop");
    expect(response.id).toMatch(/^chatcmpl-/);
    expect(response.usage).toBeNull();
    expect(response.system_fingerprint).toBeNull();
  });

  it("multi-turn conversation", async () => {
    const response = await client.chat.completions.create({
      messages: [
        { role: "user", content: "What is 2+2?" },
        { role: "assistant", content: "4" },
        { role: "user", content: "Multiply that by 3" },
      ],
    });

    const content = response.choices[0].message.content ?? "";
    expect(content).toContain("12");
  });

  it("streaming", async () => {
    const stream = await client.chat.completions.create({
      messages: [
        { role: "system", content: "You are a math tutor. Answer concisely." },
        { role: "user", content: "What is 10 + 5?" },
      ],
      stream: true,
    });

    const chunks: string[] = [];
    for await (const chunk of stream) {
      if (chunk.choices[0].delta.content) {
        chunks.push(chunk.choices[0].delta.content);
      }
    }

    expect(chunks.length).toBeGreaterThan(0);
    const full = chunks.join("");
    expect(full).toContain("15");
  });

  it("structured output with json_schema", async () => {
    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: "Extract: John is 30 years old" }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "Person",
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              age: { type: "integer" },
            },
            required: ["name", "age"],
          },
        },
      },
    });

    const parsed = JSON.parse(response.choices[0].message.content!);
    expect(parsed.name).toContain("John");
    expect(parsed.age).toBe(30);
  });

  it("generation options (temperature, max_tokens)", async () => {
    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: "Say hello" }],
      temperature: 0,
      max_tokens: 50,
    });

    expect(typeof response.choices[0].message.content).toBe("string");
  });
});
