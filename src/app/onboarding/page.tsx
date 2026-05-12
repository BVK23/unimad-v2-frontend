import { Suspense } from "react";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingFlow />
    </Suspense>
  );
}
