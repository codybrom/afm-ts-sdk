import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockFunctions } from "./helpers/mock-bindings.js";

const { capturedSessionRegistryCallback } = vi.hoisted(() => {
  let registryCb: ((ptr: unknown) => void) | null = null;
  globalThis.FinalizationRegistry = class MockFinalizationRegistry {
    constructor(callback: (ptr: unknown) => void) {
      registryCb = callback;
    }
    register() {}
    unregister() {}
  } as unknown as typeof FinalizationRegistry;
  return { capturedSessionRegistryCallback: () => registryCb };
});

const mockFns = createMockFunctions();

let lastRegisteredCallback: ((...args: unknown[]) => void) | null = null;

vi.mock("koffi", () => ({
  default: {
    register: vi.fn((cb: (...args: unknown[]) => void, _proto: unknown) => {
      lastRegisteredCallback = cb;
      return "mock-cb-ptr";
    }),
    unregister: vi.fn(),
    as: vi.fn((_arr: unknown[], _type: string) => "mock-arr-ptr"),
    pointer: vi.fn((_proto: unknown) => "mock-proto-ptr"),
  },
}));

vi.mock("../../src/bindings.js", () => ({
  getFunctions: () => mockFns,
  decodeAndFreeString: vi.fn((ptr: unknown) => {
    if (!ptr) return null;
    return '{"key":"value"}';
  }),
  ResponseCallbackProto: "ResponseCallbackProto",
  StructuredResponseCallbackProto: "StructuredResponseCallbackProto",
}));

vi.mock("../../src/tool.js", () => ({
  Tool: class MockTool {
    _ptr = "mock-tool-ptr";
    _register() {}
  },
}));

import { LanguageModelSession } from "../../src/session.js";

beforeEach(() => {
  vi.clearAllMocks();
  lastRegisteredCallback = null;
});

