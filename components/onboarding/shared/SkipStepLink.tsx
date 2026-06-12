"use client";

import { useOnboardingUIStore } from "@/features/onboarding/store/useOnboardingUIStore";

export default function SkipStepLink() {
  const canSkip = useOnboardingUIStore(s => s.canSkipCurrentStep);
  const skipCurrentStep = useOnboardingUIStore(s => s.skipCurrentStep);

  if (!canSkip || !skipCurrentStep) return null;

  return (
    <button type="button" onClick={skipCurrentStep} className="text-sm font-medium text-[#346DE0] hover:underline mt-1">
      Skip this step
    </button>
  );
}
