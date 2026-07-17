import { getPrepareAssetGenerationMessageIndex } from "@/lib/jobs/prepare-asset-generation-messages";

export type PortfolioGenerationMessageMode = "generate" | "regenerate";

/** Worst-case loop: fine adjustments → finishing → final bits → polish. */
export const PORTFOLIO_GENERATION_TAIL_COUNT = 4;

export const PORTFOLIO_GENERATION_MESSAGE_INTERVAL_MS = 1500;

const PORTFOLIO_TAIL_STEPS = [
  "Making fine adjustments…",
  "Putting on the finishing touches…",
  "Final bits of work…",
  "Polishing your portfolio…",
] as const;

export const PORTFOLIO_GENERATION_MESSAGES: Record<PortfolioGenerationMessageMode, readonly string[]> = {
  generate: [
    "Reading your profile and onboarding details…",
    "Shaping your unique value proposition…",
    "Crafting your quick summary…",
    "Building your domain and role fit…",
    "Highlighting experience and projects…",
    "Shaping your elevator pitch…",
    "Laying out portfolio sections…",
    ...PORTFOLIO_TAIL_STEPS,
  ],
  regenerate: [
    "Reading your profile and onboarding details…",
    "Shaping your unique value proposition…",
    "Crafting your quick summary…",
    "Building your domain and role fit…",
    "Refreshing experience and project sections…",
    "Shaping your elevator pitch…",
    "Laying out portfolio sections…",
    ...PORTFOLIO_TAIL_STEPS,
  ],
};

export function getPortfolioGenerationMessageIndex(messageCount: number, step: number): number {
  return getPrepareAssetGenerationMessageIndex(messageCount, step, PORTFOLIO_GENERATION_TAIL_COUNT);
}
