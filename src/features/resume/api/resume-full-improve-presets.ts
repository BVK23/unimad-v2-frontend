import type { LucideIcon } from "lucide-react";
import { Crosshair, ListChecks, Sparkles } from "lucide-react";

export type ResumeFullImprovePreset = {
  id: string;
  label: string;
  icon: LucideIcon;
  instruction: string;
};

/** Shown in main Unibot chat when improving a resume (no sub-thread — section is ambiguous). */
export const RESUME_FULL_IMPROVE_PRESETS: ResumeFullImprovePreset[] = [
  {
    id: "optimise-for-jd",
    label: "Optimise for JD",
    icon: Sparkles,
    instruction:
      "Optimise my current resume to match the job description in session. Call read_resolved_job_listing_for_resume first. Add relevant JD keywords into summary, experience bullets, and skills without keyword stuffing. Rewrite bullets to be outcome-based and ATS-friendly. Delegate to specialist agents section by section — do not create a new resume row.",
  },
  {
    id: "tailor-to-role",
    label: "Tailor to role",
    icon: Crosshair,
    instruction:
      "Tailor my resume for this job application. Call read_resolved_job_listing_for_resume first. If application_id is in session, call generate_resume_for_job_description with application_id, role, and company. Otherwise use the job description from session. Do not ask me to paste the JD if it is already in session.",
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
