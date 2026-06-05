import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { create } from "zustand";

export type AdkApplicationAssetReviewCard = {
  id: string;
  assistantMessageId: string | null;
  assetType: ApplicationAssetApiType;
  /** Proposed job context (ADK draft being reviewed). */
  role: string;
  company: string;
  jobDescription: string;
  contactName: string;
  /** Studio state before this review turn (restored on Discard). */
  baselineRole: string;
  baselineCompany: string;
  baselineJobDescription: string;
  baselineContactName: string;
  baselineDraft: string;
  proposedDraft: string;
  bannerTitle: string;
  baselineAssetId: string | null;
  /** The text the user selected when triggering this refinement (for anchored diff). */
  anchorSelectedText?: string;
  /** Preset label used (e.g. "Punchier hook"), if triggered via a preset action. */
  presetLabel?: string;
};

const newReviewId = (): string => `aa-review-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export type AdkApplicationAssetReviewState = {
  reviewStack: AdkApplicationAssetReviewCard[];
  getActiveCard: () => AdkApplicationAssetReviewCard | null;
  beginReview: (input: {
    assetType: ApplicationAssetApiType;
    role: string;
    company: string;
    jobDescription?: string;
    contactName?: string;
    baselineRole: string;
    baselineCompany: string;
    baselineJobDescription?: string;
    baselineContactName?: string;
    baselineDraft: string;
    proposedDraft: string;
    bannerTitle?: string;
    assistantMessageId?: string | null;
    baselineAssetId?: string | null;
    anchorSelectedText?: string;
    presetLabel?: string;
  }) => void;
  markReviewAccepted: () => void;
  popReviewAfterDiscard: () => void;
  clearAllReviews: () => void;
};

export const useAdkApplicationAssetReviewStore = create<AdkApplicationAssetReviewState>((set, get) => ({
  reviewStack: [],
  getActiveCard: () => {
    const stack = get().reviewStack;
    if (stack.length === 0) {
      return null;
    }
    return stack[stack.length - 1] ?? null;
  },
  beginReview: ({
    assetType,
    role,
    company,
    jobDescription = "",
    contactName = "",
    baselineRole,
    baselineCompany,
    baselineJobDescription = "",
    baselineContactName = "",
    baselineDraft,
    proposedDraft,
    bannerTitle,
    assistantMessageId,
    baselineAssetId = null,
    anchorSelectedText,
    presetLabel,
  }) => {
    const trimmed = proposedDraft.trim();
    if (!trimmed) {
      return;
    }
    const roleLabel = role.trim();
    const companyLabel = company.trim();
    const contextLabel = roleLabel && companyLabel ? `${roleLabel} at ${companyLabel}` : roleLabel || companyLabel || "this role";
    const card: AdkApplicationAssetReviewCard = {
      id: newReviewId(),
      assistantMessageId: assistantMessageId ?? null,
      assetType,
      role: roleLabel,
      company: companyLabel,
      jobDescription: jobDescription.trim(),
      contactName: contactName.trim(),
      baselineRole: baselineRole.trim(),
      baselineCompany: baselineCompany.trim(),
      baselineJobDescription: baselineJobDescription.trim(),
      baselineContactName: baselineContactName.trim(),
      baselineDraft,
      proposedDraft: trimmed,
      bannerTitle:
        bannerTitle ??
        `Review the ${assetType === "coverletter" ? "cover letter" : assetType === "coldemail" ? "cold email" : "referral"} for ${contextLabel} in Studio, then accept or discard.`,
      baselineAssetId,
      anchorSelectedText: anchorSelectedText?.trim() || undefined,
      presetLabel: presetLabel?.trim() || undefined,
    };
    set(state => ({ reviewStack: [...state.reviewStack, card] }));
  },
  markReviewAccepted: () => set({ reviewStack: [] }),
  popReviewAfterDiscard: () =>
    set(state => {
      if (state.reviewStack.length === 0) {
        return state;
      }
      return { reviewStack: state.reviewStack.slice(0, -1) };
    }),
  clearAllReviews: () => set({ reviewStack: [] }),
}));
