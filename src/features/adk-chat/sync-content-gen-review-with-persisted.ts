import { useAdkContentGenReviewStore, type AdkContentGenReviewCard } from "@/src/features/adk-chat/stores/useAdkContentGenReviewStore";

export function normalizeDraftForReviewCompare(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function isContentGenReviewSyncedWithPersisted(card: AdkContentGenReviewCard, persistedDraft: string): boolean {
  const proposed = normalizeDraftForReviewCompare(card.proposedDraft);
  const persisted = normalizeDraftForReviewCompare(persistedDraft);
  return proposed.length > 0 && proposed === persisted;
}

/** Drop review cards whose proposed draft already matches persisted backend/UI content. */
export function dismissSyncedContentGenReviews(persistedDraft: string): boolean {
  const trimmed = persistedDraft.trim();
  if (!trimmed) return false;

  const stack = useAdkContentGenReviewStore.getState().reviewStack;
  if (stack.length === 0) return false;

  const next = stack.filter(card => !isContentGenReviewSyncedWithPersisted(card, trimmed));
  if (next.length === stack.length) return false;

  useAdkContentGenReviewStore.setState({ reviewStack: next });
  return true;
}

/** After publish/schedule/accept — clear all review cards (draft is committed). */
export function clearContentGenReviewStack(): void {
  useAdkContentGenReviewStore.getState().markReviewAccepted();
}
