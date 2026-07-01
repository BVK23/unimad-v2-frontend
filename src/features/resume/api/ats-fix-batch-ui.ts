import { useAdkResumeReviewStore } from "@/src/features/adk-chat/stores/useAdkResumeReviewStore";
import { findPendingReviewInTopic } from "@/src/features/adk-chat/unibot-action-item-guard";
import type { ChatMessage } from "@/types";

export type AtsFixBatchCoordinator = {
  active: boolean;
  gateTopicId: string | null;
  gateSectionLabel: string | null;
  sectionIndex: number;
  totalSections: number;
  userOverrodeFocus: boolean;
};

export const createAtsFixBatchCoordinator = (totalSections: number): AtsFixBatchCoordinator => ({
  active: true,
  gateTopicId: null,
  gateSectionLabel: null,
  sectionIndex: 0,
  totalSections,
  userOverrodeFocus: false,
});

/** Matches ADK `sub_thread_scope.OUT_OF_SCOPE_REPLY` — gate must not treat this as section complete. */
export const isOutOfScopeModelReply = (text: string): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return trimmed.includes("beyond my scope") || trimmed.includes("please ask Unibot in the main thread");
};

/** User declining optional follow-ups or signaling they are done with this section. */
export const isUserDeclineOrDoneReply = (text: string): boolean => {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/[.!]+$/g, "")
    .replace(/\s+/g, " ");
  if (!normalized) return false;
  if (
    /^(no|nope|nah|not really|nothing else|that'?s all|thats all|no thanks|skip|done|i'?m good|im good|all good|none|nothing)$/.test(
      normalized
    )
  ) {
    return true;
  }
  if (/^no[,.\s]/.test(normalized)) return true;
  if (/^(ok|okay|continue|next|go ahead|proceed|thanks|thank you|got it|sounds good)$/.test(normalized)) {
    return true;
  }
  return false;
};

/** Agent closed the thread after user declined or said they are done (no ? / no scope error). */
export const isConversationClosedAfterUserDone = (topic: ChatMessage | undefined): boolean => {
  const msgs = topic?.messages ?? [];
  const last = msgs[msgs.length - 1];
  if (!last || last.role !== "model" || last.isError) return false;
  const modelText = last.text.trim();
  if (!modelText || isOutOfScopeModelReply(modelText) || modelText.endsWith("?")) return false;

  for (let i = msgs.length - 2; i >= 0; i--) {
    const msg = msgs[i];
    if (msg.role === "user") return isUserDeclineOrDoneReply(msg.text);
    if (msg.role === "model") return false;
  }
  return false;
};

/** User must reply before the next ATS section runs (? or out-of-scope reply as the latest turn). */
export const topicNeedsUserReply = (topic: ChatMessage | undefined): boolean => {
  const msgs = topic?.messages ?? [];
  if (!msgs.length) return false;
  const last = msgs[msgs.length - 1];
  if (!last || last.role !== "model" || last.isError) return false;
  const text = last.text.trim();
  if (!text) return false;
  if (isOutOfScopeModelReply(text)) return true;
  return text.endsWith("?");
};

export type AtsGateSnapshot = {
  topic: ChatMessage | undefined;
  pendingReview: { messageId: string } | null;
  isAgentLoading: boolean;
};

export const isAtsGateTopicSettled = ({ topic, pendingReview, isAgentLoading }: AtsGateSnapshot): boolean => {
  if (isAgentLoading) return false;
  if (pendingReview) return false;
  if (topicNeedsUserReply(topic)) return false;
  if (isConversationClosedAfterUserDone(topic)) return true;
  return Boolean(topic);
};

export const buildAtsGateSnapshot = (messages: ChatMessage[], gateTopicId: string | null, isAgentLoading: boolean): AtsGateSnapshot => {
  const topic = gateTopicId ? messages.find(m => m.id === gateTopicId && m.isTopic) : undefined;
  const stack = useAdkResumeReviewStore.getState().reviewStack;
  const activeReviewId = stack.at(-1)?.id ?? null;
  const pendingReview = findPendingReviewInTopic(topic, stack, activeReviewId);
  return { topic, pendingReview, isAgentLoading };
};

export type AtsGateAwaitingHint = { text: string };

/** Bottom of active ATS gate topic in main chat — only when batch waits on user (not while streaming). */
export const buildAtsGateAwaitingHint = (
  batchActive: boolean,
  gateTopicId: string | null,
  topicId: string,
  messages: ChatMessage[]
): AtsGateAwaitingHint | null => {
  if (!batchActive || !gateTopicId || gateTopicId !== topicId) return null;

  const snap = buildAtsGateSnapshot(messages, gateTopicId, false);
  if (snap.pendingReview) {
    return { text: "Awaiting review — accept or discard to continue" };
  }
  const msgs = snap.topic?.messages ?? [];
  const last = msgs[msgs.length - 1];
  if (last?.role === "model" && isOutOfScopeModelReply(last.text)) {
    return { text: "Reply to continue to the next section" };
  }
  if (topicNeedsUserReply(snap.topic)) {
    return { text: "Awaiting your reply to continue" };
  }
  return null;
};

const GATE_POLL_MS = 250;

/** Blocks the ATS batch loop until the gate topic is idle (no stream, no review, no open question). */
export const waitForAtsGateTopicSettled = (readSnapshot: () => AtsGateSnapshot, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (intervalId != null) clearInterval(intervalId);
      unsubReview();
      signal?.removeEventListener("abort", onAbort);
    };

    const tryResolve = () => {
      if (signal?.aborted) {
        cleanup();
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      if (isAtsGateTopicSettled(readSnapshot())) {
        cleanup();
        resolve();
      }
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    const unsubReview = useAdkResumeReviewStore.subscribe(tryResolve);
    signal?.addEventListener("abort", onAbort);
    intervalId = setInterval(tryResolve, GATE_POLL_MS);
    tryResolve();
  });

export const markAtsFixBatchFocusOverride = (coordinator: AtsFixBatchCoordinator | null): void => {
  if (!coordinator?.active) return;
  coordinator.userOverrodeFocus = true;
};
