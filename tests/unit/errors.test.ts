import { describe, it, expect } from "vitest";
import {
  statusToError,
  GenerationErrorCode,
  ExceededContextWindowSizeError,
  AssetsUnavailableError,
  GuardrailViolationError,
  UnsupportedGuideError,
  UnsupportedLanguageOrLocaleError,
  DecodingFailureError,
  RateLimitedError,
  ConcurrentRequestsError,
  RefusalError,
  InvalidGenerationSchemaError,
  GenerationError,
  FoundationModelsError,
  ToolCallError,
} from "../../src/errors.js";

describe("statusToError", () => {
  it("maps EXCEEDED_CONTEXT_WINDOW_SIZE to ExceededContextWindowSizeError", () => {
    const err = statusToError(GenerationErrorCode.EXCEEDED_CONTEXT_WINDOW_SIZE);
    expect(err).toBeInstanceOf(ExceededContextWindowSizeError);
    expect(err.message).toBe("Context window size exceeded");
  });

  it("maps ASSETS_UNAVAILABLE to AssetsUnavailableError", () => {
    const err = statusToError(GenerationErrorCode.ASSETS_UNAVAILABLE);
    expect(err).toBeInstanceOf(AssetsUnavailableError);
    expect(err.message).toBe("Assets unavailable");
  });

  it("maps GUARDRAIL_VIOLATION to GuardrailViolationError", () => {
    const err = statusToError(GenerationErrorCode.GUARDRAIL_VIOLATION);
    expect(err).toBeInstanceOf(GuardrailViolationError);
    expect(err.message).toBe("Guardrail violation");
  });

  it("maps UNSUPPORTED_GUIDE to UnsupportedGuideError", () => {
    const err = statusToError(GenerationErrorCode.UNSUPPORTED_GUIDE);
    expect(err).toBeInstanceOf(UnsupportedGuideError);
    expect(err.message).toBe("Unsupported guide");
  });

  it("maps UNSUPPORTED_LANGUAGE_OR_LOCALE to UnsupportedLanguageOrLocaleError", () => {
    const err = statusToError(GenerationErrorCode.UNSUPPORTED_LANGUAGE_OR_LOCALE);
    expect(err).toBeInstanceOf(UnsupportedLanguageOrLocaleError);
    expect(err.message).toBe("Unsupported language or locale");
  });

  it("maps DECODING_FAILURE to DecodingFailureError", () => {
    const err = statusToError(GenerationErrorCode.DECODING_FAILURE);
    expect(err).toBeInstanceOf(DecodingFailureError);
    expect(err.message).toBe("Decoding failure");
  });

  it("maps RATE_LIMITED to RateLimitedError", () => {
    const err = statusToError(GenerationErrorCode.RATE_LIMITED);
    expect(err).toBeInstanceOf(RateLimitedError);
    expect(err.message).toBe("Rate limited");
  });

  it("maps CONCURRENT_REQUESTS to ConcurrentRequestsError", () => {
    const err = statusToError(GenerationErrorCode.CONCURRENT_REQUESTS);
    expect(err).toBeInstanceOf(ConcurrentRequestsError);
    expect(err.message).toBe("Concurrent request");
  });

  it("maps REFUSAL to RefusalError", () => {
    const err = statusToError(GenerationErrorCode.REFUSAL);
    expect(err).toBeInstanceOf(RefusalError);
    expect(err.message).toBe("Model refused");
  });

  it("maps INVALID_SCHEMA to InvalidGenerationSchemaError", () => {
    const err = statusToError(GenerationErrorCode.INVALID_SCHEMA);
    expect(err).toBeInstanceOf(InvalidGenerationSchemaError);
    expect(err.message).toBe("Invalid schema");
  });

  it("maps unknown code to GenerationError", () => {
    const err = statusToError(999);
    expect(err).toBeInstanceOf(GenerationError);
    expect(err.message).toBe("Unknown error (code 999)");
  });

  it("appends detail suffix when provided", () => {
    const err = statusToError(GenerationErrorCode.RATE_LIMITED, "try again later");
    expect(err.message).toBe("Rate limited: try again later");
  });

  it("does not append suffix when detail is null", () => {
    const err = statusToError(GenerationErrorCode.RATE_LIMITED, null);
    expect(err.message).toBe("Rate limited");
  });

  it("does not append suffix when detail is undefined", () => {
    const err = statusToError(GenerationErrorCode.RATE_LIMITED, undefined);
    expect(err.message).toBe("Rate limited");
  });

  it("does not append suffix when detail is empty string", () => {
    const err = statusToError(GenerationErrorCode.RATE_LIMITED, "");
    expect(err.message).toBe("Rate limited");
  });

  it("appends detail to unknown error codes", () => {
    const err = statusToError(999, "something went wrong");
    expect(err.message).toBe("Unknown error (code 999): something went wrong");
  });
});

