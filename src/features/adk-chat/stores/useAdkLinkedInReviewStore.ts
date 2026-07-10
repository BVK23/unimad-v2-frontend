import type { LinkedInSessionProfile } from "@/src/features/linkedin/api/adk-mappers";
import { create } from "zustand";
import { EMPTY_LINKEDIN_HIGHLIGHT_MAP, type LinkedInHighlightMap } from "../adkLinkedInHighlightDiff";
import { hasReviewForAssistant } from "../review-store-utils";

function newReviewId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `adk-linkedin-review-${crypto.randomUUID()}`;
  }
  return `adk-linkedin-review-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type AdkLinkedInReviewCard = {
  id: string;
  assistantMessageId: string | null;
  profileKey: string;
  baselineProfileJson: string;
  highlights: LinkedInHighlightMap;
  bannerTitle: string;
};

export type AdkLinkedInReviewState = {
  reviewStack: AdkLinkedInReviewCard[];
  saveHandlers: Record<string, () => Promise<void>>;

  getActiveCard: () => AdkLinkedInReviewCard | null;
  getActiveHighlights: () => LinkedInHighlightMap;
  hasPendingReviewForProfile: (profileKey: string) => boolean;

  beginReview: (input: {
    profileKey: string;
    baselineProfile: LinkedInSessionProfile;
    highlights: LinkedInHighlightMap;
    bannerTitle: string;
    assistantMessageId?: string | null;
  }) => void;
  markReviewAccepted: () => void;
  getBaselineProfile: () => LinkedInSessionProfile | null;
  clearAllReviews: () => void;
  clearReviewsByAssistantIds: (assistantIds: Iterable<string>) => void;
  dismissReviewsForProfile: (profileKey: string) => void;
  popReviewAfterDiscard: () => void;

  registerSaveHandler: (profileKey: string, fn: () => Promise<void>) => void;
  unregisterSaveHandler: (profileKey: string) => void;
  acceptAndSave: () => Promise<void>;
};

export const useAdkLinkedInReviewStore = create<AdkLinkedInReviewState>((set, get) => ({
  reviewStack: [],
  saveHandlers: {},

  getActiveCard: () => {
    const stack = get().reviewStack;
    if (stack.length === 0) return null;
    return stack[stack.length - 1] ?? null;
  },

  getActiveHighlights: () => {
    const c = get().getActiveCard();
    return c?.highlights ?? EMPTY_LINKEDIN_HIGHLIGHT_MAP;
  },

  hasPendingReviewForProfile: profileKey => {
    const c = get().getActiveCard();
    return Boolean(c && c.profileKey === profileKey);
  },

  beginReview: ({ profileKey, baselineProfile, highlights, bannerTitle, assistantMessageId }) => {
    if (!assistantMessageId?.trim()) return;
    if (Object.keys(highlights).length === 0) return;
    if (hasReviewForAssistant(get().reviewStack, assistantMessageId)) return;
    const card: AdkLinkedInReviewCard = {
      id: newReviewId(),
      assistantMessageId: assistantMessageId ?? null,
      profileKey,
      baselineProfileJson: JSON.stringify(baselineProfile),
      highlights,
      bannerTitle,
    };
    set(state => ({ reviewStack: [...state.reviewStack, card] }));
  },

  markReviewAccepted: () => {
    set({ reviewStack: [] });
  },

  getBaselineProfile: () => {
    const c = get().getActiveCard();
    if (!c) return null;
    try {
      return JSON.parse(c.baselineProfileJson) as LinkedInSessionProfile;
    } catch {
      return null;
    }
  },

  clearAllReviews: () => {
    set({ reviewStack: [] });
  },

  clearReviewsByAssistantIds: assistantIds => {
    const drop = new Set([...assistantIds].filter(Boolean));
    if (drop.size === 0) return;
    set(state => ({
      reviewStack: state.reviewStack.filter(card => !card.assistantMessageId || !drop.has(card.assistantMessageId)),
    }));
  },

  dismissReviewsForProfile: profileKey => {
    const key = profileKey.trim();
    if (!key) return;
    set(state => ({
      reviewStack: state.reviewStack.filter(card => card.profileKey !== key),
    }));
  },

  popReviewAfterDiscard: () => {
    set(state => {
      if (state.reviewStack.length === 0) return state;
      return { reviewStack: state.reviewStack.slice(0, -1) };
    });
  },

  registerSaveHandler: (profileKey, fn) => {
    set(state => ({
      saveHandlers: { ...state.saveHandlers, [profileKey]: fn },
    }));
  },

  unregisterSaveHandler: profileKey => {
    set(state => {
      const next = { ...state.saveHandlers };
      delete next[profileKey];
      return { saveHandlers: next };
    });
  },

  acceptAndSave: async () => {
    const card = get().getActiveCard();
    if (!card) return;
    const fn = get().saveHandlers[card.profileKey];
    if (fn) {
      await fn();
    }
    get().markReviewAccepted();
  },
}));
