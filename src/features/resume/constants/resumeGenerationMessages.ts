export type ResumeGenerationMessageVariant = "jd" | "upload";

export const RESUME_GENERATION_MESSAGES: Record<ResumeGenerationMessageVariant, string[]> = {
  jd: [
    "Okay I'm analysing your job description.",
    "Matching your profile and JD.",
    "Now optimising your experiences",
    "Done with experiences",
    "Now optimising your projects",
    "Done with projects",
    "Working on your skills",
    "Fine-tuning your resume now",
    "Adding final touches",
    "Sit tight! It's almost done",
  ],
  upload: [
    "Okay I'm analysing your uploaded resume",
    "Extracting and processing your data",
    "Now optimising your experiences",
    "Done with experiences",
    "Now optimising your projects",
    "Done with projects",
    "Working on your skills",
    "Fine-tuning your resume now",
    "Adding final touches",
    "Sit tight! It's almost done",
  ],
};

/** Slightly faster than v1 (~2s per message via dot cycles). */
export const RESUME_GENERATION_MESSAGE_INTERVAL_MS = 1800;
