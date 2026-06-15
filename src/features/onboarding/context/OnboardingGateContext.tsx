"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type OnboardingGateContextValue = {
  profileSetupRequired: boolean;
  promptProfileSetup: () => void;
  dismissProfileSetupPrompt: () => void;
  profileSetupPromptOpen: boolean;
};

const OnboardingGateContext = createContext<OnboardingGateContextValue | null>(null);

export function OnboardingGateProvider({ profileSetupRequired, children }: { profileSetupRequired: boolean; children: React.ReactNode }) {
  const [profileSetupPromptOpen, setProfileSetupPromptOpen] = useState(false);

  const promptProfileSetup = useCallback(() => {
    if (profileSetupRequired) setProfileSetupPromptOpen(true);
  }, [profileSetupRequired]);

  const dismissProfileSetupPrompt = useCallback(() => {
    setProfileSetupPromptOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      profileSetupRequired,
      promptProfileSetup,
      dismissProfileSetupPrompt,
      profileSetupPromptOpen,
    }),
    [profileSetupRequired, promptProfileSetup, dismissProfileSetupPrompt, profileSetupPromptOpen]
  );

  return <OnboardingGateContext.Provider value={value}>{children}</OnboardingGateContext.Provider>;
}

export function useOnboardingGate() {
  const ctx = useContext(OnboardingGateContext);
  if (!ctx) {
    return {
      profileSetupRequired: false,
      promptProfileSetup: () => {},
      dismissProfileSetupPrompt: () => {},
      profileSetupPromptOpen: false,
    };
  }
  return ctx;
}
