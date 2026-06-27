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

/** Label for a streaming assistant bubble — while agent is loading, show the latest hint on any placeholder. */
export function streamActivityLabelForMessage(
  messageId: string,
  live: UnibotStreamActivityState,
  fallback: string | null | undefined,
  options?: { agentLoading?: boolean; isSyncingContext?: boolean; waitingLabel?: string }
): string {
  if (options?.isSyncingContext) {
    return SYNCING_CONTEXT_LABEL;
  }
  // During an active stream, always show the latest activity (sub-thread ids may not match yet).
  if (options?.agentLoading && live.activityLabel?.trim()) {
    return live.activityLabel.trim();
  }
  if (live.activityLabel?.trim()) {
    if (!live.assistantMessageId || live.assistantMessageId === messageId) {
      return live.activityLabel.trim();
    }
  }
  if (options?.agentLoading && fallback?.trim()) {
    return fallback.trim();
  }
  return fallback?.trim() || options?.waitingLabel?.trim() || "Thinking…";
}
