# Structured Output

Generate typed, constrained output using `GenerationSchema`. The model's response is guided to match your schema exactly.

## Defining a Schema

```ts
import { GenerationSchema, GenerationGuide } from "tsfm-sdk";

const schema = new GenerationSchema("Person", "A person profile")
  .property("name", "string", { description: "Full name" })
  .property("age", "integer", {
    description: "Age in years",
    guides: [GenerationGuide.range(0, 120)],
  })
  .property("tags", "array", {
    guides: [GenerationGuide.maxItems(5)],
    optional: true,
  });
```

### Property Types

`"string"` | `"integer"` | `"number"` | `"boolean"` | `"array"` | `"object"`

## Generation Guides

Guides constrain the model's output for a property:

| Method | Constrains |
| --- | --- |
| `GenerationGuide.anyOf(["a", "b"])` | Enumerated string values |
| `GenerationGuide.constant("fixed")` | Exact string value |
| `GenerationGuide.range(min, max)` | Numeric range (inclusive) |
| `GenerationGuide.minimum(n)` | Numeric lower bound |
| `GenerationGuide.maximum(n)` | Numeric upper bound |
| `GenerationGuide.regex(pattern)` | String pattern |
| `GenerationGuide.count(n)` | Exact array length |
| `GenerationGuide.minItems(n)` | Minimum array length |
| `GenerationGuide.maxItems(n)` | Maximum array length |
| `GenerationGuide.element(guide)` | Applies a guide to array elements |

## Generating Structured Output

```ts
const session = new LanguageModelSession();
const content = await session.respondWithSchema("Describe a software engineer", schema);
```

### Extracting Values

Use `content.value<T>(key)` to extract typed values:

```ts
const name = content.value<string>("name");
const age = content.value<number>("age");
```

### Full Example

```ts
interface Cat {
  name: string;
  age: number;
  breed: string;
}

const schema = new GenerationSchema("Cat", "A rescue cat")
  .property("name", "string", { description: "The cat's name" })
  .property("age", "integer", {
    description: "Age in years",
    guides: [GenerationGuide.range(0, 20)],
  })
  .property("breed", "string", { description: "The cat's breed" });

const content = await session.respondWithSchema("Generate a rescue cat", schema);

const cat: Cat = {
  name: content.value("name"),
  age: content.value("age"),
  breed: content.value("breed"),
};
```
