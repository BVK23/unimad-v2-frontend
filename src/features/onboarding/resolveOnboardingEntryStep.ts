import type { ProfileData } from "@/features/user-profile/types";
import type { FeatureGates } from "./featureGates";

/** Steps the onboarding flow may open directly (skipping earlier wizard steps). */
export type OnboardingEntryStep = "welcome" | "resume" | "niche" | "strengths";

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

/**
 * Pick the onboarding step for users returning to finish setup.
 * Order follows product gates: phone/goals wizard → resume upload/build → niche discovery.
 */
export function resolveOnboardingEntryStep(gates: FeatureGates, profile?: ProfileData | null): OnboardingEntryStep {
  if (gates.profile_setup_complete && gates.niche_complete) {
    if (!gates.strengths_complete && gates.strengths_recommended) {
      return "strengths";
    }
    return "welcome";
  }

  if (!gates.initial_onboarding_complete) {
    return "welcome";
  }

  if (!gates.niche_complete && hasResumeProfileProgress(profile)) {
    return "niche";
  }

  return "resume";
}
