import type { FeatureGates } from "@/features/onboarding/featureGates";

/** Dev-only: /uniboard/resume?testStrengths=1 previews the in-chat strengths focus mode. */
export function isStrengthsNudgeDevPreview(searchParams: URLSearchParams | null): boolean {
  return process.env.NODE_ENV === "development" && searchParams?.get("testStrengths") === "1";
}

export function shouldShowUnibotStrengthsNudge(_featureGates: FeatureGates, _options?: { devPreview?: boolean }): boolean {
  // TODO(product): Re-enable when strengths / problems / praise personalisation is wired into agents.
  // Previously: gated on featureGates.strengths_recommended + session dismiss key.
  return false;
}
