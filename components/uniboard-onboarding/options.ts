export type OnboardingOption = {
  id: string;
  label: string;
  description?: string;
};

export const EXPLORER_GOAL_IDS = new Set(["just_exploring", "just_stalking"]);

/** "What brings you to Unimad?" — multi-select, max 3. */
export const GOAL_OPTIONS: OnboardingOption[] = [
  { id: "full_time_job", label: "Land a full-time job", description: "I'm actively job hunting" },
  { id: "build_a_portfolio", label: "Build my portfolio", description: "Show my work beautifully" },
  { id: "personal_branding", label: "Grow on LinkedIn", description: "Build my personal brand" },
  { id: "switch_careers", label: "Switch careers", description: "Move into a new field" },
  { id: "just_exploring", label: "Just exploring", description: "Seeing what's possible" },
  { id: "just_stalking", label: "Just having a look", description: "Curious what this is" },
];

export const FOCUS_OPTIONS: OnboardingOption[] = [
  { id: "interviews", label: "Get more interviews", description: "Turn applications into callbacks" },
  { id: "stand_out", label: "Stand out online", description: "Be the candidate people remember" },
  { id: "apply_confidently", label: "Apply with confidence", description: "Know my materials are strong" },
  { id: "find_direction", label: "Find my direction", description: "Figure out what fits me" },
  { id: "build_connections", label: "Build connections", description: "Grow a network that matters" },
];

export const STAGE_OPTIONS: OnboardingOption[] = [
  { id: "student", label: "Student", description: "Still studying" },
  { id: "recent_grad", label: "Recent graduate", description: "Just stepped out" },
  { id: "early_career", label: "Early career", description: "1–3 years of experience" },
  { id: "experienced", label: "Experienced", description: "3+ years in the game" },
];

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
