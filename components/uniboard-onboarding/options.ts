export type OnboardingOption = {
  id: string;
  label: string;
  description?: string;
};

export const EXPLORER_GOAL_IDS = new Set(["just_exploring", "just_stalking"]);

/**
 * "What brings you to Unimad?" — the intent question (why they are here), multi-select, max 3.
 * 8 distinct reasons so we can actually segment users instead of lumping variations together.
 * IDs are kept stable with the previous set where possible so the backend `goal` column
 * (goals[0]) and explorer detection keep working with no migration.
 */
export const GOAL_OPTIONS: OnboardingOption[] = [
  { id: "full_time_job", label: "Land a full-time job", description: "I'm actively job hunting" },
  { id: "build_a_portfolio", label: "Build my portfolio", description: "Showcase my work beautifully" },
  { id: "personal_branding", label: "Grow my personal brand on LinkedIn", description: "Build my brand and stand out" },
  { id: "switch_careers", label: "Switch careers or change fields", description: "Move into a new kind of role" },
  { id: "interview_vpd", label: "Ace my interviews", description: "Prepare and stand out in the process" },
  { id: "apply_confidently", label: "Stand out in applications", description: "Apply with confidence" },
  { id: "find_direction", label: "Find my direction", description: "Figure out what fits me" },
  { id: "just_exploring", label: "Just exploring", description: "Curious what's possible here" },
];

/**
 * "Where are you in your journey?" — the identity question (who they are), single-select.
 * Kept broad on purpose so we can serve beyond the core ICP (international master's students):
 * bachelors, local students, professionals, and career switchers.
 */
export const STAGE_OPTIONS: OnboardingOption[] = [
  { id: "undergrad", label: "Undergraduate student", description: "Doing my Bachelor's" },
  { id: "postgrad", label: "Master's or PhD student", description: "Doing my postgraduate studies" },
  { id: "recent_grad", label: "Recent graduate", description: "Just finished studying" },
  { id: "early_career", label: "Early career", description: "1 to 3 years of experience" },
  { id: "experienced", label: "Experienced professional", description: "3+ years in the game" },
  { id: "career_switcher", label: "Career switcher", description: "Moving into a new field" },
];

// TODO(product): Re-enable strengths / problems / praise when voice personalisation is wired into agents.
export const STRENGTH_OPTIONS: OnboardingOption[] = [
  { id: "talking", label: "Talking to people" },
  { id: "writing", label: "Writing & storytelling" },
  { id: "data", label: "Analyzing data" },
  { id: "building", label: "Building products" },
  { id: "organizing", label: "Organizing & planning" },
  { id: "design", label: "Design & visuals" },
  { id: "research", label: "Research" },
  { id: "problem_solving", label: "Problem-solving" },
  { id: "teaching", label: "Teaching & mentoring" },
];

export const PROBLEM_OPTIONS: OnboardingOption[] = [
  { id: "technical", label: "Technical challenges" },
  { id: "people", label: "People & team problems" },
  { id: "creative", label: "Creative storytelling" },
  { id: "strategy", label: "Business strategy" },
  { id: "customer", label: "Customer pain points" },
  { id: "process", label: "Process inefficiencies" },
  { id: "learning", label: "Learning new skills" },
];

export const PRAISE_OPTIONS: OnboardingOption[] = [
  { id: "communication", label: "Communication" },
  { id: "leadership", label: "Leadership" },
  { id: "detail", label: "Attention to detail" },
  { id: "creativity", label: "Creativity" },
  { id: "technical_depth", label: "Technical depth" },
  { id: "reliability", label: "Reliability" },
  { id: "strategic", label: "Strategic thinking" },
  { id: "empathy", label: "Empathy" },
];
