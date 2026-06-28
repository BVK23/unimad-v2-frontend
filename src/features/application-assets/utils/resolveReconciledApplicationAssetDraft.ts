import type { AdkApplicationAssetReviewCard } from "@/features/adk-chat/stores/useAdkApplicationAssetReviewStore";
import { useApplicationAssetDiffReviewUiStore } from "@/features/application-assets/store/useApplicationAssetDiffReviewUiStore";
import { buildReconciledHtml, reconcileAnchoredDraft } from "@/features/application-assets/utils/application-asset-diff";

/** Merge per-region keep/undo decisions into the draft saved on Accept. */
export const resolveReconciledApplicationAssetDraft = (card: AdkApplicationAssetReviewCard): string => {
  const diffUi = useApplicationAssetDiffReviewUiStore.getState();
  if (!diffUi.isSessionActive() || diffUi.sessionId !== card.id) {
    return card.proposedDraft;
  }

  const { regions } = reconcileAnchoredDraft({
    baselineDraft: card.baselineDraft,
    proposedDraft: card.proposedDraft,
    anchorSelectedText: card.anchorSelectedText,
  });

  return buildReconciledHtml(regions, diffUi.decisions);
};
