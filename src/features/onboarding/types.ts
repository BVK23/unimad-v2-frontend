export type PersonalizationProfile = {
  goals?: string[];
  focus?: string[];
  stage?: string[];
  personalize_opt_in?: boolean | null;
  strengths?: string[];
  problems?: string[];
  praise?: string[];
  resume_uploaded?: boolean;
  tier?: number;
  updated_at?: string;
};

export type OnboardingEducation = {
  institution: string;
  course: string;
  startDate: string;
  endDate: string;
  courseWork: string;
};

export type OnboardingExperience = {
  organisation: string;
  role: string;
  startDate: string;
  endDate: string;
  descriptions: string[];
};

export type OnboardingProject = {
  name: string;
  link?: string;
  descriptions: string[];
};

export type OnboardingDataState = {
  name: string;
  educations: OnboardingEducation[];
  experiences: OnboardingExperience[];
  projects: OnboardingProject[];
  skills: string[];
  role: string[];
  phoneNumber: string;
  linkedinUrl: string;
  goal: string[];
};

export type OnboardingStepName =
  | "welcome"
  | "name"
  | "resume"
  | "educations"
  | "experiences"
  | "projects"
  | "skills"
  | "role"
  | "whatsapp"
  | "linkedin"
  | "goal";

export type OnboardingStep = {
  name: OnboardingStepName;
  completed: boolean;
  required: boolean;
};
