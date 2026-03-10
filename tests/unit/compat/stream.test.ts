import { describe, it, expect } from "vitest";
import { Stream } from "../../../src/compat/stream.js";
import type { ChatCompletionChunk } from "../../../src/compat/types.js";

function makeChunk(content: string | null, finishReason: string | null = null): ChatCompletionChunk {
  return {
    id: "chatcmpl-test",
    object: "chat.completion.chunk",
    created: 1234567890,
    model: "apple-intelligence",
    choices: [
      {
        index: 0,
        delta: content != null ? { content } : {},
        finish_reason: finishReason as any,
      },
    ],
    usage: null,
    system_fingerprint: null,
  };
}

async function* makeSource(chunks: ChatCompletionChunk[]): AsyncIterable<ChatCompletionChunk> {
  for (const chunk of chunks) {
    yield chunk;
  }
}

describe("Stream", () => {
  it("is async iterable (for await works)", async () => {
    const chunks = [makeChunk("hello")];
    const stream = new Stream(makeSource(chunks));

    const results: ChatCompletionChunk[] = [];
    for await (const chunk of stream) {
      results.push(chunk);
    }

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(chunks[0]);
  });

  it("yields multiple chunks in order", async () => {
    const chunks = [makeChunk("hello"), makeChunk(" world"), makeChunk(null, "stop")];
    const stream = new Stream(makeSource(chunks));

    const results: ChatCompletionChunk[] = [];
    for await (const chunk of stream) {
      results.push(chunk);
    }

    expect(results).toHaveLength(3);
    expect(results[0].choices[0].delta).toEqual({ content: "hello" });
    expect(results[1].choices[0].delta).toEqual({ content: " world" });
    expect(results[2].choices[0].finish_reason).toBe("stop");
  });

  it("toReadableStream() returns a ReadableStream", () => {
    const stream = new Stream(makeSource([]));
    const readable = stream.toReadableStream();
    expect(readable).toBeInstanceOf(ReadableStream);
  });

  it("ReadableStream provides chunks correctly", async () => {
    const chunks = [makeChunk("foo"), makeChunk("bar"), makeChunk(null, "stop")];
    const stream = new Stream(makeSource(chunks));
    const readable = stream.toReadableStream();

    const reader = readable.getReader();
    const results: ChatCompletionChunk[] = [];

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      results.push(value);
    }

    expect(results).toHaveLength(3);
    expect(results[0].choices[0].delta).toEqual({ content: "foo" });
    expect(results[1].choices[0].delta).toEqual({ content: "bar" });
    expect(results[2].choices[0].finish_reason).toBe("stop");
  });
});
