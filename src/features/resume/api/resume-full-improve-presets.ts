import type { LucideIcon } from "lucide-react";
import { Crosshair, ListChecks } from "lucide-react";

export type ResumeFullImprovePreset = {
  id: string;
  label: string;
  icon: LucideIcon;
  instruction: string;
};

/** Shown in main Unibot chat when improving a resume (no sub-thread — section is ambiguous). */
export const RESUME_FULL_IMPROVE_PRESETS: ResumeFullImprovePreset[] = [
  {
    id: "tailor-to-role",
    label: "Tailor to role",
    icon: Crosshair,
    instruction:
      "Review my resume for this job application and strengthen how my experience aligns with the target role. Use resume tools to read context, then update the most relevant sections.",
  },
  {
    id: "stronger-bullets",
    label: "Stronger bullets",
    icon: ListChecks,
    instruction:
      "Improve my experience and project bullet points with clearer impact, stronger verbs, and metrics where possible. Use resume tools to read context before editing.",
  },
];

export const RESUME_OPEN_FULL_IMPROVE_EVENT = "resume-open-full-improve";

export type ResumeOpenFullImproveDetail = {
  resumeId: string;
  role?: string;
  company?: string;
  /** Set when opened from Prepare Application → Edit Resume (not the section wand). */
  fromPrepareApplication?: boolean;
};
