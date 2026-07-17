import { RESUME_GENERATION_MESSAGES, RESUME_GENERATION_TAIL_COUNT } from "@/features/resume/constants/resumeGenerationMessages";

export type PrepareAssetGenerationKind = "resume" | "cover-letter" | "cold-email" | "vpd" | "ensuring-app";

/** Default tail loop length when a kind is not listed in {@link PREPARE_ASSET_GENERATION_TAIL_BY_KIND}. */
export const PREPARE_ASSET_GENERATION_TAIL_COUNT = 4;

export const PREPARE_ASSET_GENERATION_TAIL_BY_KIND: Partial<Record<PrepareAssetGenerationKind, number>> = {
  resume: RESUME_GENERATION_TAIL_COUNT,
  "cover-letter": 4,
  "cold-email": 4,
  vpd: 4,
  "ensuring-app": 2,
};

/**
 * Map a monotonic step counter to a message index: play all messages in order once,
 * then loop only the last `tailCount` lines (polish / almost-done copy).
 */
export function getPrepareAssetGenerationMessageIndex(
  messageCount: number,
  step: number,
  tailCount: number = PREPARE_ASSET_GENERATION_TAIL_COUNT
): number {
  if (messageCount <= 0) return 0;
  if (messageCount === 1) return 0;

  const lastIndex = messageCount - 1;
  if (step <= lastIndex) return step;

  const tailStart = Math.max(0, messageCount - tailCount);
  const tailLength = lastIndex - tailStart + 1;
  const overflow = step - lastIndex;
  return tailStart + ((overflow - 1) % tailLength);
}

export function getPrepareAssetGenerationTailCount(kind: PrepareAssetGenerationKind): number {
  return PREPARE_ASSET_GENERATION_TAIL_BY_KIND[kind] ?? PREPARE_ASSET_GENERATION_TAIL_COUNT;
}

export const PREPARE_ASSET_GENERATION_MESSAGES: Record<PrepareAssetGenerationKind, readonly string[]> = {
  resume: RESUME_GENERATION_MESSAGES.jd,
  "cover-letter": [
    "Reading your job description…",
    "Reviewing your profile and experience…",
    "Drafting your cover letter…",
    "Shaping your opening and key points…",
    "Adding value-based points…",
    "Making fine adjustments…",
    "Final bits of work…",
    "Putting on the finishing touches…",
    "Polishing it to the best version…",
  ],
  "cold-email": [
    "Reading your job description…",
    "Reviewing your profile and experience…",
    "Crafting your cold email…",
    "Personalizing your hook and ask…",
    "Adding value-based points…",
    "Making fine adjustments…",
    "Putting on the finishing touches…",
    "Final bits of work…",
    "Polishing it to the best version…",
  ],
  vpd: [
    "Reading your job description…",
    "Analyzing company fit…",
    "Building your value proposition…",
    "Crafting your first 30-60-90 day plan…",
    "Writing your culture fit section…",
    "Adding more to elevate your VPD…",
    "Making fine adjustments…",
    "Putting on the finishing touches…",
    "Final bits of work…",
    "Polishing your VPD…",
  ],
  "ensuring-app": ["Saving this job to your tracker…", "Linking role and company details…", "Almost ready…"],
};

export function prepareAssetGenerationTitle(kind: PrepareAssetGenerationKind): string {
  switch (kind) {
    case "resume":
      return "Generating your resume";
    case "cover-letter":
      return "Generating your cover letter";
    case "cold-email":
      return "Generating your cold email";
    case "vpd":
      return "Generating your value proposition";
    case "ensuring-app":
      return "Preparing your application";
  }
}
