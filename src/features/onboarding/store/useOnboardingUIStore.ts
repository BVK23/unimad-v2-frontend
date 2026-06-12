import { create } from "zustand";

type OnboardingUIState = {
  loadingMessage: string | null;
  setLoadingMessage: (message: string | null | true) => void;
  canSkipCurrentStep: boolean;
  setCanSkipCurrentStep: (canSkip: boolean) => void;
  skipCurrentStep: (() => void) | null;
  registerSkipCurrentStep: (handler: (() => void) | null) => void;
};

export const useOnboardingUIStore = create<OnboardingUIState>(set => ({
  loadingMessage: null,
  setLoadingMessage: message => set({ loadingMessage: message === true ? "Loading…" : message }),
  canSkipCurrentStep: false,
  setCanSkipCurrentStep: canSkip => set({ canSkipCurrentStep: canSkip }),
  skipCurrentStep: null,
  registerSkipCurrentStep: handler => set({ skipCurrentStep: handler }),
}));
