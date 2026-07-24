/** Dev-only helpers for /uniboard/onboarding?test=1 */

export type OnboardingStepKey =
  | "welcome"
  | "name"
  | "phone"
  | "linkedin"
  | "goals"
  | "stage"
  | "personalize"
  | "resume"
  | "profile_builder"
  | "strengths"
  | "problems"
  | "praise"
  | "niche"
  | "done";

export type OnboardingTestAnswers = {
  name: string;
  phone: string;
  linkedin: string;
  goals: string[];
  focus: string[];
  stage: string[];
  personalize: boolean | null;
  resumeUploaded: boolean;
  strengths: string[];
  problems: string[];
  praise: string[];
};

export type OnboardingTestPreset = "blank" | "explorer" | "job_seeker" | "personalized" | "post_niche" | "existing_user";

export type OnboardingTestConfig = {
  enabled: true;
  skipSave: boolean;
  mockNiche: boolean;
  initialStep: OnboardingStepKey;
  preset: OnboardingTestPreset;
  answers: OnboardingTestAnswers;
};

export const ONBOARDING_STEP_ORDER: OnboardingStepKey[] = [
  "welcome",
  "name",
  "phone",
  "linkedin",
  "goals",
  "stage",
  "personalize",
  "resume",
  "profile_builder",
  "niche",
  "strengths",
  "problems",
  "praise",
  "done",
];

export const ONBOARDING_STEP_LABELS: Record<OnboardingStepKey, string> = {
  welcome: "Welcome",
  name: "Name",
  phone: "WhatsApp",
  linkedin: "LinkedIn",
  goals: "Goals",
  stage: "Stage",
  personalize: "Personalize opt-in",
  resume: "Resume upload",
  profile_builder: "Build with Unibot",
  niche: "Niche",
  strengths: "Strengths",
  problems: "Problems",
  praise: "Praise",
  done: "Done",
};

const EMPTY_ANSWERS: OnboardingTestAnswers = {
  name: "",
  phone: "",
  linkedin: "",
  goals: [],
  focus: [],
  stage: [],
  personalize: null,
  resumeUploaded: false,
  strengths: [],
  problems: [],
  praise: [],
};

export const TEST_MOCK_NICHE_ROLES = [
  {
    id: "role-0",
    title: "Product Marketing Manager",
    rationale: "Strong match for your writing skills and B2B SaaS background.",
    is_ideal: true,
  },
  {
    id: "role-1",
    title: "Growth Marketing Lead",
    rationale: "Demand is high for data-driven marketers in early-stage startups.",
    is_ideal: false,
  },
  {
    id: "role-2",
    title: "Content Strategist",
    rationale: "Your storytelling strength aligns with content-led growth teams.",
    is_ideal: false,
  },
  {
    id: "role-3",
    title: "Brand Manager",
    rationale: "Good fit if you want to own narrative and positioning end-to-end.",
    is_ideal: false,
  },
  {
    id: "role-4",
    title: "Marketing Operations Specialist",
    rationale: "Organizing and planning strengths map well to ops-heavy roles.",
    is_ideal: false,
  },
];

const PRESET_ANSWERS: Record<OnboardingTestPreset, OnboardingTestAnswers> = {
  blank: EMPTY_ANSWERS,
  explorer: {
    ...EMPTY_ANSWERS,
    name: "Sam",
    phone: "+919876543210",
    linkedin: "https://www.linkedin.com/in/sam-explorer",
    goals: ["just_exploring"],
    focus: [],
    stage: ["undergrad"],
  },
  job_seeker: {
    ...EMPTY_ANSWERS,
    name: "Alex",
    phone: "+919876543210",
    linkedin: "https://www.linkedin.com/in/alex-jobseeker",
    goals: ["full_time_job", "ace_interviews"],
    focus: [],
    stage: ["early_career"],
    personalize: true,
    resumeUploaded: true,
  },
  personalized: {
    ...EMPTY_ANSWERS,
    name: "Jordan",
    phone: "+919876543210",
    linkedin: "https://www.linkedin.com/in/jordan-full",
    goals: ["full_time_job", "personal_branding"],
    focus: [],
    stage: ["recent_grad"],
    personalize: true,
    resumeUploaded: true,
    strengths: ["writing", "data", "problem_solving"],
    problems: ["technical", "strategy"],
    praise: ["communication", "creativity"],
  },
  post_niche: {
    ...EMPTY_ANSWERS,
    name: "Taylor",
    phone: "+919876543210",
    linkedin: "https://www.linkedin.com/in/taylor-post-niche",
    goals: ["full_time_job", "ace_interviews"],
    focus: [],
    stage: ["early_career"],
    personalize: true,
    resumeUploaded: true,
  },
  existing_user: {
    ...EMPTY_ANSWERS,
    name: "Riley",
    phone: "+919876543210",
    linkedin: "https://www.linkedin.com/in/riley-existing",
    goals: [],
    focus: [],
    stage: [],
    personalize: null,
    resumeUploaded: true,
  },
};

const PRESET_DEFAULT_STEP: Record<OnboardingTestPreset, OnboardingStepKey> = {
  blank: "welcome",
  explorer: "goals",
  job_seeker: "resume",
  personalized: "strengths",
  post_niche: "strengths",
  existing_user: "goals",
};

/** Handy dev URLs — append to /uniboard/onboarding */
export const ONBOARDING_TEST_QUICK_LINKS: { label: string; query: string }[] = [
  { label: "Profile builder", query: "test=1&step=profile_builder&preset=job_seeker" },
  { label: "Niche (live API)", query: "test=1&step=niche&preset=post_niche&mockNiche=0" },
  { label: "Niche (mock)", query: "test=1&step=niche&preset=post_niche" },
  { label: "Strengths", query: "test=1&step=strengths&preset=post_niche" },
  { label: "Problems", query: "test=1&step=problems&preset=personalized" },
  { label: "Praise", query: "test=1&step=praise&preset=personalized" },
  { label: "All set", query: "test=1&step=done&preset=personalized" },
  { label: "Unibot strengths (onboarding)", query: "test=1&step=strengths&preset=post_niche" },
];

function isStepKey(value: string | null): value is OnboardingStepKey {
  return Boolean(value && ONBOARDING_STEP_ORDER.includes(value as OnboardingStepKey));
}

function isPreset(value: string | null): value is OnboardingTestPreset {
  return Boolean(value && value in PRESET_ANSWERS);
}

/**
 * Onboarding test panel (?test=1).
 * Disabled so it is not exposed outside internal testing.
 * TODO(dev): Re-enable for local QA by restoring the development + ?test=1 checks below.
 */
export function parseOnboardingTestConfig(_searchParams: URLSearchParams | null): OnboardingTestConfig | null {
  return null;
  // if (process.env.NODE_ENV !== "development") return null;
  // if (_searchParams?.get("test") !== "1") return null;
  //
  // const presetParam = _searchParams.get("preset");
  // const preset: OnboardingTestPreset = isPreset(presetParam) ? presetParam : "blank";
  // const stepParam = _searchParams.get("step");
  // const initialStep = isStepKey(stepParam) ? stepParam : PRESET_DEFAULT_STEP[preset];
  //
  // return {
  //   enabled: true,
  //   skipSave: _searchParams.get("save") !== "1",
  //   mockNiche: _searchParams.get("mockNiche") !== "0",
  //   initialStep,
  //   preset,
  //   answers: { ...PRESET_ANSWERS[preset] },
  // };
}

export function isOnboardingStepKey(value: string): value is OnboardingStepKey {
  return isStepKey(value);
}
