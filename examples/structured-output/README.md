# Structured Output

Demonstrates guided generation using `GenerationSchema` to produce typed, structured data.

## What it shows

- Building a schema with `GenerationSchema` and `property()`
- Using `GenerationGuide.range()` to constrain numeric values
- Generating structured content with `session.respondWithSchema()`
- Extracting typed values with `content.value<T>()`

## Run

```bash
npx tsx examples/structured-output/structured-output.ts
```
