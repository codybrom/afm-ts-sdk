# JSON Schema

Generate structured output using a standard JSON Schema object.

<<< @/../examples/json-schema/json-schema.ts

## What This Shows

1. Build a schema using the `GenerationSchema` builder, then export with `toDict()`
2. Pass the schema object to `respondWithJsonSchema()`
3. Get the full result as a plain object with `content.toObject()`
