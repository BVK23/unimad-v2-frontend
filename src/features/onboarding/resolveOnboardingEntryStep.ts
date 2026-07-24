import type { ProfileData } from "@/features/user-profile/types";
import type { FeatureGates } from "./featureGates";

/** Steps the onboarding flow may open directly (skipping earlier wizard steps). */
export type OnboardingEntryStep = "welcome" | "name" | "resume" | "niche";

export const ONBOARDING_ROUTE = "/uniboard/onboarding";

export function hasResumeProfileProgress(profile: ProfileData | null | undefined): boolean {
  if (!profile) return false;
  const skills = profile.skills ?? [];
  return (
    (profile.educations?.length ?? 0) > 0 ||
    skills.length >= 3 ||
    (profile.experiences?.length ?? 0) > 0 ||
    (profile.projects?.length ?? 0) > 0
  );
}

export function hasPreferredName(profile: ProfileData | null | undefined): boolean {
  return Boolean(profile?.onboarding_data?.preferred_name?.trim());
}

/**
 * Pick the onboarding step for users returning to finish setup.
 * Order: incomplete initial wizard → preferred name → niche (if resume profile exists) → resume upload.
 * Strengths is handled outside this wizard (Unibot nudge), not as an onboarding entry.
 */
export function resolveOnboardingEntryStep(gates: FeatureGates, profile?: ProfileData | null): OnboardingEntryStep {
  if (gates.profile_setup_complete && gates.niche_complete) {
    return "welcome";
  }

  if (!gates.initial_onboarding_complete) {
    return "welcome";
  }

  // Minimal onboarded (phone + goals) but missing preferred name → continue full flow from name.
  if (!hasPreferredName(profile)) {
    return "name";
  }

  if (!gates.niche_complete && hasResumeProfileProgress(profile)) {
    return "niche";
  }

  // Skippers ("Do it later" after stage) and others without resume profile → resume step.
  return "resume";
}
