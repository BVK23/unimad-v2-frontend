"use client";

import { useEffect } from "react";
import UniboardOnboardingFlow from "@/components/uniboard-onboarding/UniboardOnboardingFlow";
import { parseOnboardingTestConfig } from "@/components/uniboard-onboarding/testMode";
import type { OnboardingEntryStep } from "@/features/onboarding/resolveOnboardingEntryStep";
import { useRouter, useSearchParams } from "next/navigation";

export default function OnboardingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testConfig = parseOnboardingTestConfig(searchParams);
  const testKey = testConfig ? searchParams?.toString() : "prod";

  const entryParam = searchParams?.get("entry");
  // Only special deep-links: niche (after resume→profile sync) and resume (skippers finishing setup).
  // Strengths is no longer an onboarding wizard step.
  const forcedEntryStep: OnboardingEntryStep | null = entryParam === "niche" || entryParam === "resume" ? entryParam : null;

  // Legacy deep-links (?mode=niche|profile_setup|strengths) — route computes the step now.
  useEffect(() => {
    if (testConfig) return;
    if (!searchParams?.get("mode")) return;
    router.replace("/uniboard/onboarding", { scroll: false });
  }, [router, searchParams, testConfig]);

  return <UniboardOnboardingFlow key={testKey} testConfig={testConfig} forcedEntryStep={forcedEntryStep} />;
}
