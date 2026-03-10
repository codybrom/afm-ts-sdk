<p align="center">
  <img src="docs/public/logo.svg" width="128" height="128" alt="tsfm">
</p>

<h1 align="center">tsfm</h1>

<p align="center">
  TypeScript SDK for Apple's <a href="https://developer.apple.com/documentation/foundationmodels">Foundation Models</a> framework.<br>
  On-device Apple Intelligence in Node.js — no API keys, no servers.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/tsfm-sdk"><img src="https://img.shields.io/npm/v/tsfm-sdk" alt="npm"></a>
  <a href="https://github.com/codybrom/tsfm/actions/workflows/test.yml"><img src="https://github.com/codybrom/tsfm/actions/workflows/test.yml/badge.svg" alt="Tests"></a>
  <a href="LICENSE.md"><img src="https://img.shields.io/npm/l/tsfm-sdk" alt="license"></a>
</p>

---

- On-device inference — your data never leaves the machine
- Streaming text generation
- Structured output with typed schemas and generation guides
- Tool calling
- Transcript persistence

## Quick Start

```bash
npm install tsfm-sdk
```

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

## Documentation

**[Read the full docs →](https://codybrom.github.io/tsfm/)**

- [Getting Started](https://codybrom.github.io/tsfm/guide/getting-started) — installation, requirements, first steps
- [Sessions](https://codybrom.github.io/tsfm/guide/sessions) — text generation, concurrency, cancellation
- [Streaming](https://codybrom.github.io/tsfm/guide/streaming) — token-by-token response streaming
- [Structured Output](https://codybrom.github.io/tsfm/guide/structured-output) — typed schemas with generation guides
- [Tools](https://codybrom.github.io/tsfm/guide/tools) — function calling
- [API Reference](https://codybrom.github.io/tsfm/api/) — complete API docs
- [Examples](https://codybrom.github.io/tsfm/examples/) — runnable code for every feature

## Requirements

- macOS 26 (Tahoe) or later, Apple Silicon
- Apple Intelligence enabled in System Settings
- Node.js 20+

Xcode is **not** required — a prebuilt dylib is bundled with the npm package.

## Development

```bash
npm run build              # build native dylib + compile TypeScript
npm test                   # run all tests
npm run test:unit          # unit tests only (works on any machine)
npm run test:integration   # integration tests (requires macOS 26 + Apple Intelligence)
```

## Contributing

Issues and PRs welcome. If something doesn't work on your machine or you find a missing API, [open an issue](https://github.com/codybrom/tsfm/issues).

## License

Apache 2.0 — see [LICENSE.md](LICENSE.md). The npm package bundles Apple's Foundation Models C bindings and prebuilt dylib, also Apache 2.0. See [NOTICE](NOTICE).
