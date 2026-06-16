export type PrepareAssetGenerationKind = "resume" | "cover-letter" | "cold-email" | "vpd" | "ensuring-app";

/** How many ending messages cycle once the full sequence has played. */
export const PREPARE_ASSET_GENERATION_TAIL_COUNT = 3;

/**
 * Map a monotonic step counter to a message index: play all messages in order once,
 * then loop only the last {@link PREPARE_ASSET_GENERATION_TAIL_COUNT} lines (e.g. fine adjustments → finishing touches).
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

export const PREPARE_ASSET_GENERATION_MESSAGES: Record<PrepareAssetGenerationKind, readonly string[]> = {
  resume: [
    "Reading your job description…",
    "Reviewing your profile and experience…",
    "Drafting your tailored resume…",
    "Highlighting your strongest achievements…",
    "Making fine adjustments…",
    "Adding value-based points…",
    "Putting on the finishing touches…",
  ],
  "cover-letter": [
    "Reading your job description…",
    "Reviewing your profile and experience…",
    "Drafting your cover letter…",
    "Shaping your opening and key points…",
    "Making fine adjustments…",
    "Adding value-based points…",
    "Putting on the finishing touches…",
  ],
  "cold-email": [
    "Reading your job description…",
    "Reviewing your profile and experience…",
    "Crafting your cold email…",
    "Personalizing your hook and ask…",
    "Making fine adjustments…",
    "Adding value-based points…",
    "Putting on the finishing touches…",
  ],
  vpd: [
    "Reading your job description…",
    "Analyzing company fit…",
    "Building your value proposition…",
    "Making fine adjustments…",
    "Putting on the finishing touches…",
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
