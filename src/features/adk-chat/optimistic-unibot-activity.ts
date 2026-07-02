"use client";

import { UNIBOT_AGENT_LOADING_EVENT, UNIBOT_STREAM_ACTIVITY_EVENT, type UnibotStreamActivityDetail } from "@/src/hooks/useUnibotAgentBusy";
import { SYNCING_CONTEXT_LABEL } from "@/src/hooks/useUnibotStreamActivityLabel";
import { getStreamActivitySnapshot, setStreamActivitySnapshot } from "./streaming/stream-activity-store";

type OptimisticUnibotActivityHandlers = {
  onBegin: (detail: { assistantMessageId: string | null; label: string }) => void;
  onCancel: () => void;
};

let handlers: OptimisticUnibotActivityHandlers | null = null;

export function registerOptimisticUnibotActivityHandlers(next: OptimisticUnibotActivityHandlers | null): void {
  handlers = next;
}

function dispatchActivityEvents(detail: UnibotStreamActivityDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(UNIBOT_STREAM_ACTIVITY_EVENT, { detail }));
  window.dispatchEvent(
    new CustomEvent(UNIBOT_AGENT_LOADING_EVENT, {
      detail: { loading: detail.loading ?? true, activityLabel: detail.activityLabel },
    })
  );
}

/** Immediate feedback when the user sends or clicks Improve — before PATCH / SSE. */
export function beginOptimisticUnibotActivity(params?: { assistantMessageId?: string | null; label?: string }): void {
  const assistantMessageId = params?.assistantMessageId?.trim() || null;
  const label = params?.label?.trim() || SYNCING_CONTEXT_LABEL;

  setStreamActivitySnapshot({ activityLabel: label, assistantMessageId });
  handlers?.onBegin({ assistantMessageId, label });
  dispatchActivityEvents({ loading: true, activityLabel: label, assistantMessageId });
}

/** Bind an in-flight optimistic label to the assistant placeholder bubble once it exists. */
export function attachOptimisticAssistantMessage(assistantMessageId: string): void {
  const trimmed = assistantMessageId.trim();
  if (!trimmed) return;

  const current = getStreamActivitySnapshot();
  const label = current.activityLabel?.trim() || SYNCING_CONTEXT_LABEL;
  if (current.assistantMessageId === trimmed && current.activityLabel === label) return;

  setStreamActivitySnapshot({ activityLabel: label, assistantMessageId: trimmed });
  dispatchActivityEvents({ loading: true, activityLabel: label, assistantMessageId: trimmed });
}

/** Begin optimistic activity, or attach the placeholder id if activity already started. */
export function ensureOptimisticUnibotActivity(params?: { assistantMessageId?: string | null; label?: string }): void {
  const assistantMessageId = params?.assistantMessageId?.trim() || null;
  const current = getStreamActivitySnapshot();
  if (current.activityLabel?.trim()) {
    if (assistantMessageId) {
      attachOptimisticAssistantMessage(assistantMessageId);
    }
    return;
  }
  beginOptimisticUnibotActivity({ assistantMessageId, label: params?.label });
}

/** Clear optimistic loading when setup fails before submitMessage runs. */
export function cancelOptimisticUnibotActivity(): void {
  handlers?.onCancel();
  setStreamActivitySnapshot({ activityLabel: null, assistantMessageId: null });
  dispatchActivityEvents({ loading: false, activityLabel: null, assistantMessageId: null });
}
