import type { UnibotResumeSection } from "@/components/chat/unibot-incoming-request";
import { RESUME_IMPROVE_PREFIX } from "@/features/adk-chat/handoff-prompts";

const ATS_IMPROVE_BODY_MARKER = "based on an ATS score report";

const ATS_SECTION_LABELS: Record<string, string> = {
  summary: "Summary",
  profile: "Summary",
  experience: "Experience",
  skills: "Skills",
  education: "Education",
  projects: "Projects",
  certifications: "Certifications",
  custom: "Custom",
};

export const isAtsImproveAgentMessage = (text: string): boolean => {
  const trimmed = text.trim();
  return trimmed.includes("You are improving the") && trimmed.includes(ATS_IMPROVE_BODY_MARKER);
};

/** Map stored ADK user turn (full ATS bootstrap) back to the short UI bubble after reload. */
export const resumeDisplayTextForAtsImproveAgentMessage = (text: string, sectionFallback?: string): string | null => {
  if (!isAtsImproveAgentMessage(text)) return null;
  const match = text.match(/You are improving the (.+?) section based on an ATS score report/i);
  const label = match?.[1]?.trim();
  if (label) return `ATS fix: Improve ${label}`;
  if (sectionFallback?.trim()) {
    const key = sectionFallback.trim().toLowerCase();
    return `ATS fix: Improve ${ATS_SECTION_LABELS[key] ?? sectionFallback}`;
  }
  return "ATS fix: Improve Resume";
};

export type ResumeImprovePromptInput = {
  section: UnibotResumeSection;
  /** Whether the editor field already has user-written content. */
  hasContent: boolean;
  entryId?: string;
};

const DISPLAY_WHEN_CONTENT: Record<UnibotResumeSection, string> = {
  summary: "Improve my professional summary",
  education: "Improve this education entry",
  experience: "Improve this experience entry",
  projects: "Improve my project description for this entry",
  certifications: "Improve this certification entry",
  skills: "Improve my skills section",
  custom: "Improve this custom section entry",
};

const DISPLAY_WHEN_EMPTY: Record<UnibotResumeSection, string> = {
  summary: "Craft a summary for my resume",
  education: "Add coursework for this education entry",
  experience: "Add experience bullet points for this entry",
  projects: "Add a project description for this entry",
  certifications: "Add a description for this certification entry",
  skills: "Add skills for this resume",
  custom: "Add content for this custom section entry",
};

/** User-facing improve prompts — same copy shown in chat and sent to the agent. */
const IMPROVE_PROMPT: Record<UnibotResumeSection, { withContent: string; empty: string }> = {
  summary: { withContent: "Improve my professional summary", empty: "Craft a summary for my resume" },
  education: { withContent: "Improve this education entry", empty: "Add coursework for this education entry" },
  experience: { withContent: "Improve this experience entry", empty: "Add experience bullet points for this entry" },
  projects: { withContent: "Improve this project description", empty: "Add a project description for this entry" },
  certifications: { withContent: "Improve this certification entry", empty: "Add a description for this certification entry" },
  skills: { withContent: "Improve my skills section", empty: "Add skills for this resume" },
  custom: { withContent: "Improve this custom section entry", empty: "Add content for this custom section entry" },
};

/** Legacy verbose agent bootstraps — map to friendly display after reload. */
const LEGACY_AGENT_BOOTSTRAPS = new Set([
  "Improve my professional summary. Use get_summary and read experiences, skills, education, and projects for context, then update_summary.",
  "Craft a professional summary for this resume. Read experiences, skills, education, and projects with tools, then update_summary.",
  "Craft a professional summary for this resume. Use get_summary and get_section for resume data; if sections are empty, call fetch_user_personal_details for onboarding profile. Explain what's missing if sparse, then update_summary or offer a placeholder template.",
  "Please review my professional summary on my resume and suggest concrete improvements. You can use my current resume context from the session.",
  "Please review my professional summary on my resume. Use get_summary and get_section for resume data; if sections are empty, call fetch_user_personal_details for onboarding profile. Explain what's missing if sparse and offer guidance or a placeholder template — do not report the section as unavailable.",
]);

function normalizeSection(section: string): UnibotResumeSection {
  const key = section.trim().toLowerCase() as UnibotResumeSection;
  return key in DISPLAY_WHEN_CONTENT ? key : "custom";
}

/** Short copy shown in the improve sub-thread bubble. */
export function buildResumeImproveDisplayMessage(input: ResumeImprovePromptInput): string {
  const section = normalizeSection(input.section);
  return input.hasContent ? DISPLAY_WHEN_CONTENT[section] : DISPLAY_WHEN_EMPTY[section];
}

/** Agent turn — natural language only; entry scope is in session `resume_improve_entry_id`. */
export function buildResumeImproveAgentMessage(input: ResumeImprovePromptInput): string {
  const section = normalizeSection(input.section);
  return input.hasContent ? IMPROVE_PROMPT[section].withContent : IMPROVE_PROMPT[section].empty;
}

const ALL_DISPLAY_MESSAGES = new Set([...Object.values(DISPLAY_WHEN_CONTENT), ...Object.values(DISPLAY_WHEN_EMPTY)]);

/** Map stored ADK user text to friendly UI (legacy verbose improves + agent bootstrap). */
export function resumeImproveUserDisplayText(sentText: string, section?: string, entryId?: string): string {
  const trimmed = sentText.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("ATS fix: Improve ")) return trimmed;
  const atsDisplay = resumeDisplayTextForAtsImproveAgentMessage(trimmed, section);
  if (atsDisplay) return atsDisplay;
  if (ALL_DISPLAY_MESSAGES.has(trimmed)) return trimmed;
  if (LEGACY_AGENT_BOOTSTRAPS.has(trimmed)) {
    const hasContent = trimmed.toLowerCase().includes("improve ") && !trimmed.toLowerCase().includes("craft ");
    return buildResumeImproveDisplayMessage({
      section: normalizeSection(section ?? "summary"),
      hasContent,
      entryId,
    });
  }
  if (trimmed.startsWith(RESUME_IMPROVE_PREFIX)) {
    const hasQuotedBody = /"[^"]{20,}"/.test(trimmed);
    return buildResumeImproveDisplayMessage({
      section: normalizeSection(section ?? "summary"),
      hasContent: hasQuotedBody,
      entryId,
    });
  }
  if (trimmed.includes('Focus on entry id "') || trimmed.includes("Session resume_improve_entry_id")) {
    const stripped = trimmed.replace(/\s*Focus on entry id "[^"]+"\.?\s*/i, "").trim();
    if (ALL_DISPLAY_MESSAGES.has(stripped)) return stripped;
    const hasContent =
      stripped.toLowerCase().includes("improve ") && !stripped.toLowerCase().includes("add ") && !stripped.toLowerCase().includes("craft ");
    return buildResumeImproveDisplayMessage({
      section: normalizeSection(section ?? "summary"),
      hasContent,
      entryId,
    });
  }
  return trimmed;
}

export function isResumeImproveHandoffPrompt(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith(RESUME_IMPROVE_PREFIX)) return true;
  if (resumeDisplayTextForAtsImproveAgentMessage(trimmed) != null) return true;
  if (LEGACY_AGENT_BOOTSTRAPS.has(trimmed)) return true;
  if (ALL_DISPLAY_MESSAGES.has(trimmed)) return true;
  return false;
}
