import type { ChatMessage } from "@/types";

export function updateChatMessageInTree(list: ChatMessage[], messageId: string, text: string): ChatMessage[] {
  return list.map(m => {
    if (m.id === messageId) {
      return { ...m, text };
    }
    if (m.isTopic && m.messages?.length) {
      return {
        ...m,
        messages: updateChatMessageInTree(m.messages, messageId, text),
      };
    }
    return m;
  });
}
