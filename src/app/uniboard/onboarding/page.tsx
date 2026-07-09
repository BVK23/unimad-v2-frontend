import { fetchServerUserData } from "@/lib/server/fetchServerUserData";
import { redirect } from "next/navigation";
import OnboardingPageClient from "./OnboardingPageClient";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ mode?: string; test?: string }>;
};

/** In-product return modes allowed even after profile setup is complete. */
const REFINE_RETURN_MODES = new Set(["niche", "strengths"]);

/**
 * Show onboarding when profile setup is incomplete (field-based feature gates).
 * Do not use `onboarded_at` / `minimal_onboarded_at` — those mark minimal/CRM
 * completion and incorrectly bounce users who still need resume + niche.
 *
 * Fully set-up users are redirected away, except `?mode=niche|strengths` refine.
 */
export default async function UniboardOnboardingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const userData = await fetchServerUserData();
  const gates = userData?.feature_gates;
  const profileComplete = Boolean(gates?.profile_setup_complete);
  const nicheComplete = Boolean(gates?.niche_complete);
  const fullySetUp = profileComplete && nicheComplete;
  const refineMode = typeof params.mode === "string" && REFINE_RETURN_MODES.has(params.mode);

  if (fullySetUp && !refineMode) {
    redirect("/uniboard/resume");
  }

  return <OnboardingPageClient />;
}
