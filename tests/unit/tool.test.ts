import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFns, mockKoffi, capturedCallbacks, capturedRegistryCallback } = vi.hoisted(() => {
  const capturedCallbacks: Array<(contentRef: unknown, callId: number) => void> = [];
  let registryCb: ((held: { ptr: unknown; callbackPtr: unknown }) => void) | null = null;
  globalThis.FinalizationRegistry = class MockFinalizationRegistry {
    constructor(callback: (held: { ptr: unknown; callbackPtr: unknown }) => void) {
      registryCb = callback;
    }
    register() {}
    unregister() {}
  } as unknown as typeof FinalizationRegistry;
  return {
    mockFns: {
      FMBridgedToolCreate: vi.fn((): string | null => "mock-tool-ptr"),
      FMBridgedToolFinishCall: vi.fn(),
      FMRelease: vi.fn(),
    },
    mockKoffi: {
      register: vi.fn((cb: unknown, _proto: unknown) => {
        capturedCallbacks.push(cb as (contentRef: unknown, callId: number) => void);
        return "mock-cb-ptr";
      }),
      unregister: vi.fn(),
      pointer: vi.fn((_proto: unknown) => "mock-proto-ptr"),
    },
    capturedCallbacks,
    capturedRegistryCallback: () => registryCb,
  };
});

vi.mock("koffi", () => ({
  default: mockKoffi,
}));

vi.mock("../../src/bindings.js", () => ({
  getFunctions: () => mockFns,
  decodeAndFreeString: vi.fn(),
  ToolCallbackProto: "ToolCallbackProto",
}));

vi.mock("../../src/schema.js", () => ({
  GenerationSchema: class MockSchema {
    _ptr = "mock-schema-ptr";
  },
  GeneratedContent: class MockContent {
    _ptr: unknown;
    constructor(ptr: unknown) {
      this._ptr = ptr;
    }
  },
}));

vi.mock("../../src/errors.js", () => ({
  statusToError: vi.fn((_code: number, msg?: string) => new Error(msg ?? "mock error")),
  ToolCallError: class extends Error {
    toolName: string;
    constructor(toolName: string, cause: Error) {
      super(`Tool '${toolName}' failed: ${cause.message}`);
      this.toolName = toolName;
    }
  },
}));

import { Tool } from "../../src/tool.js";
import { GenerationSchema } from "../../src/schema.js";

class TestTool extends Tool {
  readonly name = "test-tool";
  readonly description = "A test tool";
  readonly argumentsSchema = new GenerationSchema("TestArgs");

  async call(): Promise<string> {
    return "result";
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  capturedCallbacks.length = 0;
});

