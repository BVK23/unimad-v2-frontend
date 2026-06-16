import type { OnboardingSavedProfile } from "@/lib/actions/onboardingActions";

export type OnboardingProfileSummary = {
  hasEducation: boolean;
  hasExperience: boolean;
  hasProjects: boolean;
  hasSkills: boolean;
  educationCount: number;
  experienceCount: number;
  projectCount: number;
  skillCount: number;
};

export function buildOnboardingProfileSummary(profile: OnboardingSavedProfile): OnboardingProfileSummary {
  return {
    hasEducation: profile.educations.length > 0,
    hasExperience: profile.experiences.length > 0,
    hasProjects: profile.projects.length > 0,
    hasSkills: profile.skills.length >= 3,
    educationCount: profile.educations.length,
    experienceCount: profile.experiences.length,
    projectCount: profile.projects.length,
    skillCount: profile.skills.length,
  };
}
