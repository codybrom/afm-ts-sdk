import { randomUUID } from "node:crypto";
import type { ChatCompletionMessageParam, ChatCompletionMessageToolCall } from "./types.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TranscriptResult {
  /** The native Apple Foundation Models transcript JSON string. */
  transcriptJson: string;
  /** The text of the last user message, excluded from the transcript entries. */
  prompt: string;
}

// ---------------------------------------------------------------------------
// Internal transcript shape
// ---------------------------------------------------------------------------

interface TranscriptContentItem {
  type: "text";
  text: string;
  id: string;
}

interface TranscriptEntry {
  role: "instructions" | "user" | "response";
  id: string;
  options?: Record<string, unknown>;
  contents: TranscriptContentItem[];
}

interface NativeTranscript {
  type: "FoundationModels.Transcript";
  version: 1;
  transcript: {
    entries: TranscriptEntry[];
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract plain text from a message content field. */
function extractText(
  content: string | Array<{ type: string; text?: string }> | null | undefined,
): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  return content
    .filter((part) => part.type === "text" && part.text != null)
    .map((part) => part.text as string)
    .join("");
}

/** Build a single transcript content item. */
function makeContent(text: string): TranscriptContentItem {
  return { type: "text", text, id: randomUUID() };
}

/** Build a transcript entry. */
function makeEntry(
  role: TranscriptEntry["role"],
  text: string,
  withOptions = false,
): TranscriptEntry {
  const entry: TranscriptEntry = {
    role,
    id: randomUUID(),
    contents: [makeContent(text)],
  };
  if (withOptions) {
    entry.options = {};
  }
  return entry;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Convert an OpenAI-style messages array into Apple's native transcript JSON
 * format.
 *
 * The last user message is excluded from the transcript entries and returned
 * separately as `prompt`.
 */
export function messagesToTranscript(messages: ChatCompletionMessageParam[]): TranscriptResult {
  if (messages.length === 0) {
    throw new Error("messages array must not be empty");
  }

  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    throw new Error(`Last message must have role "user", got "${last.role}"`);
  }

  // Separate the last user message from the history
  const history = messages.slice(0, -1);
  const prompt = extractText(
    (last as { role: "user"; content: string | Array<{ type: string; text?: string }> }).content,
  );

  const entries: TranscriptEntry[] = [];
  let seenSystemOrDeveloper = false;

  for (const msg of history) {
    if (msg.role === "system" || msg.role === "developer") {
      const text = extractText(msg.content);
      if (!seenSystemOrDeveloper) {
        entries.push(makeEntry("instructions", text));
        seenSystemOrDeveloper = true;
      } else {
        entries.push(makeEntry("user", `[System] ${text}`, true));
      }
    } else if (msg.role === "user") {
      const text = extractText(msg.content);
      entries.push(makeEntry("user", text, true));
    } else if (msg.role === "assistant") {
      let text: string;
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        text = JSON.stringify(msg.tool_calls);
      } else {
        text = extractText(msg.content);
      }
      entries.push(makeEntry("response", text));
    } else if (msg.role === "tool") {
      const toolMsg = msg as {
        role: "tool";
        tool_call_id: string;
        content: string | Array<{ type: string; text?: string }>;
      };
      const content = extractText(toolMsg.content);
      const toolName = resolveToolName(toolMsg.tool_call_id, history);
      const text =
        toolName != null
          ? `[Tool result for ${toolName}]: ${content}`
          : `[Tool result]: ${content}`;
      entries.push(makeEntry("user", text, true));
    }
  }

  const native: NativeTranscript = {
    type: "FoundationModels.Transcript",
    version: 1,
    transcript: { entries },
  };

  return { transcriptJson: JSON.stringify(native), prompt };
}

// ---------------------------------------------------------------------------
// Tool name resolution
// ---------------------------------------------------------------------------

/** Scan backward through messages to find the tool name for a given call ID. */
function resolveToolName(
  toolCallId: string,
  messages: ChatCompletionMessageParam[],
): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "assistant" && msg.tool_calls) {
      const match = (msg.tool_calls as ChatCompletionMessageToolCall[]).find(
        (tc) => tc.id === toolCallId,
      );
      if (match) return match.function.name;
    }
  }
  return null;
}
