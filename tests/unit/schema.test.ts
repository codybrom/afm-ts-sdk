import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockFunctions } from "./helpers/mock-bindings.js";

const mockFns = createMockFunctions();
vi.mock("../../src/bindings.js", () => ({
  getFunctions: () => mockFns,
  decodeAndFreeString: vi.fn((ptr: unknown) => {
    if (!ptr) return null;
    return '{"name":"test"}';
  }),
}));

import {
  GeneratedContent,
  GenerationGuide,
  GenerationSchema,
  GenerationSchemaProperty,
} from "../../src/schema.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GenerationGuide", () => {
  it("anyOf creates guide with string values", () => {
    const guide = GenerationGuide.anyOf(["a", "b", "c"]);
    expect(guide).toBeInstanceOf(GenerationGuide);
  });

  it("constant creates guide with single value", () => {
    const guide = GenerationGuide.constant("hello");
    expect(guide).toBeInstanceOf(GenerationGuide);
  });

  it("count creates guide with number", () => {
    const guide = GenerationGuide.count(5);
    expect(guide).toBeInstanceOf(GenerationGuide);
  });

  it("range creates guide with min and max", () => {
    const guide = GenerationGuide.range(0, 100);
    expect(guide).toBeInstanceOf(GenerationGuide);
  });

  it("regex creates guide with pattern", () => {
    const guide = GenerationGuide.regex("^[a-z]+$");
    expect(guide).toBeInstanceOf(GenerationGuide);
  });

  it("minimum creates guide", () => {
    expect(GenerationGuide.minimum(0)).toBeInstanceOf(GenerationGuide);
  });

  it("maximum creates guide", () => {
    expect(GenerationGuide.maximum(100)).toBeInstanceOf(GenerationGuide);
  });

  it("minItems creates guide", () => {
    expect(GenerationGuide.minItems(1)).toBeInstanceOf(GenerationGuide);
  });

  it("maxItems creates guide", () => {
    expect(GenerationGuide.maxItems(10)).toBeInstanceOf(GenerationGuide);
  });

  it("element wraps inner guide", () => {
    const inner = GenerationGuide.range(0, 10);
    expect(GenerationGuide.element(inner)).toBeInstanceOf(GenerationGuide);
  });
});

describe("GenerationGuide._applyToProperty", () => {
  it("anyOf calls FMGenerationSchemaPropertyAddAnyOfGuide", () => {
    const guide = GenerationGuide.anyOf(["a", "b"]);
    guide._applyToProperty("mock-ptr");
    expect(mockFns.FMGenerationSchemaPropertyAddAnyOfGuide).toHaveBeenCalledWith(
      "mock-ptr",
      ["a", "b"],
      2,
      false,
    );
  });

  it("constant calls FMGenerationSchemaPropertyAddAnyOfGuide with single value", () => {
    const guide = GenerationGuide.constant("fixed");
    guide._applyToProperty("mock-ptr");
    expect(mockFns.FMGenerationSchemaPropertyAddAnyOfGuide).toHaveBeenCalledWith(
      "mock-ptr",
      ["fixed"],
      1,
      false,
    );
  });

  it("count calls FMGenerationSchemaPropertyAddCountGuide", () => {
    const guide = GenerationGuide.count(3);
    guide._applyToProperty("mock-ptr");
    expect(mockFns.FMGenerationSchemaPropertyAddCountGuide).toHaveBeenCalledWith(
      "mock-ptr",
      3,
      false,
    );
  });

  it("range calls FMGenerationSchemaPropertyAddRangeGuide", () => {
    const guide = GenerationGuide.range(1, 10);
    guide._applyToProperty("mock-ptr");
    expect(mockFns.FMGenerationSchemaPropertyAddRangeGuide).toHaveBeenCalledWith(
      "mock-ptr",
      1,
      10,
      false,
    );
  });

  it("regex calls FMGenerationSchemaPropertyAddRegex", () => {
    const guide = GenerationGuide.regex("^\\d+$");
    guide._applyToProperty("mock-ptr");
    expect(mockFns.FMGenerationSchemaPropertyAddRegex).toHaveBeenCalledWith(
      "mock-ptr",
      "^\\d+$",
      false,
    );
  });

  it("minimum calls FMGenerationSchemaPropertyAddMinimumGuide", () => {
    GenerationGuide.minimum(5)._applyToProperty("mock-ptr");
    expect(mockFns.FMGenerationSchemaPropertyAddMinimumGuide).toHaveBeenCalledWith(
      "mock-ptr",
      5,
      false,
    );
  });

  it("maximum calls FMGenerationSchemaPropertyAddMaximumGuide", () => {
    GenerationGuide.maximum(50)._applyToProperty("mock-ptr");
    expect(mockFns.FMGenerationSchemaPropertyAddMaximumGuide).toHaveBeenCalledWith(
      "mock-ptr",
      50,
      false,
    );
  });

  it("minItems calls FMGenerationSchemaPropertyAddMinItemsGuide", () => {
    GenerationGuide.minItems(2)._applyToProperty("mock-ptr");
    expect(mockFns.FMGenerationSchemaPropertyAddMinItemsGuide).toHaveBeenCalledWith("mock-ptr", 2);
  });

  it("maxItems calls FMGenerationSchemaPropertyAddMaxItemsGuide", () => {
    GenerationGuide.maxItems(8)._applyToProperty("mock-ptr");
    expect(mockFns.FMGenerationSchemaPropertyAddMaxItemsGuide).toHaveBeenCalledWith("mock-ptr", 8);
  });

  it("element unwraps and applies inner guide with wrapped=true", () => {
    const inner = GenerationGuide.range(0, 10);
    GenerationGuide.element(inner)._applyToProperty("mock-ptr");
    expect(mockFns.FMGenerationSchemaPropertyAddRangeGuide).toHaveBeenCalledWith(
      "mock-ptr",
      0,
      10,
      true,
    );
  });
});

