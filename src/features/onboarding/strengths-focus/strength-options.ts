import type { OnboardingOption } from "@/components/uniboard-onboarding/options";
import { STRENGTH_OPTIONS } from "@/components/uniboard-onboarding/options";
import type { PersonalizedStrengthOption } from "@/lib/actions/onboardingActions";

const CANONICAL_BY_ID = new Map(STRENGTH_OPTIONS.map(o => [o.id, o]));

/** Keep LLM output on canonical voice/personality strengths — never technical topic tiles. */
export function normalizePersonalizedStrengthOptions(raw: PersonalizedStrengthOption[]): OnboardingOption[] {
  const seen = new Set<string>();
  const result: OnboardingOption[] = [];

  for (const item of raw) {
    const id = item.id?.trim().toLowerCase().replace(/\s+/g, "_");
    if (!id || !CANONICAL_BY_ID.has(id) || seen.has(id)) continue;
    seen.add(id);
    const base = CANONICAL_BY_ID.get(id)!;
    result.push(base);
  }

  for (const opt of STRENGTH_OPTIONS) {
    if (result.length >= 9) break;
    if (!seen.has(opt.id)) {
      seen.add(opt.id);
      result.push(opt);
    }
  }

  return result.slice(0, 9);
}
