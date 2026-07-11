"use client";

import { useEffect } from "react";
import UniboardOnboardingFlow from "@/components/uniboard-onboarding/UniboardOnboardingFlow";
import { parseOnboardingTestConfig } from "@/components/uniboard-onboarding/testMode";
import { useRouter, useSearchParams } from "next/navigation";

export default function OnboardingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testConfig = parseOnboardingTestConfig(searchParams);
  const testKey = testConfig ? searchParams?.toString() : "prod";

  // Legacy deep-links (?mode=niche|profile_setup|strengths) — route computes the step now.
  useEffect(() => {
    if (testConfig) return;
    if (!searchParams?.get("mode")) return;
    router.replace("/uniboard/onboarding", { scroll: false });
  }, [router, searchParams, testConfig]);

  return <UniboardOnboardingFlow key={testKey} testConfig={testConfig} />;
}
