# Error Handling

All SDK errors extend `FoundationModelsError`. Generation-specific errors extend `GenerationError`, which itself extends `FoundationModelsError`.

## Error Hierarchy

::: info FoundationModelsError
All errors inherit from `FoundationModelsError`.

**GenerationError** — errors during generation:
- `ExceededContextWindowSizeError`
- `AssetsUnavailableError`
- `GuardrailViolationError`
- `UnsupportedGuideError`
- `UnsupportedLanguageOrLocaleError`
- `DecodingFailureError`
- `RateLimitedError`
- `ConcurrentRequestsError`
- `RefusalError`
- `InvalidGenerationSchemaError`

**ToolCallError** — a tool's `call()` method threw
:::

## Catching Errors

```ts
import {
  ExceededContextWindowSizeError,
  GuardrailViolationError,
  RateLimitedError,
} from "tsfm-sdk";

try {
  await session.respond("...");
} catch (e) {
  if (e instanceof ExceededContextWindowSizeError) {
    // Start a new session — context window is full
  } else if (e instanceof GuardrailViolationError) {
    // Content policy was triggered
  } else if (e instanceof RateLimitedError) {
    // Too many requests — wait and retry
  }
}
```

## Error Reference

### `ExceededContextWindowSizeError`
Session history is too long. Start a new session or use a shorter transcript.

### `AssetsUnavailableError`
Model assets haven't been downloaded yet. Call `waitUntilAvailable()` before creating a session.

### `GuardrailViolationError`
Content policy was triggered by the prompt or response.

### `UnsupportedGuideError`
A generation guide on a schema property isn't supported by the model.

### `UnsupportedLanguageOrLocaleError`
The current language or locale isn't supported.

### `DecodingFailureError`
Structured generation couldn't parse the model's output into the schema.

### `RateLimitedError`
Too many requests in a short period. Wait and retry.

### `ConcurrentRequestsError`
The session is already processing a request. Await the current response or call `cancel()` first.

### `RefusalError`
The model declined to answer the prompt.

### `InvalidGenerationSchemaError`
The `GenerationSchema` is malformed. Check property types and guides.

### `ToolCallError`
A tool's `call()` method threw an error. The original error is wrapped with the tool name for context.

## Catching All SDK Errors

```ts
import { FoundationModelsError } from "tsfm-sdk";

try {
  await session.respond("...");
} catch (e) {
  if (e instanceof FoundationModelsError) {
    console.error("SDK error:", e.message);
  }
}
```
