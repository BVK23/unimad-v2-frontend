"use client";

import { useCallback, useState } from "react";
import { persistReviewDecisionForSession } from "@/features/adk-chat/persist-review-decision";
import { useAdkApplicationAssetReviewStore } from "@/features/adk-chat/stores/useAdkApplicationAssetReviewStore";
import { APPLICATION_ASSET_EVENTS } from "@/features/application-assets/api/application-asset-events";
import { syncApplicationAssetOnAccept } from "@/features/application-assets/api/syncApplicationAssetOnAccept";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";

export const useApplicationAssetReviewActions = (options?: { userId?: string; mainSessionId?: string }) => {
  const userId = options?.userId ?? "";
  const mainSessionId = options?.mainSessionId ?? "";
  const [adkReviewBusy, setAdkReviewBusy] = useState(false);

  const acceptApplicationAssetReview = useCallback(
    async (reconciledHtml?: string) => {
      const card = useAdkApplicationAssetReviewStore.getState().getActiveCard();
      if (!card) {
        return;
      }
      const studio = useApplicationAssetStudioStore.getState();
      setAdkReviewBusy(true);
      try {
        const finalDraft = reconciledHtml ?? card.proposedDraft;
        const jobDescription = card.jobDescription.trim() || studio.jobDescription;
        const result = await syncApplicationAssetOnAccept({
          assetType: card.assetType,
          proposedDraft: finalDraft,
          assetId: card.baselineAssetId ?? studio.assetId,
          role: card.role || studio.role,
          company: card.company || studio.company,
          jobDescription,
          contactName: card.contactName || studio.contactName,
          applicationId: studio.applicationId,
        });
        useAdkApplicationAssetReviewStore.getState().markReviewAccepted();
        if (userId && mainSessionId) {
          await persistReviewDecisionForSession(userId, mainSessionId, card.assistantMessageId, "accepted");
        }
        useApplicationAssetStudioStore.getState().clearSelection();
        window.dispatchEvent(
          new CustomEvent(APPLICATION_ASSET_EVENTS.applyContext, {
            detail: {
              assetType: card.assetType,
              role: card.role || studio.role,
              company: card.company || studio.company,
              jobDescription,
              contactName: card.contactName || studio.contactName || undefined,
              assetId: result.assetId,
            },
          })
        );
      } catch (err) {
        console.error("Application asset accept failed:", err);
      } finally {
        setAdkReviewBusy(false);
      }
    },
    [userId, mainSessionId]
  );

  const discardApplicationAssetReview = useCallback(() => {
    const card = useAdkApplicationAssetReviewStore.getState().getActiveCard();
    if (!card) {
      return;
    }
    void persistReviewDecisionForSession(userId, mainSessionId, card.assistantMessageId, "discarded");
    useAdkApplicationAssetReviewStore.getState().popReviewAfterDiscard();
    useApplicationAssetStudioStore.getState().syncFromStudio({
      assetType: card.assetType,
      assetId: card.baselineAssetId,
      role: card.baselineRole,
      company: card.baselineCompany,
      jobDescription: card.baselineJobDescription,
      contactName: card.baselineContactName,
      draftPreview: card.baselineDraft,
      acceptedContent: card.baselineDraft,
    });
    useApplicationAssetStudioStore.getState().clearSelection();
    window.dispatchEvent(
      new CustomEvent(APPLICATION_ASSET_EVENTS.applyContext, {
        detail: {
          assetType: card.assetType,
          role: card.baselineRole,
          company: card.baselineCompany,
          jobDescription: card.baselineJobDescription,
          contactName: card.baselineContactName || undefined,
          assetId: card.baselineAssetId,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent(APPLICATION_ASSET_EVENTS.draftPreview, {
        detail: {
          draft: card.baselineDraft,
          assetType: card.assetType,
          role: card.baselineRole,
          company: card.baselineCompany,
          jobDescription: card.baselineJobDescription,
          assetId: card.baselineAssetId,
        },
      })
    );
  }, [userId, mainSessionId]);

  return {
    adkReviewBusy,
    acceptApplicationAssetReview,
    discardApplicationAssetReview,
  };
};
