/**
 * Shared mock factories for example unit tests.
 *
 * Each test file should call vi.mock() directly (for proper hoisting),
 * using these factories to avoid duplicating the mock definitions.
 */

import { vi } from "vitest";

/** Koffi mock factory. */
export function koffiMock() {
  return {
    default: {
      proto: vi.fn(() => "mock-proto"),
      register: vi.fn(() => "mock-cb-pointer"),
      unregister: vi.fn(),
      as: vi.fn(() => "mock-arr-pointer"),
      pointer: vi.fn(() => "mock-proto-pointer"),
    },
  };
}

/** Core bindings mock factory (schema + tool functions). */
export function coreBindingsMock() {
  return {
    getFunctions: () => ({
      FMBridgedToolCreate: vi.fn(() => "mock-tool-pointer"),
      FMBridgedToolFinishCall: vi.fn(),
      FMGenerationSchemaCreate: vi.fn(() => "mock-schema-pointer"),
      FMGenerationSchemaPropertyCreate: vi.fn(() => "mock-prop-pointer"),
      FMGenerationSchemaPropertyAddAnyOfGuide: vi.fn(),
      FMGenerationSchemaPropertyAddRangeGuide: vi.fn(),
      FMGenerationSchemaPropertyAddCountGuide: vi.fn(),
      FMGenerationSchemaPropertyAddMinItemsGuide: vi.fn(),
      FMGenerationSchemaPropertyAddMaxItemsGuide: vi.fn(),
      FMGenerationSchemaAddProperty: vi.fn(),
      FMGenerationSchemaAddReferenceSchema: vi.fn(),
      FMGenerationSchemaGetJSONString: vi.fn(() => null),
      FMGeneratedContentCreateFromJSON: vi.fn(() => "mock-content-pointer"),
      FMGeneratedContentGetJSONString: vi.fn(() => null),
      FMGeneratedContentGetPropertyValue: vi.fn(() => null),
      FMGeneratedContentIsComplete: vi.fn(() => true),
      FMRelease: vi.fn(),
      FMFreeString: vi.fn(),
    }),
    decodeString: vi.fn(() => null),
    decodeAndFreeString: vi.fn(() => null),
    unregisterCallback: vi.fn(),
    ToolCallbackProto: "ToolCallbackProto",
  };
}

/** Errors mock factory. */
export function errorsMock() {
  return {
    statusToError: vi.fn((_code: number, msg?: string) => new Error(msg ?? "mock error")),
    ToolCallError: class extends Error {
      toolName: string;
      constructor(toolName: string, cause: Error) {
        super(`Tool '${toolName}' failed: ${cause.message}`);
        this.toolName = toolName;
      }
    },
  };
}
