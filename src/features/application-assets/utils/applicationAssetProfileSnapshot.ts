import type { ProfileData } from "@/features/user-profile/types";

/** Compact profile for ADK studio_headless session (matches Django Unibot fields). */
export type ApplicationAssetProfileSnapshot = {
  preferred_name: string;
  skills: string[];
  experiences: ProfileData["experiences"];
  projects: ProfileData["projects"];
  educations: ProfileData["educations"];
};

const MAX_EXPERIENCES = 8;
const MAX_PROJECTS = 6;
const MAX_EDUCATIONS = 4;
const MAX_SKILLS = 40;

export const buildApplicationAssetProfileSnapshot = (profile: ProfileData): ApplicationAssetProfileSnapshot => {
  const onboarding = profile.onboarding_data;
  const preferredName = profile.name?.trim() || onboarding?.preferred_name?.trim() || onboarding?.first_name?.trim() || "";

  const skills = (profile.skills ?? []).filter(Boolean).slice(0, MAX_SKILLS);
  const experiences = (profile.experiences ?? []).slice(0, MAX_EXPERIENCES);
  const projects = (profile.projects ?? []).slice(0, MAX_PROJECTS);
  const educations = (profile.educations ?? []).slice(0, MAX_EDUCATIONS);

  return {
    preferred_name: preferredName,
    skills,
    experiences,
    projects,
    educations,
  };
};

export const isApplicationAssetProfileSnapshotEmpty = (snapshot: ApplicationAssetProfileSnapshot): boolean =>
  !snapshot.preferred_name &&
  snapshot.skills.length === 0 &&
  (snapshot.experiences?.length ?? 0) === 0 &&
  (snapshot.projects?.length ?? 0) === 0 &&
  (snapshot.educations?.length ?? 0) === 0;
