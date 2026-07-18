import { ONBOARDING_ROUTE } from "./resolveOnboardingEntryStep";

export type { OnboardingEntryStep } from "./resolveOnboardingEntryStep";
export { ONBOARDING_ROUTE, hasPreferredName, hasResumeProfileProgress, resolveOnboardingEntryStep } from "./resolveOnboardingEntryStep";

export type FeatureGates = {
  initial_onboarding_complete: boolean;
  profile_setup_complete: boolean;
  niche_complete: boolean;
  strengths_complete: boolean;
  resume_jd_create: boolean;
  resume_auto_bootstrap: boolean;
  portfolio_auto_create: boolean;
  studio_topic_picker: boolean;
  studio_post_draft: boolean;
  linkedin_analyze: boolean;
  linkedin_section_improve: boolean;
  application_assets_draft: boolean;
  strengths_recommended: boolean;
  niche_refine_available: boolean;
  jobs_prepare_application: boolean;
  jobs_recommended_roles: boolean;
};

export const DEFAULT_FEATURE_GATES: FeatureGates = {
  initial_onboarding_complete: false,
  profile_setup_complete: false,
  niche_complete: false,
  strengths_complete: false,
  resume_jd_create: false,
  resume_auto_bootstrap: false,
  portfolio_auto_create: false,
  studio_topic_picker: true,
  studio_post_draft: false,
  linkedin_analyze: true,
  linkedin_section_improve: false,
  application_assets_draft: false,
  strengths_recommended: false,
  niche_refine_available: false,
  jobs_prepare_application: false,
  jobs_recommended_roles: false,
};

export function parseFeatureGates(raw: unknown): FeatureGates {
  if (!raw || typeof raw !== "object") return DEFAULT_FEATURE_GATES;
  const g = raw as Record<string, unknown>;
  return {
    initial_onboarding_complete: Boolean(g.initial_onboarding_complete),
    profile_setup_complete: Boolean(g.profile_setup_complete),
    niche_complete: Boolean(g.niche_complete),
    strengths_complete: Boolean(g.strengths_complete),
    resume_jd_create: Boolean(g.resume_jd_create),
    resume_auto_bootstrap: Boolean(g.resume_auto_bootstrap),
    portfolio_auto_create: Boolean(g.portfolio_auto_create),
    studio_topic_picker: g.studio_topic_picker !== false,
    studio_post_draft: Boolean(g.studio_post_draft),
    linkedin_analyze: g.linkedin_analyze !== false,
    linkedin_section_improve: Boolean(g.linkedin_section_improve),
    application_assets_draft: Boolean(g.application_assets_draft),
    strengths_recommended: Boolean(g.strengths_recommended),
    niche_refine_available: Boolean(g.niche_refine_available),
    jobs_prepare_application: Boolean(g.jobs_prepare_application),
    jobs_recommended_roles: Boolean(g.jobs_recommended_roles),
  };
}

export type OnboardingPromptKind = "niche" | "strengths" | "profile_setup";

export const ONBOARDING_PROMPT_COPY: Record<OnboardingPromptKind, { title: string; body: string; cta: string }> = {
  niche: {
    title: "Refine your target role",
    body: "Answer a few questions so we can suggest a niche that fits you better.",
    cta: "Refine niche",
  },
  strengths: {
    title: "Add your strengths",
    body: "What comes naturally to you? This shapes your voice across LinkedIn, comments, applications, and content.",
    cta: "Save strengths",
  },
  profile_setup: {
    title: "Finish profile setup",
    body: "Add your resume details and pick a niche role to unlock personalised features across Unimad.",
    cta: "Go to onboarding",
  },
};

/** All onboarding CTAs land on the route; the flow picks the correct step from gates + profile. */
export function onboardingHref(_kind?: OnboardingPromptKind): string {
  return ONBOARDING_ROUTE;
}

/** Soft “finish onboarding” CTA — field-based, not timestamp-based. */
export function needsProfileSetup(gates: Pick<FeatureGates, "profile_setup_complete" | "niche_complete">): boolean {
  return !gates.profile_setup_complete || !gates.niche_complete;
}
