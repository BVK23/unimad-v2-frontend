/** Short copy for gated controls (hover tooltips / gate popovers). */
export const FINISH_ONBOARDING_CTA = "Finish onboarding";

export const ONBOARDING_GATE_MESSAGES = {
  resume_jd: "Your education, experience, and shortlisted niche are required to generate a tailored resume for a role.",
  prepare_application: "Finish onboarding to generate application assets.",
  cover_letter: "Complete your profile and finalize your discovered niche so Unibot can personalise cover letters for you.",
  cold_email: "Complete your profile and finalize your discovered niche so Unibot can personalise cold emails for you.",
  referral: "Complete your profile and finalize your discovered niche so Unibot can personalise referral requests for you.",
  linkedin_post: "Finish onboarding to generate more posts, improve, and publish.",
  linkedin_improve: "Finish onboarding to improve LinkedIn sections with your niche and profile.",
  linkedin_publish: "Finish onboarding to post and schedule LinkedIn content from Unimad.",
  interview_prep: "Finish onboarding so interview prep can use your background and job description.",
  portfolio:
    "Complete your onboarding and discover and finalize your niche, so Unibot can help you create a portfolio draft personalized for you.",
  prepare_resume: "Complete your profile and finalize your discovered niche so Unibot can tailor a resume for this role.",
} as const;

export type OnboardingGateMessageKey = keyof typeof ONBOARDING_GATE_MESSAGES;

export function getPrepareApplicationGateMessageKey(tab: "resume" | "cover-letter" | "cold-email" | "vpd"): OnboardingGateMessageKey {
  switch (tab) {
    case "resume":
      return "prepare_resume";
    case "cover-letter":
      return "cover_letter";
    case "cold-email":
      return "cold_email";
    case "vpd":
      return "prepare_application";
  }
}

/** @deprecated use ONBOARDING_GATE_MESSAGES */
export const FINISH_ONBOARDING_UNLOCK_TOOLTIP = ONBOARDING_GATE_MESSAGES.resume_jd;
/** @deprecated use ONBOARDING_GATE_MESSAGES */
export const FINISH_ONBOARDING_PREPARE_TOOLTIP = ONBOARDING_GATE_MESSAGES.prepare_application;
/** @deprecated use ONBOARDING_GATE_MESSAGES */
export const FINISH_ONBOARDING_GENERATE_TOOLTIP = ONBOARDING_GATE_MESSAGES.cover_letter;
/** @deprecated use ONBOARDING_GATE_MESSAGES */
export const FINISH_ONBOARDING_LINKEDIN_MORE_TOOLTIP = ONBOARDING_GATE_MESSAGES.linkedin_post;
/** @deprecated use ONBOARDING_GATE_MESSAGES */
export const FINISH_ONBOARDING_LINKEDIN_IMPROVE_TOOLTIP = ONBOARDING_GATE_MESSAGES.linkedin_improve;
