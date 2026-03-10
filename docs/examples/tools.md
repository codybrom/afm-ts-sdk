# Tools

Tool calling with a calculator that performs arithmetic operations.

<<< @/../examples/tools/tools.ts

## What This Shows

1. Extend `Tool` with `name`, `description`, `argumentsSchema`, and `call()`
2. Use `GenerationGuide.anyOf()` to constrain argument values
3. Pass tools to a session via `{ tools: [calculator] }`
4. The model decides when to call the tool and incorporates the result
5. Dispose both the session and tool when done
