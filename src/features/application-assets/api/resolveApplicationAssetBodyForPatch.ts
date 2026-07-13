import { useAdkApplicationAssetReviewStore } from "@/features/adk-chat/stores/useAdkApplicationAssetReviewStore";
import type { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";

type StudioSnapshot = ReturnType<typeof useApplicationAssetStudioStore.getState>;

export type ApplicationAssetBodyForPatch = {
  /** Body written to `application_asset_data[active].body`. */
  sessionBody: string;
  /** When true, PATCH intentionally omits body so agent runs first-draft generation. */
  regenerateDraft: boolean;
};

/**
 * Resolve the document body to PATCH before an ADK application-asset send.
 * Prefers studio store, then live editor snapshot, then active review proposed draft.
 */
export const resolveApplicationAssetBodyForPatch = (studio: StudioSnapshot): ApplicationAssetBodyForPatch => {
  const reviewCard = useAdkApplicationAssetReviewStore.getState().getActiveCard();
  const proposedFromReview = reviewCard?.proposedDraft?.trim() ?? "";

  /** One body for ADK: what Studio is showing (live edits win). */
  const live = studio.liveDocumentBody?.trim();
  const draft = studio.draftPreview?.trim();
  const accepted = studio.acceptedContent?.trim();
  const baseline = live || draft || accepted || proposedFromReview;

  if (studio.regenerateAnotherInFlight) {
    // Generate Another bootstrap: empty body only until a draft exists in review or store.
    if (proposedFromReview) {
      return { sessionBody: proposedFromReview.slice(0, 8000), regenerateDraft: false };
    }
    if (baseline) {
      return { sessionBody: baseline.slice(0, 8000), regenerateDraft: false };
    }
    return { sessionBody: "", regenerateDraft: true };
  }

  return {
    sessionBody: baseline.slice(0, 8000),
    regenerateDraft: false,
  };
};
