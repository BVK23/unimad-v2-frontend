import type { PortfolioData } from "@/types";
import { create } from "zustand";
import { EMPTY_PORTFOLIO_HIGHLIGHT_MAP, type PortfolioHighlightMap } from "../adkPortfolioHighlightDiff";
import { hasReviewForAssistant } from "../review-store-utils";

function newReviewId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `adk-portfolio-review-${crypto.randomUUID()}`;
  }
  return `adk-portfolio-review-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type AdkPortfolioReviewCard = {
  id: string;
  assistantMessageId: string | null;
  portfolioId: string;
  baselinePortfolioJson: string;
  highlights: PortfolioHighlightMap;
  bannerTitle: string;
};

export type AdkPortfolioReviewState = {
  reviewStack: AdkPortfolioReviewCard[];
  saveHandlers: Record<string, () => Promise<void>>;

  getActiveCard: () => AdkPortfolioReviewCard | null;
  getActiveHighlights: () => PortfolioHighlightMap;
  hasPendingReviewForPortfolio: (portfolioId: string) => boolean;

  beginReview: (input: {
    portfolioId: string;
    baselinePortfolio: PortfolioData;
    highlights: PortfolioHighlightMap;
    bannerTitle: string;
    assistantMessageId?: string | null;
  }) => void;
  markReviewAccepted: () => void;
  getBaselinePortfolio: () => PortfolioData | null;
  clearAllReviews: () => void;
  clearReviewsByAssistantIds: (assistantIds: Iterable<string>) => void;
  dismissReviewsForPortfolio: (portfolioId: string) => void;
  popReviewAfterDiscard: () => void;

  registerSaveHandler: (portfolioId: string, fn: () => Promise<void>) => void;
  unregisterSaveHandler: (portfolioId: string) => void;
  acceptAndSave: () => Promise<void>;
};

export const useAdkPortfolioReviewStore = create<AdkPortfolioReviewState>((set, get) => ({
  reviewStack: [],
  saveHandlers: {},

  getActiveCard: () => {
    const stack = get().reviewStack;
    if (stack.length === 0) return null;
    return stack[stack.length - 1] ?? null;
  },

  getActiveHighlights: () => {
    const c = get().getActiveCard();
    return c?.highlights ?? EMPTY_PORTFOLIO_HIGHLIGHT_MAP;
  },

  hasPendingReviewForPortfolio: portfolioId => {
    const c = get().getActiveCard();
    return Boolean(c && c.portfolioId === portfolioId);
  },

  beginReview: ({ portfolioId, baselinePortfolio, highlights, bannerTitle, assistantMessageId }) => {
    if (!assistantMessageId?.trim()) return;
    if (Object.keys(highlights).length === 0) return;
    if (hasReviewForAssistant(get().reviewStack, assistantMessageId)) return;
    const card: AdkPortfolioReviewCard = {
      id: newReviewId(),
      assistantMessageId: assistantMessageId ?? null,
      portfolioId,
      baselinePortfolioJson: JSON.stringify(baselinePortfolio),
      highlights,
      bannerTitle,
    };
    set(state => ({ reviewStack: [...state.reviewStack, card] }));
  },

  markReviewAccepted: () => {
    set({ reviewStack: [] });
  },

  getBaselinePortfolio: () => {
    const c = get().getActiveCard();
    if (!c) return null;
    try {
      return JSON.parse(c.baselinePortfolioJson) as PortfolioData;
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

  dismissReviewsForPortfolio: portfolioId => {
    const id = portfolioId.trim();
    if (!id) return;
    set(state => ({
      reviewStack: state.reviewStack.filter(card => card.portfolioId !== id),
    }));
  },

  popReviewAfterDiscard: () => {
    set(state => {
      if (state.reviewStack.length === 0) return state;
      return { reviewStack: state.reviewStack.slice(0, -1) };
    });
  },

  registerSaveHandler: (portfolioId, fn) => {
    set(state => ({
      saveHandlers: { ...state.saveHandlers, [portfolioId]: fn },
    }));
  },

  unregisterSaveHandler: portfolioId => {
    set(state => {
      const next = { ...state.saveHandlers };
      delete next[portfolioId];
      return { saveHandlers: next };
    });
  },

  acceptAndSave: async () => {
    const card = get().getActiveCard();
    if (!card) return;
    const fn = get().saveHandlers[card.portfolioId];
    if (fn) {
      await fn();
    }
    get().markReviewAccepted();
  },
}));
