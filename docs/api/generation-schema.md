# GenerationSchema

Builder for typed schemas that constrain structured generation output.

## Constructor

```ts
new GenerationSchema(name: string, description: string)
```

## Methods

### `property()`

Add a property to the schema. Returns `this` for chaining.

```ts
property(name: string, type: PropertyType, options?: {
  description?: string;
  guides?: GenerationGuide[];
  optional?: boolean;
}): this
```

### `toDict()`

Export the schema as a JSON Schema-compatible dictionary.

```ts
toDict(): object
```

## Types

### `PropertyType`

```ts
type PropertyType = "string" | "integer" | "number" | "boolean" | "array" | "object"
```

## GenerationGuide

Factory methods that create output constraints for schema properties.

### String Guides

```ts
GenerationGuide.anyOf(values: string[])    // enumerated values
GenerationGuide.constant(value: string)     // exact value
GenerationGuide.regex(pattern: string)      // regex pattern
```

### Numeric Guides

```ts
GenerationGuide.range(min: number, max: number)  // inclusive range
GenerationGuide.minimum(n: number)                // lower bound
GenerationGuide.maximum(n: number)                // upper bound
```

### Array Guides

```ts
GenerationGuide.count(n: number)            // exact length
GenerationGuide.minItems(n: number)         // minimum length
GenerationGuide.maxItems(n: number)         // maximum length
GenerationGuide.element(guide: GenerationGuide)  // constrain elements
```

## GeneratedContent

Returned by `respondWithSchema()` and `respondWithJsonSchema()`.

### `value()`

Extract a typed property value:

```ts
value<T>(key: string): T
```

### `toObject()`

Get the full result as a plain object:

```ts
toObject(): Record<string, unknown>
```

## GenerationSchemaProperty

Represents a single property in a schema. Created internally by `GenerationSchema.property()`.

## GuideType

Enum of guide types used internally:

| Value | Description |
| --- | --- |
| `ANY_OF` | Enumerated values |
| `CONSTANT` | Fixed value |
| `RANGE` | Numeric range |
| `MINIMUM` | Lower bound |
| `MAXIMUM` | Upper bound |
| `REGEX` | Pattern match |
| `COUNT` | Exact array length |
| `MIN_ITEMS` | Minimum array length |
| `MAX_ITEMS` | Maximum array length |
| `ELEMENT` | Element constraint |
