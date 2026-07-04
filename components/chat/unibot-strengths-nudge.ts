import { UNIBOT_STRENGTHS_NUDGE_DISMISS_KEY } from "@/components/chat/UnibotStrengthsPromptCard";
import type { FeatureGates } from "@/features/onboarding/featureGates";
import type { ChatMessage } from "@/types";

export function shouldShowUnibotStrengthsNudge(featureGates: FeatureGates): boolean {
  if (!featureGates.strengths_recommended) return false;
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(UNIBOT_STRENGTHS_NUDGE_DISMISS_KEY) !== "1";
}

export function createStrengthsNudgeMessage(newId: (prefix: string) => string): ChatMessage {
  return {
    id: newId("strengths-nudge"),
    role: "model",
    text: "",
    timestamp: new Date(),
    excludeFromTitleGeneration: true,
    unibotOnboardingPrompt: "strengths",
  };
}
