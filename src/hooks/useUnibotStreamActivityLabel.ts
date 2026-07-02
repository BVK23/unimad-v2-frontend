"use client";

import { useSyncExternalStore } from "react";
import {
  getStreamActivitySnapshot,
  subscribeStreamActivity,
  type StreamActivitySnapshot,
} from "@/src/features/adk-chat/streaming/stream-activity-store";

export type UnibotStreamActivityState = StreamActivitySnapshot;

/** Live stream activity label — synchronous external store (no useEffect lag). */
export function useUnibotStreamActivityLabel(): UnibotStreamActivityState {
  return useSyncExternalStore(subscribeStreamActivity, getStreamActivitySnapshot, getStreamActivitySnapshot);
}

export const SYNCING_CONTEXT_LABEL = "Waking up Unibot…";

/** Footer / placeholder label while the agent runs. */
export function useStreamingStatusLabel({
  isAgentLoading,
  isSyncingContext,
  streamActivityLabel,
}: {
  isAgentLoading: boolean;
  isSyncingContext: boolean;
  streamActivityLabel: string | null;
}): string {
  const live = useUnibotStreamActivityLabel();

  if (isSyncingContext) return SYNCING_CONTEXT_LABEL;
  if (live.activityLabel?.trim()) return live.activityLabel;
  if (streamActivityLabel?.trim()) return streamActivityLabel;
  if (isAgentLoading) return "Working with Unibot…";
  return "Thinking…";
}

/** Label for a streaming assistant bubble — only the active streaming message shows live activity. */
export function streamActivityLabelForMessage(
  messageId: string,
  live: UnibotStreamActivityState,
  fallback: string | null | undefined,
  options?: {
    agentLoading?: boolean;
    isSyncingContext?: boolean;
    waitingLabel?: string;
    /** When false, this bubble must not show stream loading (avoids duplicate spinners). */
    isActiveStreamingTarget?: boolean;
  }
): string {
  if (options?.isSyncingContext) {
    return SYNCING_CONTEXT_LABEL;
  }
  if (options?.isActiveStreamingTarget === false) {
    return "";
  }
  if (live.activityLabel?.trim() && live.assistantMessageId === messageId) {
    return live.activityLabel.trim();
  }
  if (options?.agentLoading && fallback?.trim()) {
    return fallback.trim();
  }
  if (options?.agentLoading && options?.waitingLabel?.trim()) {
    return options.waitingLabel.trim();
  }
  return options?.waitingLabel?.trim() || "Thinking…";
}

/** Cursor-style follow-up status while sub-agents run after the assistant bubble already has text. */
export function getFollowUpStreamActivityLabel(
  messageId: string,
  live: UnibotStreamActivityState,
  fallback: string | null | undefined,
  options?: { agentLoading?: boolean; isSyncingContext?: boolean; hasVisibleText?: boolean; waitingLabel?: string }
): string | null {
  if (!options?.hasVisibleText) return null;
  if (!options?.agentLoading && !options?.isSyncingContext) return null;
  if (!live.assistantMessageId || live.assistantMessageId !== messageId) return null;

  const label = streamActivityLabelForMessage(messageId, live, fallback, {
    agentLoading: options.agentLoading,
    isSyncingContext: options.isSyncingContext,
    waitingLabel: options.waitingLabel,
  }).trim();

  if (!label || label === "Thinking…") return null;
  return label;
}
