# Transcripts

Save and restore session history across process restarts.

<<< @/../examples/transcript/transcript.ts

## What This Shows

1. Build context in a session with multiple `respond()` calls
2. Export the transcript with `toJson()`
3. Restore a session with `Transcript.fromJson()` and `LanguageModelSession.fromTranscript()`
4. The restored session retains full conversation context
