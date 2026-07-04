"use client";

import UniboardOnboardingFlow from "@/components/uniboard-onboarding/UniboardOnboardingFlow";
import { useSearchParams } from "next/navigation";

export default function UniboardOnboardingPageClient() {
  const searchParams = useSearchParams();
  const mode = searchParams?.get("mode");
  const initialMode = mode === "niche" || mode === "strengths" ? mode : null;

  return <UniboardOnboardingFlow initialMode={initialMode} />;
}
