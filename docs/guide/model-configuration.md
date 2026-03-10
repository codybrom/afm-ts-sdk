# Model Configuration

`SystemLanguageModel` is the entry point for accessing the on-device model. It wraps Apple's Foundation Models framework and provides availability checking before you create sessions.

## Creating a Model

```ts
import {
  SystemLanguageModel,
  SystemLanguageModelUseCase,
  SystemLanguageModelGuardrails,
} from "tsfm-sdk";

const model = new SystemLanguageModel({
  useCase: SystemLanguageModelUseCase.GENERAL,
  guardrails: SystemLanguageModelGuardrails.DEFAULT,
});
```

Both options are optional and default to the values shown above.

## Use Cases

| Value | Description |
| --- | --- |
| `GENERAL` | General-purpose text generation (default) |
| `CONTENT_TAGGING` | Optimized for classification and labeling |

```ts
const tagger = new SystemLanguageModel({
  useCase: SystemLanguageModelUseCase.CONTENT_TAGGING,
});
```

## Checking Availability

The model may not be available if Apple Intelligence is disabled, assets haven't been downloaded, or the device doesn't support it.

### Synchronous Check

```ts
const { available, reason } = model.isAvailable();
if (!available) {
  console.log("Unavailable:", reason);
}
```

### Waiting for Availability

`waitUntilAvailable()` polls until the model is ready (default 30 seconds):

```ts
const { available } = await model.waitUntilAvailable();
const { available } = await model.waitUntilAvailable(10_000); // custom timeout
```

## Unavailability Reasons

When `available` is `false`, the `reason` field indicates why:

| Reason | Description |
| --- | --- |
| `APPLE_INTELLIGENCE_NOT_ENABLED` | Apple Intelligence is turned off in Settings |
| `MODEL_NOT_READY` | Model assets are still downloading |
| `DEVICE_NOT_ELIGIBLE` | Hardware doesn't support Foundation Models |

## Cleanup

Release native resources when you're done with the model:

```ts
model.dispose();
```
