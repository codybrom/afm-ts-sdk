# Getting Started

## Requirements

- **macOS 26** (Tahoe) or later, Apple Silicon
- **Apple Intelligence** enabled in System Settings
- **Node.js 20+**

## Installation

```bash
npm install tsfm-sdk
```

A prebuilt `libFoundationModels.dylib` is bundled with the package — Xcode is not required. If your machine needs a different build, see [Building from Source](#building-from-source).

## Quick Start

```ts
import { SystemLanguageModel, LanguageModelSession } from "tsfm-sdk";

const model = new SystemLanguageModel();
const { available } = await model.waitUntilAvailable();
if (!available) process.exit(1);

const session = new LanguageModelSession({
  instructions: "You are a concise assistant.",
});

const reply = await session.respond("What is the capital of France?");
console.log(reply); // "The capital of France is Paris."

session.dispose();
model.dispose();
```

## Key Concepts

1. **Model** — `SystemLanguageModel` represents the on-device model. Check availability before creating sessions.
2. **Session** — `LanguageModelSession` maintains conversation state. All generation methods go through a session.
3. **Dispose** — Native resources must be released by calling `dispose()` when you're done.

## What's Next

- [Model Configuration](/guide/model-configuration) — Use cases, guardrails, availability
- [Sessions](/guide/sessions) — Creating and using sessions
- [Streaming](/guide/streaming) — Token-by-token response streaming
- [Structured Output](/guide/structured-output) — Typed generation with schemas
- [Tools](/guide/tools) — Function calling
- [Error Handling](/guide/error-handling) — Error types and recovery

## Building from Source

If you need to rebuild the native library:

```bash
git clone https://github.com/codybrom/tsfm.git
cd tsfm
npm run build
```

This requires **Xcode 26+** to compile the Swift bridge.
