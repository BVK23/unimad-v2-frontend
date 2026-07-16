import type { LucideIcon } from "lucide-react";
import { Crosshair, ListChecks, Sparkles } from "lucide-react";

export type VpdFullImprovePreset = {
  id: string;
  label: string;
  icon: LucideIcon;
  instruction: string;
};

/**
 * Shown in main Unibot chat when improving a VPD from Prepare Application
 * (no ADK VPD sub-thread yet — same pattern as resume full-improve).
 */
export const VPD_FULL_IMPROVE_PRESETS: VpdFullImprovePreset[] = [
  {
    id: "align-to-jd",
    label: "Align to JD",
    icon: Sparkles,
    instruction:
      "Help me improve my Value Proposition Document for this job application. Use the role, company, and job description from the prepare-application context in session. Suggest concrete edits to the VPD structure and copy so it clearly maps my experience to the JD — keep it outcome-focused and specific. Do not create a new VPD; advise edits to the one open in Studio.",
  },
  {
    id: "sharpen-story",
    label: "Sharpen story",
    icon: Crosshair,
    instruction:
      "Review the Value Proposition Document open in Studio for this application. Suggest a clearer narrative arc: problem, approach, impact, and why I am a fit for this role/company. Call out weak or generic sections and propose stronger wording.",
  },
  {
    id: "stronger-proof",
    label: "Stronger proof",
    icon: ListChecks,
    instruction:
      "Help me strengthen proof points in my Value Proposition Document. Suggest metrics, outcomes, and role-relevant evidence to add or tighten. Tie recommendations to the job description in the prepare-application context.",
  },
];

export const VPD_OPEN_FULL_IMPROVE_EVENT = "vpd-open-full-improve";

export type VpdOpenFullImproveDetail = {
  vpdId: string;
  role?: string;
  company?: string;
  /** Set when opened from Prepare Application → Edit VPD. */
  fromPrepareApplication?: boolean;
};
