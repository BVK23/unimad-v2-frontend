"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type OnboardingGateContextValue = {
  profileSetupRequired: boolean;
  promptProfileSetup: () => void;
  dismissProfileSetupPrompt: () => void;
  profileSetupPromptOpen: boolean;
  blockingGateDismissed: boolean;
  dismissBlockingGate: () => void;
  resetBlockingGate: () => void;
};

const OnboardingGateContext = createContext<OnboardingGateContextValue | null>(null);

export function OnboardingGateProvider({ profileSetupRequired, children }: { profileSetupRequired: boolean; children: React.ReactNode }) {
  const [profileSetupPromptOpen, setProfileSetupPromptOpen] = useState(false);
  const [blockingGateDismissed, setBlockingGateDismissed] = useState(false);

  const promptProfileSetup = useCallback(() => {
    if (profileSetupRequired) setProfileSetupPromptOpen(true);
  }, [profileSetupRequired]);

  const dismissProfileSetupPrompt = useCallback(() => {
    setProfileSetupPromptOpen(false);
  }, []);

  const dismissBlockingGate = useCallback(() => {
    setBlockingGateDismissed(true);
    setProfileSetupPromptOpen(false);
  }, []);

  const resetBlockingGate = useCallback(() => {
    setBlockingGateDismissed(false);
  }, []);

  React.useEffect(() => {
    if (!profileSetupRequired) {
      setBlockingGateDismissed(false);
    }
  }, [profileSetupRequired]);

  const value = useMemo(
    () => ({
      profileSetupRequired,
      promptProfileSetup,
      dismissProfileSetupPrompt,
      profileSetupPromptOpen,
      blockingGateDismissed,
      dismissBlockingGate,
      resetBlockingGate,
    }),
    [
      profileSetupRequired,
      promptProfileSetup,
      dismissProfileSetupPrompt,
      profileSetupPromptOpen,
      blockingGateDismissed,
      dismissBlockingGate,
      resetBlockingGate,
    ]
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
      blockingGateDismissed: false,
      dismissBlockingGate: () => {},
      resetBlockingGate: () => {},
    };
  }
  return ctx;
}