describe("GenerationSchemaProperty", () => {
  it("creates property with name and type", () => {
    const prop = new GenerationSchemaProperty("name", "string");
    expect(mockFns.FMGenerationSchemaPropertyCreate).toHaveBeenCalledWith(
      "name",
      null,
      "string",
      false,
    );
    expect(prop._ptr).toBe("mock-prop-ptr");
  });

  it("passes description and optional flag", () => {
    new GenerationSchemaProperty("age", "integer", {
      description: "Age in years",
      optional: true,
    });
    expect(mockFns.FMGenerationSchemaPropertyCreate).toHaveBeenCalledWith(
      "age",
      "Age in years",
      "integer",
      true,
    );
  });

  it("applies guides during construction", () => {
    new GenerationSchemaProperty("score", "number", {
      guides: [GenerationGuide.range(0, 100)],
    });
    expect(mockFns.FMGenerationSchemaPropertyAddRangeGuide).toHaveBeenCalled();
  });
});

describe("GenerationSchema", () => {
  it("creates schema with name and description", () => {
    const schema = new GenerationSchema("Cat", "A cat");
    expect(mockFns.FMGenerationSchemaCreate).toHaveBeenCalledWith("Cat", "A cat");
    expect(schema._ptr).toBe("mock-schema-ptr");
  });

  it("creates schema with null description when omitted", () => {
    new GenerationSchema("Dog");
    expect(mockFns.FMGenerationSchemaCreate).toHaveBeenCalledWith("Dog", null);
  });

  it("addProperty calls FFI and returns this for chaining", () => {
    const schema = new GenerationSchema("Test");
    const prop = new GenerationSchemaProperty("field", "string");
    const result = schema.addProperty(prop);
    expect(mockFns.FMGenerationSchemaAddProperty).toHaveBeenCalledWith(
      "mock-schema-ptr",
      "mock-prop-ptr",
    );
    expect(result).toBe(schema);
  });

  it("property() convenience method chains", () => {
    const schema = new GenerationSchema("Test")
      .property("name", "string")
      .property("age", "integer");
    expect(mockFns.FMGenerationSchemaAddProperty).toHaveBeenCalledTimes(2);
    expect(schema._ptr).toBe("mock-schema-ptr");
  });

  it("addReferenceSchema calls FFI", () => {
    const schema = new GenerationSchema("Main");
    const ref = new GenerationSchema("Ref");
    schema.addReferenceSchema(ref);
    expect(mockFns.FMGenerationSchemaAddReferenceSchema).toHaveBeenCalledWith(
      "mock-schema-ptr",
      "mock-schema-ptr",
    );
  });

  it("toDict parses JSON from FFI", () => {
    const schema = new GenerationSchema("Test");
    const dict = schema.toDict();
    expect(dict).toEqual({ name: "test" });
  });

  it("toDict throws when decodeAndFreeString returns null", async () => {
    const mod = await import("../../src/bindings.js");
    const mockDecode = mod.decodeAndFreeString as ReturnType<typeof vi.fn>;
    mockDecode.mockReturnValueOnce(null);

    const schema = new GenerationSchema("Bad");
    expect(() => schema.toDict()).toThrow();
  });
});

