import { UNIBOT_STRENGTHS_NUDGE_DISMISS_KEY } from "@/components/chat/UnibotStrengthsPromptCard";
import type { FeatureGates } from "@/features/onboarding/featureGates";

/** Dev-only: /uniboard/resume?testStrengths=1 previews the in-chat strengths focus mode. */
export function isStrengthsNudgeDevPreview(searchParams: URLSearchParams | null): boolean {
  return process.env.NODE_ENV === "development" && searchParams?.get("testStrengths") === "1";
}

export function shouldShowUnibotStrengthsNudge(featureGates: FeatureGates, options?: { devPreview?: boolean }): boolean {
  if (typeof window === "undefined") return false;
  if (options?.devPreview) {
    return sessionStorage.getItem(UNIBOT_STRENGTHS_NUDGE_DISMISS_KEY) !== "1";
  }
  if (!featureGates.strengths_recommended) return false;
  return sessionStorage.getItem(UNIBOT_STRENGTHS_NUDGE_DISMISS_KEY) !== "1";
}
