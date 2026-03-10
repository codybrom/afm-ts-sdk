# Transcript

Represents a session's conversation history. Used to export and restore sessions.

## Accessing

Every session exposes its transcript:

```ts
const transcript = session.transcript;
```

::: warning
Access the transcript before calling `session.dispose()`. The transcript reads from the native session pointer.
:::

## Methods

### `toJson()`

Export the transcript as a JSON string.

```ts
toJson(): string
```

### `toDict()`

Export the transcript as a dictionary object.

```ts
toDict(): object
```

## Static Methods

### `fromJson()`

Create a transcript from a JSON string.

```ts
static fromJson(json: string): Transcript
```

### `fromDict()`

Create a transcript from a dictionary object.

```ts
static fromDict(dict: object): Transcript
```

## Restoring a Session

```ts
const transcript = Transcript.fromJson(savedJson);
const session = LanguageModelSession.fromTranscript(transcript);
```

See [LanguageModelSession.fromTranscript()](/api/language-model-session#fromtranscript) for full options.
