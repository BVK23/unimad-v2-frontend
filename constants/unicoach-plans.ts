export type UnicoachProductPlanId = "unicoach_program" | "unicoach_call_2" | "unicoach_call_3" | "unicoach_call_4";

export type UnicoachPlanConfig = {
  planId: UnicoachProductPlanId;
  label: string;
  priceGbp: number;
  description: string;
  tagline: string;
  allowsCoupon: boolean;
};

export const UNICOACH_PLANS: Record<UnicoachProductPlanId, UnicoachPlanConfig> = {
  unicoach_program: {
    planId: "unicoach_program",
    label: "Full System",
    priceGbp: 199,
    description: "Unicoach Full System",
    tagline: "All 4 modules · 1-on-1 mentorship · lifetime community access",
    allowsCoupon: true,
  },
  unicoach_call_2: {
    planId: "unicoach_call_2",
    label: "LinkedIn Branding",
    priceGbp: 77,
    description: "Unicoach — LinkedIn Branding",
    tagline: "DP, headline, content engine, recruiter outbound",
    allowsCoupon: false,
  },
  unicoach_call_3: {
    planId: "unicoach_call_3",
    label: "Application Strategy",
    priceGbp: 85,
    description: "Unicoach — Application Strategy",
    tagline: "Daily application system, referrals, cold emails",
    allowsCoupon: false,
  },
  unicoach_call_4: {
    planId: "unicoach_call_4",
    label: "Interview Mastery",
    priceGbp: 99,
    description: "Unicoach — Interview Mastery",
    tagline: "STAR prep, VPD, sponsorship negotiation",
    allowsCoupon: false,
  },
};

export const UNICOACH_FULL_PROGRAM_PRICE = UNICOACH_PLANS.unicoach_program.priceGbp;

export function getUnicoachPlan(planId: UnicoachProductPlanId): UnicoachPlanConfig {
  return UNICOACH_PLANS[planId] ?? UNICOACH_PLANS.unicoach_program;
}

/** Map masterclass pricing card titles to Razorpay plan ids. */
export const PRICING_CARD_PLAN_BY_TITLE: Record<string, UnicoachProductPlanId | "discovery"> = {
  Discovery: "discovery",
  "LinkedIn Branding": "unicoach_call_2",
  "Application Strategy": "unicoach_call_3",
  "Interview Mastery": "unicoach_call_4",
  "Full System": "unicoach_program",
};
