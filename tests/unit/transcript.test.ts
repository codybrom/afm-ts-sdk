import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockFunctions } from "./helpers/mock-bindings.js";

const mockFns = createMockFunctions();
const { mockDecodeAndFreeString } = vi.hoisted(() => ({
  mockDecodeAndFreeString: vi.fn((ptr: unknown) => {
    if (!ptr) return null;
    return '{"type":"transcript","entries":[]}';
  }),
}));

vi.mock("../../src/bindings.js", () => ({
  getFunctions: () => mockFns,
  decodeAndFreeString: mockDecodeAndFreeString,
}));

import { Transcript } from "../../src/transcript.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockDecodeAndFreeString.mockImplementation((ptr: unknown) => {
    if (!ptr) return null;
    return '{"type":"transcript","entries":[]}';
  });
});

describe("Transcript", () => {
  describe("toJson", () => {
    it("returns JSON string from C API", () => {
      const transcript = new Transcript("mock-session-ptr");
      const json = transcript.toJson();
      expect(json).toBe('{"type":"transcript","entries":[]}');
      expect(mockFns.FMLanguageModelSessionGetTranscriptJSONString).toHaveBeenCalledWith(
        "mock-session-ptr",
        null,
        null,
      );
    });

    it("throws when C API returns null", () => {
      mockDecodeAndFreeString.mockReturnValueOnce(null);
      const transcript = new Transcript("mock-session-ptr");
      expect(() => transcript.toJson()).toThrow("Failed to export transcript");
    });
  });

  describe("toDict", () => {
    it("returns parsed JSON object", () => {
      const transcript = new Transcript("mock-session-ptr");
      const dict = transcript.toDict();
      expect(dict).toEqual({ type: "transcript", entries: [] });
    });
  });

  describe("fromJson", () => {
    it("creates transcript from JSON string", () => {
      const transcript = Transcript.fromJson('{"type":"transcript"}');
      expect(mockFns.FMTranscriptCreateFromJSONString).toHaveBeenCalledWith(
        '{"type":"transcript"}',
        expect.any(Array),
        null,
      );
      expect(transcript._sessionPtr).toBe("mock-transcript-ptr");
    });

    it("throws when C returns null pointer", () => {
      mockFns.FMTranscriptCreateFromJSONString.mockReturnValueOnce(null);
      expect(() => Transcript.fromJson("bad json")).toThrow();
    });
  });

  describe("fromDict", () => {
    it("serializes dict to JSON and calls fromJson", () => {
      const dict = { type: "transcript", entries: [] };
      const transcript = Transcript.fromDict(dict);
      expect(mockFns.FMTranscriptCreateFromJSONString).toHaveBeenCalledWith(
        JSON.stringify(dict),
        expect.any(Array),
        null,
      );
      expect(transcript._sessionPtr).toBe("mock-transcript-ptr");
    });
  });

  describe("_updateSessionPtr", () => {
    it("updates the internal session pointer", () => {
      const transcript = new Transcript("old-ptr");
      transcript._updateSessionPtr("new-ptr");
      expect(transcript._sessionPtr).toBe("new-ptr");
    });
  });
});
