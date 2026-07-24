export type ResumeGenerationMessageVariant = "jd" | "upload" | "bootstrap";

/** Worst-case loop: aligning → finishing → final bits → polish (never restart from step 1). */
export const RESUME_GENERATION_TAIL_COUNT = 4;

const RESUME_MIDDLE_STEPS = [
  "Reviewing your profile and experience…",
  "Going through your education and skills sections…",
  "Checking your projects section…",
  "Crafting a summary for you…",
  "Tweaking value-based points…",
  "Making fine adjustments…",
] as const;

const RESUME_TAIL_STEPS = ["Putting on the finishing touches…", "Final bits of work…", "Polishing your resume…"] as const;

export const RESUME_GENERATION_MESSAGES: Record<ResumeGenerationMessageVariant, readonly string[]> = {
  // New bootstrap path from onboarding nudge; keep style aligned with our middle/tail copy.
  bootstrap: ["Reading your onboarding profile…", ...RESUME_MIDDLE_STEPS, "Building your base resume…", ...RESUME_TAIL_STEPS],
  jd: ["Reading your job description…", ...RESUME_MIDDLE_STEPS, "Aligning with your job description…", ...RESUME_TAIL_STEPS],
  upload: ["Reading your uploaded resume…", ...RESUME_MIDDLE_STEPS, "Aligning with your resume…", ...RESUME_TAIL_STEPS],
};

export const RESUME_GENERATION_MESSAGE_INTERVAL_MS = 1500;
