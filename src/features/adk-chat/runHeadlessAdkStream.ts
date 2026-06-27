"use client";

import { ADK_CHAT_STREAM_ENDPOINT, StreamingConnectionManager } from "@/features/adk-chat/streaming/connection-manager";
import type { AgentMessage } from "@/features/adk-chat/types";
import type { DraftGenerationTimer } from "@/features/application-assets/utils/draftGenerationTimer";

export type RunHeadlessAdkStreamParams = {
  userId: string;
  sessionId: string;
  message: string;
  /** ADK app name override (sub-thread flow app, e.g. coverletter / linkedin_post). */
  adkAppName?: string;
  /** Optional step timer from draft generation pipeline. */
  timer?: DraftGenerationTimer;
};

/** Run ADK /run_sse without mounting chat UI — returns final assistant text. */
export const runHeadlessAdkStream = async (params: RunHeadlessAdkStreamParams): Promise<string> => {
  const timer = params.timer;
  const accumulatedTextRef = { current: "" };
  const currentAgentRef = { current: "" };
  let firstAssistantTextLogged = false;
  const manager = new StreamingConnectionManager({
    endpoint: ADK_CHAT_STREAM_ENDPOINT,
    streamTiming: {
      onFetchStart: () => timer?.mark("sse_fetch_start"),
      onFetchResponse: response => timer?.mark("sse_response_headers", { status: response.status, ok: response.ok }),
      onFirstSseChunk: () => timer?.mark("sse_first_chunk"),
    },
  });
  const aiMessageId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `studio-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  timer?.mark("sse_stream_begin", { messageChars: params.message.trim().length });

  await manager.submitMessage(
    {
      message: params.message.trim(),
      userId: params.userId,
      sessionId: params.sessionId,
      adkAppName: params.adkAppName,
    },
    {
      onMessageUpdate: (message: AgentMessage) => {
        if (message.content?.trim()) {
          if (!firstAssistantTextLogged) {
            firstAssistantTextLogged = true;
            timer?.mark("sse_first_assistant_text", {
              agent: currentAgentRef.current || "unknown",
              chars: message.content.length,
            });
          }
          accumulatedTextRef.current = message.content;
        }
      },
      onEventUpdate: () => {},
      onWebsiteCountUpdate: () => {},
      onStreamActivityHint: hint => {
        timer?.mark("sse_activity", { label: hint.label });
      },
    },
    accumulatedTextRef,
    currentAgentRef,
    agent => {
      if (agent?.trim()) {
        timer?.mark("sse_agent_handoff", { agent: agent.trim() });
      }
    },
    () => {},
    aiMessageId
  );

  const finalText = accumulatedTextRef.current.trim();
  timer?.mark("sse_stream_complete", {
    responseChars: finalText.length,
    finalAgent: currentAgentRef.current || "unknown",
  });

  return finalText;
};
