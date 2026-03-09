# Custom Tools

Demonstrates creating a custom `Tool` subclass that the model can invoke during generation.

## What it shows

- Extending the abstract `Tool` class
- Defining `name`, `description`, and `argumentsSchema`
- Implementing the async `call()` method
- Using `GenerationGuide.anyOf()` to constrain tool arguments
- Passing tools to `LanguageModelSession`
- Proper cleanup with `tool.dispose()`

## Run

```bash
npx tsx examples/tools/tools.ts
```