describe("Tool", () => {
  it("_register creates the C tool via FMBridgedToolCreate", () => {
    const tool = new TestTool();
    tool._register();
    expect(mockFns.FMBridgedToolCreate).toHaveBeenCalledWith(
      "test-tool",
      "A test tool",
      "mock-schema-ptr",
      "mock-cb-ptr",
      expect.any(Array),
      null,
    );
    expect(tool._ptr).toBe("mock-tool-ptr");
  });

  it("_register is idempotent", () => {
    const tool = new TestTool();
    tool._register();
    tool._register();
    expect(mockFns.FMBridgedToolCreate).toHaveBeenCalledTimes(1);
  });

  it("_register throws when C returns null", () => {
    mockFns.FMBridgedToolCreate.mockReturnValueOnce(null);
    const tool = new TestTool();
    expect(() => tool._register()).toThrow();
  });

  it("dispose releases pointer and unregisters callback", () => {
    const tool = new TestTool();
    tool._register();
    vi.clearAllMocks();
    tool.dispose();
    expect(mockKoffi.unregister).toHaveBeenCalledWith("mock-cb-ptr");
    expect(mockFns.FMRelease).toHaveBeenCalledWith("mock-tool-ptr");
    expect(tool._ptr).toBeNull();
  });

  it("dispose is safe to call twice", () => {
    const tool = new TestTool();
    tool._register();
    tool.dispose();
    vi.clearAllMocks();
    tool.dispose();
    expect(mockKoffi.unregister).not.toHaveBeenCalled();
    expect(mockFns.FMRelease).not.toHaveBeenCalled();
  });

  describe("koffi callback handler", () => {
    it("calls FMBridgedToolFinishCall with the result on success", async () => {
      const tool = new TestTool();
      tool._register();

      expect(capturedCallbacks).toHaveLength(1);
      const callback = capturedCallbacks[0];

      // Invoke the captured callback as if the C side called it
      callback("mock-content-ref", 42);

      // Wait for the async call() to resolve
      await vi.waitFor(() => {
        expect(mockFns.FMBridgedToolFinishCall).toHaveBeenCalledTimes(1);
      });

      expect(mockFns.FMBridgedToolFinishCall).toHaveBeenCalledWith("mock-tool-ptr", 42, "result");
    });

    it("calls FMBridgedToolFinishCall with error message when call() throws an Error", async () => {
      class FailingTool extends Tool {
        readonly name = "failing-tool";
        readonly description = "A tool that fails";
        readonly argumentsSchema = new GenerationSchema("FailArgs");

        async call(): Promise<string> {
          throw new Error("something went wrong");
        }
      }

      const tool = new FailingTool();
      tool._register();

      const callback = capturedCallbacks[0];
      callback("mock-content-ref", 99);

      await vi.waitFor(() => {
        expect(mockFns.FMBridgedToolFinishCall).toHaveBeenCalledTimes(1);
      });

      expect(mockFns.FMBridgedToolFinishCall).toHaveBeenCalledWith(
        "mock-tool-ptr",
        99,
        "Tool 'failing-tool' failed: something went wrong",
      );
    });

    it("calls FMBridgedToolFinishCall with error message when call() throws a non-Error", async () => {
      class StringThrowingTool extends Tool {
        readonly name = "string-thrower";
        readonly description = "A tool that throws a string";
        readonly argumentsSchema = new GenerationSchema("ThrowArgs");

        async call(): Promise<string> {
          throw "raw string error";
        }
      }

      const tool = new StringThrowingTool();
      tool._register();

      const callback = capturedCallbacks[0];
      callback("mock-content-ref", 7);

      await vi.waitFor(() => {
        expect(mockFns.FMBridgedToolFinishCall).toHaveBeenCalledTimes(1);
      });

      expect(mockFns.FMBridgedToolFinishCall).toHaveBeenCalledWith(
        "mock-tool-ptr",
        7,
        "Tool 'string-thrower' failed: raw string error",
      );
    });

    it("passes contentRef to GeneratedContent and then to call()", async () => {
      const callSpy = vi.fn().mockResolvedValue("ok");

      class SpyTool extends Tool {
        readonly name = "spy-tool";
        readonly description = "A spy tool";
        readonly argumentsSchema = new GenerationSchema("SpyArgs");

        call = callSpy;
      }

      const tool = new SpyTool();
      tool._register();

      const callback = capturedCallbacks[0];
      callback("special-content-ref", 1);

      await vi.waitFor(() => {
        expect(callSpy).toHaveBeenCalledTimes(1);
      });

      // The callback should have created a GeneratedContent with the contentRef
      const contentArg = callSpy.mock.calls[0][0];
      expect(contentArg._ptr).toBe("special-content-ref");
    });
  });

  describe("FinalizationRegistry cleanup", () => {
    it("unregisters callback and releases pointer when GC fires", () => {
      const cleanup = capturedRegistryCallback();
      expect(cleanup).toBeTypeOf("function");
      cleanup!({ ptr: "gc-tool-ptr", callbackPtr: "gc-cb-ptr" });
      expect(mockKoffi.unregister).toHaveBeenCalledWith("gc-cb-ptr");
      expect(mockFns.FMRelease).toHaveBeenCalledWith("gc-tool-ptr");
    });

    it("swallows errors from koffi.unregister in GC callback", () => {
      mockKoffi.unregister.mockImplementationOnce(() => {
        throw new Error("already unregistered");
      });
      const cleanup = capturedRegistryCallback();
      // Should not throw, and should still attempt FMRelease
      expect(() => cleanup!({ ptr: "gc-ptr", callbackPtr: "bad-cb" })).not.toThrow();
      expect(mockFns.FMRelease).toHaveBeenCalledWith("gc-ptr");
    });

    it("swallows errors from FMRelease in GC callback", () => {
      mockFns.FMRelease.mockImplementationOnce(() => {
        throw new Error("already freed");
      });
      const cleanup = capturedRegistryCallback();
      expect(() => cleanup!({ ptr: "bad-ptr", callbackPtr: "gc-cb" })).not.toThrow();
    });
  });
});
