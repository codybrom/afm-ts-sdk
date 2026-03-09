import { vi } from "vitest";

export function createMockFunctions() {
  return {
    // SystemLanguageModel
    FMSystemLanguageModelCreate: vi.fn((): string | null => "mock-model-ptr"),
    FMSystemLanguageModelIsAvailable: vi.fn((_ptr: unknown, reasonOut: number[]) => {
      reasonOut[0] = 0;
      return true;
    }),

    // Session creation
    FMLanguageModelSessionCreateFromSystemLanguageModel: vi.fn(
      (): string | null => "mock-session-ptr",
    ),
    FMLanguageModelSessionCreateFromTranscript: vi.fn((): string | null => "mock-session-ptr"),

    // Session state
    FMLanguageModelSessionIsResponding: vi.fn(() => false),
    FMLanguageModelSessionReset: vi.fn(),

    // Text generation
    FMLanguageModelSessionRespond: vi.fn((..._args: unknown[]): string => "mock-task-ptr"),

    // Structured generation
    FMLanguageModelSessionRespondWithSchema: vi.fn(
      (..._args: unknown[]): string => "mock-task-ptr",
    ),
    FMLanguageModelSessionRespondWithSchemaFromJSON: vi.fn(
      (..._args: unknown[]): string => "mock-task-ptr",
    ),

    // Streaming
    FMLanguageModelSessionStreamResponse: vi.fn(() => "mock-stream-ptr"),
    FMLanguageModelSessionResponseStreamIterate: vi.fn(),

    // Transcript
    FMLanguageModelSessionGetTranscriptJSONString: vi.fn(() => "mock-json-ptr"),
    FMTranscriptCreateFromJSONString: vi.fn((): string | null => "mock-transcript-ptr"),

    // GenerationSchema
    FMGenerationSchemaCreate: vi.fn(() => "mock-schema-ptr"),
    FMGenerationSchemaPropertyCreate: vi.fn(() => "mock-prop-ptr"),
    FMGenerationSchemaPropertyAddAnyOfGuide: vi.fn(),
    FMGenerationSchemaPropertyAddRangeGuide: vi.fn(),
    FMGenerationSchemaPropertyAddMinimumGuide: vi.fn(),
    FMGenerationSchemaPropertyAddMaximumGuide: vi.fn(),
    FMGenerationSchemaPropertyAddRegex: vi.fn(),
    FMGenerationSchemaPropertyAddCountGuide: vi.fn(),
    FMGenerationSchemaPropertyAddMinItemsGuide: vi.fn(),
    FMGenerationSchemaPropertyAddMaxItemsGuide: vi.fn(),
    FMGenerationSchemaAddProperty: vi.fn(),
    FMGenerationSchemaAddReferenceSchema: vi.fn(),

    // GenerationSchema serialization
    FMGenerationSchemaGetJSONString: vi.fn(() => "mock-json-ptr"),

    // GeneratedContent
    FMGeneratedContentCreateFromJSON: vi.fn((): string | null => "mock-content-ptr"),
    FMGeneratedContentGetJSONString: vi.fn((): string | null => "mock-json-ptr"),
    FMGeneratedContentGetPropertyValue: vi.fn((): string | null => null),
    FMGeneratedContentIsComplete: vi.fn(() => true),

    // Tool
    FMBridgedToolCreate: vi.fn((): string | null => "mock-tool-ptr"),
    FMBridgedToolFinishCall: vi.fn(),

    // Task
    FMTaskCancel: vi.fn(),

    // Memory
    FMRelease: vi.fn(),
    FMFreeString: vi.fn(),
  };
}