describe("GeneratedContent", () => {
  // Get a handle on the mocked decodeAndFreeString so we can control it per-test
  let mockDecodeAndFreeString: ReturnType<typeof vi.fn>;
  beforeEach(async () => {
    const mod = await import("../../src/bindings.js");
    mockDecodeAndFreeString = mod.decodeAndFreeString as ReturnType<typeof vi.fn>;
  });

  it("fromJson creates instance from JSON string", () => {
    const content = GeneratedContent.fromJson('{"name":"test"}');
    expect(mockFns.FMGeneratedContentCreateFromJSON).toHaveBeenCalledWith(
      '{"name":"test"}',
      [0],
      null,
    );
    expect(content).toBeInstanceOf(GeneratedContent);
    expect(content._ptr).toBe("mock-content-ptr");
  });

  it("fromJson throws when C returns null pointer", () => {
    mockFns.FMGeneratedContentCreateFromJSON.mockReturnValueOnce(null);
    expect(() => GeneratedContent.fromJson("bad")).toThrow();
  });

  it("isComplete returns boolean from FFI", () => {
    const content = new GeneratedContent("mock-ptr");
    expect(content.isComplete).toBe(true);
    expect(mockFns.FMGeneratedContentIsComplete).toHaveBeenCalledWith("mock-ptr");

    mockFns.FMGeneratedContentIsComplete.mockReturnValueOnce(false);
    expect(content.isComplete).toBe(false);
  });

  it("toJson returns JSON string via decodeAndFreeString", () => {
    const content = new GeneratedContent("mock-ptr");
    const json = content.toJson();
    expect(mockFns.FMGeneratedContentGetJSONString).toHaveBeenCalledWith("mock-ptr");
    expect(json).toBe('{"name":"test"}');
  });

  it('toJson returns "{}" when decodeAndFreeString returns null', () => {
    mockFns.FMGeneratedContentGetJSONString.mockReturnValueOnce(null);
    const content = new GeneratedContent("mock-ptr");
    const json = content.toJson();
    expect(json).toBe("{}");
  });

  it("toObject parses JSON and caches result", () => {
    const content = new GeneratedContent("mock-ptr");
    const obj1 = content.toObject();
    expect(obj1).toEqual({ name: "test" });

    // Second call should use cached value — no additional FFI call
    const callsBefore = mockFns.FMGeneratedContentGetJSONString.mock.calls.length;
    const obj2 = content.toObject();
    expect(obj2).toBe(obj1); // same reference
    expect(mockFns.FMGeneratedContentGetJSONString.mock.calls.length).toBe(callsBefore);
  });

  it("value returns parsed JSON value when FFI returns non-null", () => {
    mockFns.FMGeneratedContentGetPropertyValue.mockReturnValueOnce("mock-value-ptr");
    mockDecodeAndFreeString.mockReturnValueOnce('"hello"');
    const content = new GeneratedContent("mock-ptr");
    const result = content.value<string>("greeting");
    expect(result).toBe("hello");
    expect(mockFns.FMGeneratedContentGetPropertyValue).toHaveBeenCalledWith(
      "mock-ptr",
      "greeting",
      null,
      null,
    );
  });

  it("value returns raw string when JSON.parse fails", () => {
    mockFns.FMGeneratedContentGetPropertyValue.mockReturnValueOnce("mock-value-ptr");
    mockDecodeAndFreeString.mockReturnValueOnce("not-valid-json");
    const content = new GeneratedContent("mock-ptr");
    const result = content.value<string>("field");
    expect(result).toBe("not-valid-json");
  });

  it("value falls back to toObject when FFI returns null", () => {
    // FMGeneratedContentGetPropertyValue returns null by default
    // decodeAndFreeString(null) returns null per the mock setup
    // toJson's decodeAndFreeString call returns the default '{"name":"test"}'
    const content = new GeneratedContent("mock-ptr");
    const result = content.value<string>("name");
    expect(result).toBe("test");
  });

  it("value throws when property not found anywhere", () => {
    const content = new GeneratedContent("mock-ptr");
    expect(() => content.value("nonexistent")).toThrow(
      "Property 'nonexistent' not found in generated content",
    );
  });
});