describe("LanguageModelSession", () => {
  it("creates session with default options", () => {
    const session = new LanguageModelSession();
    expect(mockFns.FMLanguageModelSessionCreateFromSystemLanguageModel).toHaveBeenCalledWith(
      null,
      null,
      null,
      0,
    );
    expect(session._ptr).toBe("mock-session-ptr");
  });

  it("creates session with instructions", () => {
    new LanguageModelSession({ instructions: "Be helpful" });
    expect(mockFns.FMLanguageModelSessionCreateFromSystemLanguageModel).toHaveBeenCalledWith(
      null,
      "Be helpful",
      null,
      0,
    );
  });

  it("throws when C returns null pointer", () => {
    mockFns.FMLanguageModelSessionCreateFromSystemLanguageModel.mockReturnValueOnce(null);
    expect(() => new LanguageModelSession()).toThrow("Failed to create LanguageModelSession");
  });

  describe("isResponding", () => {
    it("returns false when not responding", () => {
      const session = new LanguageModelSession();
      expect(session.isResponding).toBe(false);
    });

    it("returns false when ptr is null (disposed)", () => {
      const session = new LanguageModelSession();
      session.dispose();
      expect(session.isResponding).toBe(false);
    });
  });

  describe("respond", () => {
    it("resolves with response text on success", async () => {
      mockFns.FMLanguageModelSessionRespond.mockImplementation(() => {
        setTimeout(() => {
          lastRegisteredCallback?.(0, "Hello world", 11, null);
        }, 0);
        return "mock-task-ptr";
      });

      const session = new LanguageModelSession();
      const result = await session.respond("Hi");
      expect(result).toBe("Hello world");
    });

    it("resolves with empty string when content is null", async () => {
      mockFns.FMLanguageModelSessionRespond.mockImplementation(() => {
        setTimeout(() => {
          lastRegisteredCallback?.(0, null, 0, null);
        }, 0);
        return "mock-task-ptr";
      });

      const session = new LanguageModelSession();
      const result = await session.respond("Hi");
      expect(result).toBe("");
    });

    it("keepalive interval fires while waiting for callback", async () => {
      vi.useFakeTimers();
      mockFns.FMLanguageModelSessionRespond.mockImplementation(() => {
        // Schedule callback after 15s so the 10s keepalive fires first
        setTimeout(() => {
          lastRegisteredCallback?.(0, "delayed", 7, null);
        }, 15000);
        return "mock-task-ptr";
      });

      const session = new LanguageModelSession();
      const promise = session.respond("Hi");
      await vi.advanceTimersByTimeAsync(15000);
      const result = await promise;
      expect(result).toBe("delayed");
      vi.useRealTimers();
    });

    it("rejects with error on non-zero status", async () => {
      mockFns.FMLanguageModelSessionRespond.mockImplementation(() => {
        setTimeout(() => {
          lastRegisteredCallback?.(7, "Rate limited", 12, null);
        }, 0);
        return "mock-task-ptr";
      });

      const session = new LanguageModelSession();
      await expect(session.respond("Hi")).rejects.toThrow("Rate limited");
    });
  });

  describe("cancel", () => {
    it("calls FMTaskCancel and FMLanguageModelSessionReset", () => {
      const session = new LanguageModelSession();
      (session as unknown as { _activeTask: unknown })._activeTask = "mock-task";
      session.cancel();
      expect(mockFns.FMTaskCancel).toHaveBeenCalledWith("mock-task");
      expect(mockFns.FMLanguageModelSessionReset).toHaveBeenCalledWith("mock-session-ptr");
    });
  });

  describe("dispose", () => {
    it("releases the session pointer", () => {
      const session = new LanguageModelSession();
      session.dispose();
      expect(mockFns.FMRelease).toHaveBeenCalledWith("mock-session-ptr");
      expect(session._ptr).toBeNull();
    });

    it("is safe to call twice", () => {
      const session = new LanguageModelSession();
      session.dispose();
      session.dispose();
      expect(mockFns.FMRelease).toHaveBeenCalledTimes(1);
    });
  });

  describe("cancel", () => {
    it("does nothing when no active task and ptr is null", () => {
      const session = new LanguageModelSession();
      session.dispose(); // sets _ptr to null
      session.cancel();
      expect(mockFns.FMTaskCancel).not.toHaveBeenCalled();
      expect(mockFns.FMLanguageModelSessionReset).not.toHaveBeenCalled();
    });

    it("resets session but does not cancel when no active task", () => {
      const session = new LanguageModelSession();
      session.cancel();
      expect(mockFns.FMTaskCancel).not.toHaveBeenCalled();
      expect(mockFns.FMLanguageModelSessionReset).toHaveBeenCalledWith("mock-session-ptr");
    });
  });

  describe("respondWithSchema", () => {
    it("keepalive interval fires while waiting for structured callback", async () => {
      vi.useFakeTimers();
      mockFns.FMLanguageModelSessionRespondWithSchema.mockImplementation(() => {
        setTimeout(() => {
          lastRegisteredCallback?.(0, "mock-content-ref", null);
        }, 15000);
        return "mock-task-ptr";
      });

      const session = new LanguageModelSession();
      const mockSchema = { _ptr: "mock-schema-ptr" };
      const promise = session.respondWithSchema("Describe", mockSchema as never);
      await vi.advanceTimersByTimeAsync(15000);
      const result = await promise;
      expect(result._ptr).toBe("mock-content-ref");
      vi.useRealTimers();
    });

    it("resolves with GeneratedContent on success", async () => {
      mockFns.FMLanguageModelSessionRespondWithSchema.mockImplementation(() => {
        setTimeout(() => {
          lastRegisteredCallback?.(0, "mock-content-ref", null);
        }, 0);
        return "mock-task-ptr";
      });

      const session = new LanguageModelSession();
      const mockSchema = { _ptr: "mock-schema-ptr" };
      const result = await session.respondWithSchema("Describe", mockSchema as never);
      expect(result).toBeDefined();
      expect(result._ptr).toBe("mock-content-ref");
    });

    it("rejects with error on non-zero status", async () => {
      mockFns.FMLanguageModelSessionRespondWithSchema.mockImplementation(() => {
        setTimeout(() => {
          lastRegisteredCallback?.(3, "mock-content-ref", null);
        }, 0);
        return "mock-task-ptr";
      });

      const session = new LanguageModelSession();
      const mockSchema = { _ptr: "mock-schema-ptr" };
      await expect(session.respondWithSchema("Describe", mockSchema as never)).rejects.toThrow(
        "Guardrail violation",
      );
      expect(mockFns.FMGeneratedContentGetJSONString).toHaveBeenCalledWith("mock-content-ref");
      expect(mockFns.FMRelease).toHaveBeenCalledWith("mock-content-ref");
    });

    it("passes generation options to the C function", async () => {
      mockFns.FMLanguageModelSessionRespondWithSchema.mockImplementation((..._args: unknown[]) => {
        setTimeout(() => {
          lastRegisteredCallback?.(0, "mock-content-ref", null);
        }, 0);
        return "mock-task-ptr";
      });

      const session = new LanguageModelSession();
      const mockSchema = { _ptr: "mock-schema-ptr" };
      await session.respondWithSchema("Describe", mockSchema as never, {
        options: { temperature: 0.5 },
      });

      expect(mockFns.FMLanguageModelSessionRespondWithSchema).toHaveBeenCalledWith(
        "mock-session-ptr",
        "Describe",
        "mock-schema-ptr",
        JSON.stringify({ temperature: 0.5 }),
        null,
        "mock-cb-ptr",
      );
    });
  });

  describe("respondWithJsonSchema", () => {
    it("resolves with GeneratedContent on success", async () => {
      mockFns.FMLanguageModelSessionRespondWithSchemaFromJSON.mockImplementation(
        (..._args: unknown[]) => {
          setTimeout(() => {
            lastRegisteredCallback?.(0, "mock-content-ref", null);
          }, 0);
          return "mock-task-ptr";
        },
      );

      const session = new LanguageModelSession();
      const jsonSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      };
      const result = await session.respondWithJsonSchema("Extract info", jsonSchema);
      expect(result).toBeDefined();
      expect(result._ptr).toBe("mock-content-ref");
    });

    it("applies _toAppleSchemaFormat transformations", async () => {
      mockFns.FMLanguageModelSessionRespondWithSchemaFromJSON.mockImplementation(
        (..._args: unknown[]) => {
          setTimeout(() => {
            lastRegisteredCallback?.(0, "mock-content-ref", null);
          }, 0);
          return "mock-task-ptr";
        },
      );

      const session = new LanguageModelSession();
      const jsonSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      };
      await session.respondWithJsonSchema("Extract", jsonSchema);

      const calledSchema = JSON.parse(
        mockFns.FMLanguageModelSessionRespondWithSchemaFromJSON.mock.calls[0][2] as string,
      );
      expect(calledSchema.title).toBe("Schema");
      expect(calledSchema.additionalProperties).toBe(false);
      expect(calledSchema["x-order"]).toEqual(["name", "age"]);
    });

    it("handles schema without properties key", async () => {
      mockFns.FMLanguageModelSessionRespondWithSchemaFromJSON.mockImplementation(
        (..._args: unknown[]) => {
          setTimeout(() => {
            lastRegisteredCallback?.(0, "mock-content-ref", null);
          }, 0);
          return "mock-task-ptr";
        },
      );

      const session = new LanguageModelSession();
      const jsonSchema = { type: "object" }; // no properties key
      await session.respondWithJsonSchema("Extract", jsonSchema);

      const calledSchema = JSON.parse(
        mockFns.FMLanguageModelSessionRespondWithSchemaFromJSON.mock.calls[0][2] as string,
      );
      expect(calledSchema["x-order"]).toEqual([]);
      expect(calledSchema.additionalProperties).toBe(false);
    });

    it("preserves existing x-order if provided", async () => {
      mockFns.FMLanguageModelSessionRespondWithSchemaFromJSON.mockImplementation(
        (..._args: unknown[]) => {
          setTimeout(() => {
            lastRegisteredCallback?.(0, "mock-content-ref", null);
          }, 0);
          return "mock-task-ptr";
        },
      );

      const session = new LanguageModelSession();
      const jsonSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        "x-order": ["age", "name"],
      };
      await session.respondWithJsonSchema("Extract", jsonSchema);

      const calledSchema = JSON.parse(
        mockFns.FMLanguageModelSessionRespondWithSchemaFromJSON.mock.calls[0][2] as string,
      );
      expect(calledSchema["x-order"]).toEqual(["age", "name"]);
    });

    it("rejects with error on non-zero status", async () => {
      mockFns.FMLanguageModelSessionRespondWithSchemaFromJSON.mockImplementation(
        (..._args: unknown[]) => {
          setTimeout(() => {
            lastRegisteredCallback?.(7, "mock-content-ref", null);
          }, 0);
          return "mock-task-ptr";
        },
      );

      const session = new LanguageModelSession();
      await expect(
        session.respondWithJsonSchema("Extract", { type: "object", properties: {} }),
      ).rejects.toThrow("Rate limited");
    });

    it("rejects with undefined message when content JSON is null", async () => {
      mockFns.FMGeneratedContentGetJSONString.mockReturnValueOnce(null);
      mockFns.FMLanguageModelSessionRespondWithSchemaFromJSON.mockImplementation(
        (..._args: unknown[]) => {
          setTimeout(() => {
            lastRegisteredCallback?.(3, "mock-content-ref", null);
          }, 0);
          return "mock-task-ptr";
        },
      );

      const session = new LanguageModelSession();
      await expect(
        session.respondWithJsonSchema("Extract", { type: "object", properties: {} }),
      ).rejects.toThrow();
    });

    it("passes generation options", async () => {
      mockFns.FMLanguageModelSessionRespondWithSchemaFromJSON.mockImplementation(
        (..._args: unknown[]) => {
          setTimeout(() => {
            lastRegisteredCallback?.(0, "mock-content-ref", null);
          }, 0);
          return "mock-task-ptr";
        },
      );

      const session = new LanguageModelSession();
      await session.respondWithJsonSchema(
        "Extract",
        { type: "object", properties: {} },
        { options: { maximumResponseTokens: 100 } },
      );

      expect(mockFns.FMLanguageModelSessionRespondWithSchemaFromJSON).toHaveBeenCalledWith(
        "mock-session-ptr",
        "Extract",
        expect.any(String),
        JSON.stringify({ maximum_response_tokens: 100 }),
        null,
        "mock-cb-ptr",
      );
    });
  });

  describe("streamResponse", () => {
    it("keepalive interval fires while waiting for stream chunks", async () => {
      vi.useFakeTimers();
      mockFns.FMLanguageModelSessionResponseStreamIterate.mockImplementation(
        (_streamRef: unknown, _ui: unknown, _cbPtr: unknown) => {
          setTimeout(() => {
            lastRegisteredCallback?.(0, "chunk", 5, null);
            setTimeout(() => {
              lastRegisteredCallback?.(0, null, 0, null);
            }, 5000);
          }, 15000);
        },
      );

      const session = new LanguageModelSession();
      const chunks: string[] = [];
      const gen = session.streamResponse("Hi");
      const iterPromise = (async () => {
        for await (const chunk of gen) {
          chunks.push(chunk);
        }
      })();
      await vi.advanceTimersByTimeAsync(20000);
      await iterPromise;
      expect(chunks).toEqual(["chunk"]);
      vi.useRealTimers();
    });

    it("drains pre-queued items without awaiting", async () => {
      // Push items synchronously so the queue is non-empty before the generator awaits
      mockFns.FMLanguageModelSessionResponseStreamIterate.mockImplementation(
        (_streamRef: unknown, _ui: unknown, _cbPtr: unknown) => {
          lastRegisteredCallback?.(0, "sync chunk", 10, null);
          lastRegisteredCallback?.(0, null, 0, null);
        },
      );

      const session = new LanguageModelSession();
      const chunks: string[] = [];
      for await (const chunk of session.streamResponse("Hi")) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["sync chunk"]);
    });

    it("skips empty deltas from duplicate cumulative content", async () => {
      mockFns.FMLanguageModelSessionResponseStreamIterate.mockImplementation(
        (_streamRef: unknown, _ui: unknown, _cbPtr: unknown) => {
          setTimeout(() => {
            lastRegisteredCallback?.(0, "Hello", 5, null);
            setTimeout(() => {
              // Duplicate same cumulative content — delta is empty
              lastRegisteredCallback?.(0, "Hello", 5, null);
              setTimeout(() => {
                lastRegisteredCallback?.(0, "Hello world", 11, null);
                setTimeout(() => {
                  lastRegisteredCallback?.(0, null, 0, null);
                }, 0);
              }, 0);
            }, 0);
          }, 0);
        },
      );

      const session = new LanguageModelSession();
      const chunks: string[] = [];
      for await (const chunk of session.streamResponse("Hi")) {
        chunks.push(chunk);
      }
      // The duplicate "Hello" should not produce an empty delta
      expect(chunks).toEqual(["Hello", " world"]);
    });

    it("yields delta strings from cumulative snapshots", async () => {
      mockFns.FMLanguageModelSessionResponseStreamIterate.mockImplementation(
        (_streamRef: unknown, _ui: unknown, _cbPtr: unknown) => {
          setTimeout(() => {
            lastRegisteredCallback?.(0, "Hello", 5, null);
            setTimeout(() => {
              lastRegisteredCallback?.(0, "Hello world", 11, null);
              setTimeout(() => {
                lastRegisteredCallback?.(0, null, 0, null);
              }, 0);
            }, 0);
          }, 0);
        },
      );

      const session = new LanguageModelSession();
      const chunks: string[] = [];
      for await (const chunk of session.streamResponse("Hi")) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["Hello", " world"]);
    });

    it("throws on error status during streaming", async () => {
      mockFns.FMLanguageModelSessionResponseStreamIterate.mockImplementation(
        (_streamRef: unknown, _ui: unknown, _cbPtr: unknown) => {
          setTimeout(() => {
            lastRegisteredCallback?.(0, "partial", 7, null);
            setTimeout(() => {
              lastRegisteredCallback?.(3, "Guardrail violation", 19, null);
            }, 0);
          }, 0);
        },
      );

      const session = new LanguageModelSession();
      const chunks: string[] = [];
      try {
        for await (const chunk of session.streamResponse("Hi")) {
          chunks.push(chunk);
        }
        expect.unreachable("Should have thrown");
      } catch (err) {
        expect((err as Error).message).toContain("Guardrail violation");
      }
      expect(chunks).toEqual(["partial"]);
    });

    it("releases stream ref after completion", async () => {
      mockFns.FMLanguageModelSessionResponseStreamIterate.mockImplementation(
        (_streamRef: unknown, _ui: unknown, _cbPtr: unknown) => {
          setTimeout(() => {
            lastRegisteredCallback?.(0, "done", 4, null);
            setTimeout(() => {
              lastRegisteredCallback?.(0, null, 0, null);
            }, 0);
          }, 0);
        },
      );

      const session = new LanguageModelSession();
      const chunks: string[] = [];
      for await (const chunk of session.streamResponse("Hi")) {
        chunks.push(chunk);
      }
      expect(mockFns.FMRelease).toHaveBeenCalledWith("mock-stream-ptr");
    });

    it("passes options to FMLanguageModelSessionStreamResponse", async () => {
      mockFns.FMLanguageModelSessionResponseStreamIterate.mockImplementation(
        (_streamRef: unknown, _ui: unknown, _cbPtr: unknown) => {
          setTimeout(() => {
            lastRegisteredCallback?.(0, null, 0, null);
          }, 0);
        },
      );

      const session = new LanguageModelSession();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _chunk of session.streamResponse("Hi", {
        options: { temperature: 0.8 },
      })) {
        // drain
      }
      expect(mockFns.FMLanguageModelSessionStreamResponse).toHaveBeenCalledWith(
        "mock-session-ptr",
        "Hi",
        JSON.stringify({ temperature: 0.8 }),
      );
    });

    it("unregisters callback when consumer breaks early (stream not done)", async () => {
      mockFns.FMLanguageModelSessionResponseStreamIterate.mockImplementation(
        (_streamRef: unknown, _ui: unknown, _cbPtr: unknown) => {
          // Send a single chunk, then stop — never send the null end-of-stream signal
          setTimeout(() => {
            lastRegisteredCallback?.(0, "Hello", 5, null);
          }, 0);
        },
      );

      const koffiMod = await import("koffi");
      const session = new LanguageModelSession();
      const chunks: string[] = [];
      for await (const chunk of session.streamResponse("Hi")) {
        chunks.push(chunk);
        break; // consumer breaks early — streamDone is still false
      }
      expect(chunks).toEqual(["Hello"]);
      // The finally block should call koffi.unregister because streamDone is false
      expect(koffiMod.default.unregister).toHaveBeenCalledWith("mock-cb-ptr");
      expect(mockFns.FMRelease).toHaveBeenCalledWith("mock-stream-ptr");
    });

    it("handles empty stream (immediate null content)", async () => {
      mockFns.FMLanguageModelSessionResponseStreamIterate.mockImplementation(
        (_streamRef: unknown, _ui: unknown, _cbPtr: unknown) => {
          setTimeout(() => {
            lastRegisteredCallback?.(0, null, 0, null);
          }, 0);
        },
      );

      const session = new LanguageModelSession();
      const chunks: string[] = [];
      for await (const chunk of session.streamResponse("Hi")) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual([]);
    });
  });

  describe("fromTranscript", () => {
    it("creates a session from a transcript", () => {
      const mockTranscript = {
        _sessionPtr: "mock-transcript-session-ptr",
        _updateSessionPtr: vi.fn(),
      };

      const session = LanguageModelSession.fromTranscript(mockTranscript as never);
      expect(mockFns.FMLanguageModelSessionCreateFromTranscript).toHaveBeenCalledWith(
        "mock-transcript-session-ptr",
        null,
        null,
        0,
      );
      expect(session._ptr).toBe("mock-session-ptr");
      expect(mockTranscript._updateSessionPtr).toHaveBeenCalledWith("mock-session-ptr");
    });

    it("throws when C returns null pointer", () => {
      mockFns.FMLanguageModelSessionCreateFromTranscript.mockReturnValueOnce(null);
      const mockTranscript = {
        _sessionPtr: "mock-transcript-session-ptr",
        _updateSessionPtr: vi.fn(),
      };

      expect(() => LanguageModelSession.fromTranscript(mockTranscript as never)).toThrow(
        "Failed to create session from transcript",
      );
    });

    it("passes tools when provided", () => {
      const mockTranscript = {
        _sessionPtr: "mock-transcript-session-ptr",
        _updateSessionPtr: vi.fn(),
      };
      const mockTool = {
        _ptr: "mock-tool-ptr",
        _register: vi.fn(),
      };

      LanguageModelSession.fromTranscript(mockTranscript as never, {
        tools: [mockTool as never],
      });

      expect(mockTool._register).toHaveBeenCalled();
    });
  });

  describe("constructor with tools", () => {
    it("registers tools and passes tool pointers", () => {
      const mockTool = {
        _ptr: "mock-tool-ptr",
        _register: vi.fn(),
      };

      new LanguageModelSession({ tools: [mockTool as never] });
      expect(mockTool._register).toHaveBeenCalled();
    });
  });

  describe("_enqueue serialization", () => {
    it("serializes concurrent respond calls", async () => {
      const callOrder: number[] = [];

      mockFns.FMLanguageModelSessionRespond.mockImplementation(
        (_ptr: unknown, prompt: unknown, _opts: unknown, _ui: unknown, _cbPtr: unknown) => {
          const idx = prompt === "first" ? 1 : 2;
          callOrder.push(idx);
          setTimeout(() => {
            lastRegisteredCallback?.(0, `Response ${idx}`, 10, null);
          }, 0);
          return "mock-task-ptr";
        },
      );

      const session = new LanguageModelSession();
      const [r1, r2] = await Promise.all([session.respond("first"), session.respond("second")]);

      expect(r1).toBe("Response 1");
      expect(r2).toBe("Response 2");
      expect(callOrder).toEqual([1, 2]);
    });
  });

  describe("FinalizationRegistry cleanup", () => {
    it("releases pointer when GC callback fires", () => {
      const cleanup = capturedSessionRegistryCallback();
      expect(cleanup).toBeTypeOf("function");
      cleanup!("leaked-session-ptr");
      expect(mockFns.FMRelease).toHaveBeenCalledWith("leaked-session-ptr");
    });

    it("swallows errors in GC callback", () => {
      mockFns.FMRelease.mockImplementationOnce(() => {
        throw new Error("already released");
      });
      const cleanup = capturedSessionRegistryCallback();
      expect(() => cleanup!("bad-ptr")).not.toThrow();
    });
  });
});