describe("error hierarchy", () => {
  it("GenerationError extends FoundationModelsError", () => {
    const err = new GenerationError("test");
    expect(err).toBeInstanceOf(FoundationModelsError);
    expect(err).toBeInstanceOf(Error);
  });

  it("specific errors extend GenerationError", () => {
    expect(new ExceededContextWindowSizeError()).toBeInstanceOf(GenerationError);
    expect(new AssetsUnavailableError()).toBeInstanceOf(GenerationError);
    expect(new GuardrailViolationError()).toBeInstanceOf(GenerationError);
    expect(new UnsupportedGuideError()).toBeInstanceOf(GenerationError);
    expect(new UnsupportedLanguageOrLocaleError()).toBeInstanceOf(GenerationError);
    expect(new DecodingFailureError()).toBeInstanceOf(GenerationError);
    expect(new RateLimitedError()).toBeInstanceOf(GenerationError);
    expect(new ConcurrentRequestsError()).toBeInstanceOf(GenerationError);
    expect(new RefusalError()).toBeInstanceOf(GenerationError);
  });

  it("InvalidGenerationSchemaError extends FoundationModelsError but not GenerationError", () => {
    const err = new InvalidGenerationSchemaError();
    expect(err).toBeInstanceOf(FoundationModelsError);
    expect(err).not.toBeInstanceOf(GenerationError);
  });

  it("ToolCallError captures tool name and cause", () => {
    const cause = new Error("boom");
    const err = new ToolCallError("myTool", cause);
    expect(err.toolName).toBe("myTool");
    expect(err.cause).toBe(cause);
    expect(err.message).toBe("Tool 'myTool' failed: boom");
    expect(err).toBeInstanceOf(FoundationModelsError);
  });

  it("ToolCallError does not extend GenerationError", () => {
    const err = new ToolCallError("t", new Error("x"));
    expect(err).not.toBeInstanceOf(GenerationError);
  });

  it("error names are set correctly", () => {
    expect(new FoundationModelsError("x").name).toBe("FoundationModelsError");
    expect(new GenerationError("x").name).toBe("GenerationError");
    expect(new ExceededContextWindowSizeError().name).toBe("ExceededContextWindowSizeError");
    expect(new AssetsUnavailableError().name).toBe("AssetsUnavailableError");
    expect(new GuardrailViolationError().name).toBe("GuardrailViolationError");
    expect(new UnsupportedGuideError().name).toBe("UnsupportedGuideError");
    expect(new UnsupportedLanguageOrLocaleError().name).toBe("UnsupportedLanguageOrLocaleError");
    expect(new DecodingFailureError().name).toBe("DecodingFailureError");
    expect(new RateLimitedError().name).toBe("RateLimitedError");
    expect(new ConcurrentRequestsError().name).toBe("ConcurrentRequestsError");
    expect(new RefusalError().name).toBe("RefusalError");
    expect(new InvalidGenerationSchemaError().name).toBe("InvalidGenerationSchemaError");
    expect(new ToolCallError("t", new Error("x")).name).toBe("ToolCallError");
  });

  it("errors have default messages when constructed without arguments", () => {
    expect(new ExceededContextWindowSizeError().message).toBe("Context window size exceeded");
    expect(new AssetsUnavailableError().message).toBe("Required assets unavailable");
    expect(new GuardrailViolationError().message).toBe("Guardrail violation");
    expect(new UnsupportedGuideError().message).toBe("Unsupported guide");
    expect(new UnsupportedLanguageOrLocaleError().message).toBe("Unsupported language or locale");
    expect(new DecodingFailureError().message).toBe("Decoding failure");
    expect(new RateLimitedError().message).toBe("Rate limited");
    expect(new ConcurrentRequestsError().message).toBe("Concurrent request already in progress");
    expect(new RefusalError().message).toBe("Model refused to generate content");
    expect(new InvalidGenerationSchemaError().message).toBe("Invalid generation schema");
  });
});
