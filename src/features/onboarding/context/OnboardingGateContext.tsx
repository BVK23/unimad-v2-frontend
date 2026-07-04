"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import FeatureOnboardingPromptModal from "@/components/onboarding/FeatureOnboardingPromptModal";
import { DEFAULT_FEATURE_GATES, type FeatureGates, type OnboardingPromptKind } from "@/features/onboarding/featureGates";

type OnboardingGateContextValue = {
  profileSetupRequired: boolean;
  featureGates: FeatureGates;
  promptProfileSetup: () => void;
  promptOnboarding: (kind: OnboardingPromptKind) => void;
  dismissProfileSetupPrompt: () => void;
  profileSetupPromptOpen: boolean;
  blockingGateDismissed: boolean;
  dismissBlockingGate: () => void;
  resetBlockingGate: () => void;
};

const OnboardingGateContext = createContext<OnboardingGateContextValue | null>(null);

export function OnboardingGateProvider({
  profileSetupRequired,
  featureGates = DEFAULT_FEATURE_GATES,
  children,
}: {
  profileSetupRequired: boolean;
  featureGates?: FeatureGates;
  children: React.ReactNode;
}) {
  const [profileSetupPromptOpen, setProfileSetupPromptOpen] = useState(false);
  const [blockingGateDismissed, setBlockingGateDismissed] = useState(false);
  const [promptKind, setPromptKind] = useState<OnboardingPromptKind | null>(null);

  const promptProfileSetup = useCallback(() => {
    if (profileSetupRequired) setProfileSetupPromptOpen(true);
  }, [profileSetupRequired]);

  const promptOnboarding = useCallback((kind: OnboardingPromptKind) => {
    setPromptKind(kind);
  }, []);

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
      featureGates,
      promptProfileSetup,
      promptOnboarding,
      dismissProfileSetupPrompt,
      profileSetupPromptOpen,
      blockingGateDismissed,
      dismissBlockingGate,
      resetBlockingGate,
    }),
    [
      profileSetupRequired,
      featureGates,
      promptProfileSetup,
      promptOnboarding,
      dismissProfileSetupPrompt,
      profileSetupPromptOpen,
      blockingGateDismissed,
      dismissBlockingGate,
      resetBlockingGate,
    ]
  );

  return (
    <OnboardingGateContext.Provider value={value}>
      {children}
      <FeatureOnboardingPromptModal open={promptKind !== null} kind={promptKind ?? "profile_setup"} onDismiss={() => setPromptKind(null)} />
    </OnboardingGateContext.Provider>
  );
}

export function useOnboardingGate() {
  const ctx = useContext(OnboardingGateContext);
  if (!ctx) {
    return {
      profileSetupRequired: false,
      featureGates: DEFAULT_FEATURE_GATES,
      promptProfileSetup: () => {},
      promptOnboarding: (_kind: OnboardingPromptKind) => {},
      dismissProfileSetupPrompt: () => {},
      profileSetupPromptOpen: false,
      blockingGateDismissed: false,
      dismissBlockingGate: () => {},
      resetBlockingGate: () => {},
    };
  }
  return ctx;
}
