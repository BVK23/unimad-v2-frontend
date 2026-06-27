import { create } from "zustand";

export type DiffReviewDecision = "keep" | "undo";

export type ApplicationAssetDiffReviewUiState = {
  sessionId: string | null;
  regionIds: string[];
  decisions: Record<string, DiffReviewDecision>;
  activeRegionId: string | null;
  initSession: (sessionId: string, regionIds: string[]) => void;
  clearSession: () => void;
  setActiveRegionId: (regionId: string) => void;
  keepRegion: (regionId: string) => void;
  undoRegion: (regionId: string) => void;
  keepAll: () => void;
  undoAll: () => void;
  getReviewedCount: () => number;
  getTotalCount: () => number;
  getActiveIndex: () => number;
  isSessionActive: () => boolean;
};

export const useApplicationAssetDiffReviewUiStore = create<ApplicationAssetDiffReviewUiState>((set, get) => ({
  sessionId: null,
  regionIds: [],
  decisions: {},
  activeRegionId: null,

  initSession: (sessionId, regionIds) => {
    set({
      sessionId,
      regionIds,
      decisions: {},
      activeRegionId: regionIds[0] ?? null,
    });
  },

  clearSession: () => {
    set({
      sessionId: null,
      regionIds: [],
      decisions: {},
      activeRegionId: null,
    });
  },

  setActiveRegionId: regionId => {
    set({ activeRegionId: regionId });
  },

  keepRegion: regionId => {
    set(state => ({
      decisions: { ...state.decisions, [regionId]: "keep" },
    }));
  },

  undoRegion: regionId => {
    set(state => ({
      decisions: { ...state.decisions, [regionId]: "undo" },
    }));
  },

  keepAll: () => {
    const { regionIds } = get();
    const all: Record<string, DiffReviewDecision> = {};
    for (const id of regionIds) {
      all[id] = "keep";
    }
    set({ decisions: all });
  },

  undoAll: () => {
    const { regionIds } = get();
    const all: Record<string, DiffReviewDecision> = {};
    for (const id of regionIds) {
      all[id] = "undo";
    }
    set({ decisions: all });
  },

  getReviewedCount: () => {
    const { regionIds, decisions } = get();
    return regionIds.filter(id => decisions[id]).length;
  },

  getTotalCount: () => get().regionIds.length,

  getActiveIndex: () => {
    const { regionIds, activeRegionId } = get();
    if (!activeRegionId) return 0;
    const idx = regionIds.indexOf(activeRegionId);
    return idx >= 0 ? idx : 0;
  },

  isSessionActive: () => {
    const { sessionId, regionIds } = get();
    return Boolean(sessionId && regionIds.length > 0);
  },
}));
