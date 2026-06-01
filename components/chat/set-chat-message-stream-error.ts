import type { FormattedUnibotStreamError } from "@/features/adk-chat/format-stream-error";
import type { ChatMessage } from "@/types";

/** Applies stream-error UI fields to a message anywhere in the main / topic tree. */
export function setChatMessageStreamErrorInTree(
  list: ChatMessage[],
  messageId: string,
  formatted: FormattedUnibotStreamError
): ChatMessage[] {
  return list.map(m => {
    if (m.id === messageId) {
      return {
        ...m,
        text: formatted.message,
        isError: true,
        errorKind: formatted.kind,
      };
    }
    if (m.isTopic && m.messages?.length) {
      return {
        ...m,
        messages: setChatMessageStreamErrorInTree(m.messages, messageId, formatted),
      };
    }
    return m;
  });
}

/**
 * When a stream ends without assistant text, mark the placeholder as a rate-limit style error.
 * Returns whether a message was updated.
 */
export function markEmptyAssistantStreamErrorInTree(
  list: ChatMessage[],
  messageId: string,
  formatted: FormattedUnibotStreamError
): { list: ChatMessage[]; marked: boolean } {
  let marked = false;

  const next = list.map(m => {
    if (m.id === messageId && m.role === "model" && m.text.trim().length === 0 && !m.isError) {
      marked = true;
      return {
        ...m,
        text: formatted.message,
        isError: true,
        errorKind: formatted.kind,
      };
    }
    if (m.isTopic && m.messages?.length) {
      const inner = markEmptyAssistantStreamErrorInTree(m.messages, messageId, formatted);
      if (inner.marked) {
        marked = true;
        return { ...m, messages: inner.list };
      }
    }
    return m;
  });

  return { list: next, marked };
}

/** Clears a failed assistant bubble so the same turn can be retried without duplicating the user message. */
export function resetAssistantTurnForRetryInTree(list: ChatMessage[], assistantMessageId: string): ChatMessage[] {
  return list.map(m => {
    if (m.id === assistantMessageId && m.role === "model") {
      return {
        ...m,
        text: "",
        isError: undefined,
        errorKind: undefined,
      };
    }
    if (m.isTopic && m.messages?.length) {
      return {
        ...m,
        messages: resetAssistantTurnForRetryInTree(m.messages, assistantMessageId),
      };
    }
    return m;
  });
}
