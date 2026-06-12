export type PrepareAssetGenerationKind = "resume" | "cover-letter" | "cold-email" | "vpd" | "ensuring-app";

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
