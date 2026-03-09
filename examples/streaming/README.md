# Streaming Response

Demonstrates streaming generation, where tokens are yielded incrementally as an async iterator.

## What it shows

- Using `session.streamResponse()` as an async generator
- Processing chunks in real-time with `for await...of`
- Streaming output to stdout

## Run

```bash
npx tsx examples/streaming/streaming.ts
```
