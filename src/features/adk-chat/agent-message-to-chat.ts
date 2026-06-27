import type { ChatMessage } from "@/types";
import type { AgentMessage } from "./types";

function parseAgentTimestamp(ts: Date | string | number): Date {
  if (ts instanceof Date) return ts;
  return new Date(ts);
}

/** Map persisted ADK agent messages into chat UI messages (including tool enrichments). */
export function agentMessageToChatMessage(m: AgentMessage): ChatMessage {
  return {
    id: m.id,
    role: m.type === "human" ? "user" : "model",
    text: m.content,
    timestamp: parseAgentTimestamp(m.timestamp as unknown as Date | string | number),
    ...(m.invocationId ? { invocationId: m.invocationId } : {}),
    ...(m.unimadNavigation ? { unimadNavigation: m.unimadNavigation } : {}),
    ...(m.unimadJobCards ? { unimadJobCards: m.unimadJobCards } : {}),
    ...(m.unimadLinkedInSuggestions ? { unimadLinkedInSuggestions: m.unimadLinkedInSuggestions } : {}),
  };
}
