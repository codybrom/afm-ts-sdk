# Transcript Persistence

Demonstrates saving and restoring session history using the `Transcript` class.

## What it shows

- Exporting a session transcript with `session.transcript.toJson()`
- Deserializing a transcript with `Transcript.fromJson()`
- Resuming a session with `LanguageModelSession.fromTranscript()`
- The model remembers context from the previous session

## Run

```bash
npx tsx examples/transcript/transcript.ts
```
