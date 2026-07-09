import type { ChatMessage } from "@/types";

export type ThreadDeleteKind = "main" | "sub";

export function getThreadMessages(allMessages: ChatMessage[], topicId?: string): ChatMessage[] {
  if (topicId) {
    return allMessages.find(message => message.id === topicId)?.messages ?? [];
  }

  return allMessages.filter(message => !message.isTopic);
}

export function isFirstThreadUserMessage(allMessages: ChatMessage[], message: ChatMessage, topicId?: string): boolean {
  const threadMessages = getThreadMessages(allMessages, topicId);
  const firstUserMessage = threadMessages.find(item => item.role === "user" && item.invocationId);
  return firstUserMessage?.id === message.id;
}

/** True when this is the chronologically last rewindable user message in the thread. */
export function isLastThreadUserMessage(allMessages: ChatMessage[], message: ChatMessage, topicId?: string): boolean {
  const threadMessages = getThreadMessages(allMessages, topicId);
  const userMessages = threadMessages.filter(item => item.role === "user" && item.invocationId);
  const lastUserMessage = userMessages[userMessages.length - 1];
  return lastUserMessage?.id === message.id;
}

export function resolveThreadDeleteKind(topicId?: string): ThreadDeleteKind {
  return topicId ? "sub" : "main";
}
