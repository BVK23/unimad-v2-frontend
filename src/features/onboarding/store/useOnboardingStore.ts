import { create } from "zustand";
import type { OnboardingDataState } from "../types";

type OnboardingStoreState = {
  userOnboardingData: OnboardingDataState;
  setUserOnboardingData: (partial: Partial<OnboardingDataState>) => void;
  resetUserOnboardingData: () => void;
};

const INITIAL_DATA: OnboardingDataState = {
  name: "",
  educations: [],
  experiences: [],
  projects: [],
  skills: [],
  role: [],
  phoneNumber: "",
  linkedinUrl: "",
  goal: [],
};

export const useOnboardingStore = create<OnboardingStoreState>(set => ({
  userOnboardingData: INITIAL_DATA,
  setUserOnboardingData: partial =>
    set(state => ({
      userOnboardingData: { ...state.userOnboardingData, ...partial },
    })),
  resetUserOnboardingData: () => set({ userOnboardingData: INITIAL_DATA }),
}));
