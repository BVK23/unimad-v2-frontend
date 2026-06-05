import { normalizePortfolioData } from "@/features/portfolio/utils/normalizePortfolioItems";
import type { PortfolioData } from "@/types";
import { create } from "zustand";

interface PortfolioStoreState {
  portfolioData: Record<string, PortfolioData>;
  focusedPageCardByPortfolioId: Record<string, string | null>;

  setAllPortfolios: (portfolios: PortfolioData[]) => void;
  setPortfolioData: (portfolioId: string, data: PortfolioData) => void;
  getPortfolioData: (portfolioId: string) => PortfolioData | undefined;
  updatePortfolio: (portfolioId: string, updater: (prev: PortfolioData) => PortfolioData) => void;
  setFocusedPageCardId: (portfolioId: string, pageCardId: string | null) => void;
  getFocusedPageCardId: (portfolioId: string) => string | null;
  clearFocusedPageCardId: (portfolioId: string) => void;
}

export const usePortfolioStore = create<PortfolioStoreState>((set, get) => ({
  portfolioData: {},
  focusedPageCardByPortfolioId: {},

  setAllPortfolios: portfolios => {
    const dataMap: Record<string, PortfolioData> = {};
    portfolios.forEach(p => {
      if (p.id) {
        dataMap[p.id] = normalizePortfolioData(p, { clampTitleOnlyHeights: true });
      }
    });
    set({ portfolioData: dataMap });
  },

  setPortfolioData: (portfolioId, data) =>
    set(state => ({
      portfolioData: {
        ...state.portfolioData,
        [portfolioId]: normalizePortfolioData({ ...data, id: portfolioId }, { clampTitleOnlyHeights: true }),
      },
    })),

  getPortfolioData: portfolioId => get().portfolioData[portfolioId],

  updatePortfolio: (portfolioId, updater) =>
    set(state => {
      const current = state.portfolioData[portfolioId];
      if (!current) return state;
      const next = normalizePortfolioData(updater(current));
      return {
        portfolioData: {
          ...state.portfolioData,
          [portfolioId]: { ...next, id: portfolioId },
        },
      };
    }),

  setFocusedPageCardId: (portfolioId, pageCardId) =>
    set(state => ({
      focusedPageCardByPortfolioId: {
        ...state.focusedPageCardByPortfolioId,
        [portfolioId]: pageCardId,
      },
    })),

  getFocusedPageCardId: portfolioId => get().focusedPageCardByPortfolioId[portfolioId] ?? null,

  clearFocusedPageCardId: portfolioId =>
    set(state => {
      if (!(portfolioId in state.focusedPageCardByPortfolioId)) {
        return state;
      }
      const nextFocused = { ...state.focusedPageCardByPortfolioId };
      delete nextFocused[portfolioId];
      return { focusedPageCardByPortfolioId: nextFocused };
    }),
}));
