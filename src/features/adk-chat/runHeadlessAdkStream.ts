"use client";

import { StreamingConnectionManager } from "@/features/adk-chat/streaming/connection-manager";
import type { AgentMessage } from "@/features/adk-chat/types";

export type RunHeadlessAdkStreamParams = {
  userId: string;
  sessionId: string;
  message: string;
};

/** Run ADK /run_sse without mounting chat UI — returns final assistant text. */
export const runHeadlessAdkStream = async (params: RunHeadlessAdkStreamParams): Promise<string> => {
  const accumulatedTextRef = { current: "" };
  const currentAgentRef = { current: "" };
  const manager = new StreamingConnectionManager({ endpoint: "/api/run_sse" });
  const aiMessageId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `studio-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  await manager.submitMessage(
    {
      message: params.message.trim(),
      userId: params.userId,
      sessionId: params.sessionId,
    },
    {
      onMessageUpdate: (message: AgentMessage) => {
        if (message.content?.trim()) {
          accumulatedTextRef.current = message.content;
        }
      },
      onEventUpdate: () => {},
      onWebsiteCountUpdate: () => {},
    },
    accumulatedTextRef,
    currentAgentRef,
    () => {},
    () => {},
    aiMessageId
  );

  return accumulatedTextRef.current.trim();
};
