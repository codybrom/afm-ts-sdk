# JSON Schema

If you prefer working with standard JSON Schema objects instead of the `GenerationSchema` builder, use `respondWithJsonSchema()`.

## Usage

```ts
import { LanguageModelSession } from "tsfm-sdk";

const session = new LanguageModelSession();

const content = await session.respondWithJsonSchema("Generate a person profile", {
  type: "object",
  properties: {
    name: { type: "string", description: "Full name" },
    age: { type: "integer", description: "Age in years" },
    occupation: { type: "string", description: "Job title" },
  },
  required: ["name", "age", "occupation"],
});

console.log(content.toObject());
// { name: "Ada Lovelace", age: 36, occupation: "Mathematician" }
```

## Extracting Results

`respondWithJsonSchema()` returns a `GeneratedContent` object. Use `toObject()` to get the full result as a plain object:

```ts
const person = content.toObject();
console.log(person.name, person.age);
```

## When to Use

- **`respondWithSchema()`** — When you want type-safe property access via `content.value<T>(key)` and generation guides for fine-grained constraints.
- **`respondWithJsonSchema()`** — When you already have a JSON Schema definition or want a simpler interface with `content.toObject()`.

Both methods produce constrained, structured output. The SDK converts standard JSON Schema to Apple's internal format automatically.
