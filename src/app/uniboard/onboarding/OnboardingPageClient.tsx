"use client";

import UniboardOnboardingFlow from "@/components/uniboard-onboarding/UniboardOnboardingFlow";
import { parseOnboardingTestConfig } from "@/components/uniboard-onboarding/testMode";
import { useSearchParams } from "next/navigation";

export default function UniboardOnboardingPageClient() {
  const searchParams = useSearchParams();
  const mode = searchParams?.get("mode");
  const initialMode = mode === "niche" || mode === "strengths" ? mode : null;
  const testConfig = parseOnboardingTestConfig(searchParams);
  const testKey = testConfig ? searchParams?.toString() : "prod";

  return <UniboardOnboardingFlow key={testKey} initialMode={initialMode} testConfig={testConfig} />;
}
