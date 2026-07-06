import type { ProfileBuilderData } from "@/components/uniboard-onboarding/profile-builder/types";
import type { PersonalizationProfile } from "@/features/onboarding/types";

export const ONBOARDING_ADK_APP = "onboarding";

export const ONBOARDING_START_MESSAGE = "__onboarding_start__";

export const ONBOARDING_MUTATING_TOOLS = new Set([
  "add_onboarding_education",
  "add_onboarding_experience",
  "mark_onboarding_experience_skipped",
  "add_onboarding_project",
  "set_onboarding_skills",
]);

export type OnboardingAdkContext = {
  preferredName: string;
  personalization?: PersonalizationProfile | null;
};

export function buildOnboardingProfileStateDelta(data: ProfileBuilderData, context: OnboardingAdkContext): Record<string, unknown> {
  return {
    onboarding_profile_data: {
      educations: data.educations,
      experiences: data.experiences,
      projects: data.projects,
      skills: data.skills,
      experience_skipped: data.experienceSkipped,
      projects_skipped: data.projectsSkipped,
    },
    preferred_name: context.preferredName.trim(),
    personalization_context: context.personalization ?? {},
  };
}

type RawOnboardingProfile = {
  educations?: ProfileBuilderData["educations"];
  experiences?: ProfileBuilderData["experiences"];
  projects?: ProfileBuilderData["projects"];
  skills?: ProfileBuilderData["skills"];
  experience_skipped?: boolean;
  projects_skipped?: boolean;
};

export function applyOnboardingProfileFromAdkState(state: Record<string, unknown> | null | undefined): Partial<ProfileBuilderData> | null {
  if (!state || typeof state !== "object") return null;
  const raw = state.onboarding_profile_data;
  if (!raw || typeof raw !== "object") return null;
  const profile = raw as RawOnboardingProfile;
  return {
    educations: Array.isArray(profile.educations) ? profile.educations : [],
    experiences: Array.isArray(profile.experiences) ? profile.experiences : [],
    projects: Array.isArray(profile.projects) ? profile.projects : [],
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    experienceSkipped: Boolean(profile.experience_skipped),
    projectsSkipped: Boolean(profile.projects_skipped),
  };
}
