# Basic

A simple prompt and response using `SystemLanguageModel` and `LanguageModelSession`.

<<< @/../examples/basic/basic.ts

## What This Shows

1. Create a `SystemLanguageModel` and wait for availability
2. Create a session with system instructions
3. Generate a text response with `respond()`
4. Dispose both session and model to free native resources
