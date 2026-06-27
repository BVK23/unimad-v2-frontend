"use client";

import { useCallback, useState } from "react";
import { buildApplicationAssetContentKey } from "@/features/adk-chat/content-scope";
import { persistAcceptSnapshotForSession } from "@/features/adk-chat/persist-accept-snapshot";
import { persistReviewDecisionForSession } from "@/features/adk-chat/persist-review-decision";
import { buildApplicationAssetSnapshotPayload } from "@/features/adk-chat/revert-django-content-after-rewind";
import { useAdkApplicationAssetReviewStore } from "@/features/adk-chat/stores/useAdkApplicationAssetReviewStore";
import { syncAdkContentStateOnAccept } from "@/features/adk-chat/sync-adk-content-on-accept";
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
        if (userId && mainSessionId && card.assistantMessageId) {
          const contentKey = buildApplicationAssetContentKey({
            assetType: card.assetType,
            assetId: result.assetId,
            role: card.role || studio.role,
            company: card.company || studio.company,
          });
          const prePayload = buildApplicationAssetSnapshotPayload({
            content: card.baselineDraft,
            assetType: card.assetType,
            assetId: card.baselineAssetId,
            role: card.baselineRole,
            company: card.baselineCompany,
            jobDescription: card.baselineJobDescription,
            contactName: card.baselineContactName,
          });
          const postPayload = buildApplicationAssetSnapshotPayload({
            content: finalDraft,
            assetType: card.assetType,
            assetId: result.assetId,
            role: card.role || studio.role,
            company: card.company || studio.company,
            jobDescription,
            contactName: card.contactName || studio.contactName,
          });
          await persistAcceptSnapshotForSession(userId, mainSessionId, {
            domain: "application_asset",
            contentKey,
            assistantMessageId: card.assistantMessageId,
            preAcceptPayload: prePayload,
            postAcceptPayload: postPayload,
            acceptedAt: new Date().toISOString(),
          });
          await syncAdkContentStateOnAccept(userId, mainSessionId, postPayload);
          await persistReviewDecisionForSession(userId, mainSessionId, card.assistantMessageId, "accepted");
        }
        useApplicationAssetStudioStore.getState().clearSelection();
        useApplicationAssetStudioStore.getState().setRegenerateAnotherInFlight(false);
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
        window.dispatchEvent(
          new CustomEvent(APPLICATION_ASSET_EVENTS.reviewAccepted, {
            detail: {
              assetType: card.assetType,
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
    useApplicationAssetStudioStore.getState().clearRefineAnchor();
    useApplicationAssetStudioStore.getState().setRegenerateAnotherInFlight(false);
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
