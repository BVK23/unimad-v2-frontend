import { isStreamingMachineReadablePayloadOnly } from "@/src/features/adk-chat/utils/strip-machine-readable-payload";
import type { ChatMessage } from "@/types";

function modelHasUserVisibleText(text: string | undefined): boolean {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) return false;
  return !isStreamingMachineReadablePayloadOnly(trimmed);
}

/** Drop stale empty assistant placeholders when a later assistant message in the same turn has prose. */
export function compactTopicSubMessages(messages: ChatMessage[], activeStreamingMessageId: string | null): ChatMessage[] {
  return messages.filter((msg, index, arr) => {
    if (msg.role !== "model") return true;
    if (msg.id === activeStreamingMessageId) return true;
    if (msg.isError) return true;
    if (modelHasUserVisibleText(msg.text)) return true;
    if (msg.unimadNavigation || msg.unimadJobCards || msg.unimadLinkedInSuggestions) return true;

    for (let j = index + 1; j < arr.length; j++) {
      const next = arr[j];
      if (next.role === "user") break;
      if (next.role === "model" && modelHasUserVisibleText(next.text)) {
        return false;
      }
    }

    return true;
  });
}

/** Group nested topic messages into conversational turns for tighter user → assistant spacing. */
export function groupSubMessagesIntoTurns(messages: ChatMessage[]): ChatMessage[][] {
  const turns: ChatMessage[][] = [];
  let current: ChatMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "user" && current.length > 0) {
      turns.push(current);
      current = [msg];
      continue;
    }
    current.push(msg);
  }

  if (current.length > 0) {
    turns.push(current);
  }

  return turns;
}
