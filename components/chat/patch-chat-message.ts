import type { ChatMessage } from "@/types";

export function patchChatMessageInTree(list: ChatMessage[], messageId: string, patch: Partial<ChatMessage>): ChatMessage[] {
  return list.map(m => {
    if (m.id === messageId) {
      return { ...m, ...patch };
    }
    if (m.isTopic && m.messages?.length) {
      return {
        ...m,
        messages: patchChatMessageInTree(m.messages, messageId, patch),
      };
    }
    return m;
  });
}
