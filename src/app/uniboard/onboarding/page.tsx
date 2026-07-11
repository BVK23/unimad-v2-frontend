import { fetchServerUserData } from "@/lib/server/fetchServerUserData";
import { redirect } from "next/navigation";
import OnboardingPageClient from "./OnboardingPageClient";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ mode?: string; test?: string }>;
};

/**
 * Show onboarding when profile setup is incomplete (field-based feature gates).
 * Fully set-up users are redirected to resume; entry step is computed client-side.
 */
export default async function UniboardOnboardingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const userData = await fetchServerUserData();
  const gates = userData?.feature_gates;
  const profileComplete = Boolean(gates?.profile_setup_complete);
  const nicheComplete = Boolean(gates?.niche_complete);
  const fullySetUp = profileComplete && nicheComplete;
  const isTestMode = params.test === "1";

  if (fullySetUp && !isTestMode) {
    redirect("/uniboard/resume");
  }

  return <OnboardingPageClient />;
}
