import type { ResumeData } from "@/types";
import { create } from "zustand";
import { EMPTY_PDF_HIGHLIGHT_MAP, type PdfHighlightMap } from "../adkResumeHighlightDiff";
import { hasReviewForAssistant } from "../review-store-utils";

function newReviewId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `adk-review-${crypto.randomUUID()}`;
  }
  return `adk-review-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** One pending ADK resume diff review (stacked LIFO; discard pops). */
export type AdkReviewCard = {
  id: string;
  assistantMessageId: string | null;
  resumeId: string;
  baselineResumeJson: string;
  highlights: PdfHighlightMap;
  bannerTitle: string;
};

export type AdkResumeReviewState = {
  reviewStack: AdkReviewCard[];
  saveHandlers: Record<string, () => Promise<void>>;

  getActiveCard: () => AdkReviewCard | null;
  /** Highlights for PDF gutter — top of stack only. */
  getActiveHighlights: () => PdfHighlightMap;
  hasPendingReviewForResume: (resumeId: string) => boolean;

  beginReview: (input: {
    resumeId: string;
    baselineResume: ResumeData;
    highlights: PdfHighlightMap;
    bannerTitle: string;
    assistantMessageId?: string | null;
  }) => void;
  /** After successful save — clears stack and stripes. */
  markReviewAccepted: () => void;
  /** Baseline for the active (top) card — used for Discard. */
  getBaselineResume: () => ResumeData | null;
  clearAllReviews: () => void;
  clearReviewsByAssistantIds: (assistantIds: Iterable<string>) => void;
  /** After discard of active review — restores prior stacked review if any. */
  popReviewAfterDiscard: () => void;

  registerSaveHandler: (resumeId: string, fn: () => Promise<void>) => void;
  unregisterSaveHandler: (resumeId: string) => void;
  acceptAndSave: () => Promise<void>;
};

export const useAdkResumeReviewStore = create<AdkResumeReviewState>((set, get) => ({
  reviewStack: [],
  saveHandlers: {},

  getActiveCard: () => {
    const stack = get().reviewStack;
    if (stack.length === 0) return null;
    return stack[stack.length - 1] ?? null;
  },

  getActiveHighlights: () => {
    const c = get().getActiveCard();
    return c?.highlights ?? EMPTY_PDF_HIGHLIGHT_MAP;
  },

  hasPendingReviewForResume: resumeId => {
    const c = get().getActiveCard();
    return Boolean(c && c.resumeId === resumeId);
  },

  beginReview: ({ resumeId, baselineResume, highlights, bannerTitle, assistantMessageId }) => {
    if (Object.keys(highlights).length === 0) return;
    if (hasReviewForAssistant(get().reviewStack, assistantMessageId)) return;
    const card: AdkReviewCard = {
      id: newReviewId(),
      assistantMessageId: assistantMessageId ?? null,
      resumeId,
      baselineResumeJson: JSON.stringify(baselineResume),
      highlights,
      bannerTitle,
    };
    set(state => ({ reviewStack: [...state.reviewStack, card] }));
  },

  markReviewAccepted: () => {
    set({ reviewStack: [] });
  },

  getBaselineResume: () => {
    const c = get().getActiveCard();
    if (!c) return null;
    try {
      return JSON.parse(c.baselineResumeJson) as ResumeData;
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

  popReviewAfterDiscard: () => {
    set(state => {
      if (state.reviewStack.length === 0) return state;
      return { reviewStack: state.reviewStack.slice(0, -1) };
    });
  },

  registerSaveHandler: (resumeId, fn) => {
    set(state => ({
      saveHandlers: { ...state.saveHandlers, [resumeId]: fn },
    }));
  },

  unregisterSaveHandler: resumeId => {
    set(state => {
      const next = { ...state.saveHandlers };
      delete next[resumeId];
      return { saveHandlers: next };
    });
  },

  acceptAndSave: async () => {
    const card = get().getActiveCard();
    if (!card) return;
    const fn = get().saveHandlers[card.resumeId];
    if (fn) {
      await fn();
    }
    get().markReviewAccepted();
  },
}));
