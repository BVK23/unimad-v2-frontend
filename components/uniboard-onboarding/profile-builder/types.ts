import type { OnboardingEducation, OnboardingExperience, OnboardingProject } from "@/features/onboarding/types";

export type ProfileSection = "education" | "experience" | "projects" | "skills";

export type ProfileBuilderData = {
  educations: OnboardingEducation[];
  experiences: OnboardingExperience[];
  projects: OnboardingProject[];
  skills: string[];
  experienceSkipped: boolean;
  projectsSkipped: boolean;
};

export type ChatMessageRole = "assistant" | "user" | "status";

export type ProfileChatMessage = {
  id: string;
  role: ChatMessageRole;
  text: string;
  section?: ProfileSection;
  timestamp: Date;
};

export type ChatEngineState = {
  section: ProfileSection;
  /** Sub-step within the current section conversation. */
  step: string;
  draftEducation: Partial<OnboardingEducation>;
  draftExperience: Partial<OnboardingExperience> & { descriptionsText?: string };
  draftProject: Partial<OnboardingProject> & { descriptionsText?: string };
};

export const EMPTY_PROFILE: ProfileBuilderData = {
  educations: [],
  experiences: [],
  projects: [],
  skills: [],
  experienceSkipped: false,
  projectsSkipped: false,
};
