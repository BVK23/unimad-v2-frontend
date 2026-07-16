import { create } from "zustand";

export type PortfolioGenerationPendingAction = "create_initial" | "replace";

type PortfolioGenerationState = {
  /** Set before navigating from chat (or elsewhere); consumed on portfolio page mount. */
  pendingAction: PortfolioGenerationPendingAction | null;
  setPendingAction: (action: PortfolioGenerationPendingAction) => void;
  clearPendingAction: () => void;
  consumePendingAction: () => PortfolioGenerationPendingAction | null;
};

export const usePortfolioGenerationStore = create<PortfolioGenerationState>((set, get) => ({
  pendingAction: null,
  setPendingAction: action => set({ pendingAction: action }),
  clearPendingAction: () => set({ pendingAction: null }),
  consumePendingAction: () => {
    const action = get().pendingAction;
    if (action) set({ pendingAction: null });
    return action;
  },
}));
