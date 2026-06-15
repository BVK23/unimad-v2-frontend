import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import { create } from "zustand";
import { hasReviewForAssistant } from "../review-store-utils";

export type AdkContentGenReviewCard = {
  id: string;

  assistantMessageId: string | null;

  topic: string;

  funnel: ContentGenFunnel | null;

  baselineDraft: string;

  proposedDraft: string;

  bannerTitle: string;

  baselineTopic: string;

  baselineAssetId: string | null;

  baselineFunnel: ContentGenFunnel | null;

  isTopicChange: boolean;
};

const newReviewId = (): string => `cg-review-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export type AdkContentGenReviewState = {
  reviewStack: AdkContentGenReviewCard[];

  getActiveCard: () => AdkContentGenReviewCard | null;

  beginReview: (input: {
    topic: string;

    funnel: ContentGenFunnel | null;

    baselineDraft: string;

    proposedDraft: string;

    bannerTitle?: string;

    assistantMessageId?: string | null;

    baselineTopic?: string;

    baselineAssetId?: string | null;

    baselineFunnel?: ContentGenFunnel | null;

    isTopicChange?: boolean;
  }) => void;

  markReviewAccepted: () => void;

  popReviewAfterDiscard: () => void;

  clearAllReviews: () => void;
};

export const useAdkContentGenReviewStore = create<AdkContentGenReviewState>((set, get) => ({
  reviewStack: [],

  getActiveCard: () => {
    const stack = get().reviewStack;

    if (stack.length === 0) {
      return null;
    }

    return stack[stack.length - 1] ?? null;
  },

  beginReview: ({
    topic,

    funnel,

    baselineDraft,

    proposedDraft,

    bannerTitle,

    assistantMessageId,

    baselineTopic = "",

    baselineAssetId = null,

    baselineFunnel = null,

    isTopicChange = false,
  }) => {
    const trimmed = proposedDraft.trim();

    if (!trimmed || !topic.trim()) {
      return;
    }

    if (hasReviewForAssistant(get().reviewStack, assistantMessageId)) {
      return;
    }

    const card: AdkContentGenReviewCard = {
      id: newReviewId(),

      assistantMessageId: assistantMessageId ?? null,

      topic: topic.trim(),

      funnel,

      baselineDraft,

      proposedDraft: trimmed,

      bannerTitle: bannerTitle ?? "Review the LinkedIn post edit in Studio, then accept or improve.",

      baselineTopic: baselineTopic.trim(),

      baselineAssetId,

      baselineFunnel,

      isTopicChange,
    };

    set(state => ({ reviewStack: [...state.reviewStack, card] }));
  },

  markReviewAccepted: () => {
    set({ reviewStack: [] });
  },

  popReviewAfterDiscard: () => {
    set(state => {
      if (state.reviewStack.length === 0) {
        return state;
      }

      return { reviewStack: state.reviewStack.slice(0, -1) };
    });
  },

  clearAllReviews: () => {
    set({ reviewStack: [] });
  },
}));
