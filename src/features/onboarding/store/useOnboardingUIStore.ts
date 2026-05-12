import { create } from "zustand";

type OnboardingUIState = {
  loadingMessage: string | null;
  setLoadingMessage: (message: string | null | true) => void;
};

export const useOnboardingUIStore = create<OnboardingUIState>(set => ({
  loadingMessage: null,
  setLoadingMessage: message => set({ loadingMessage: message === true ? "Loading…" : message }),
}));
