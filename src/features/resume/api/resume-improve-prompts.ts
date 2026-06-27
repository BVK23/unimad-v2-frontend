import type { UnibotResumeSection } from "@/components/chat/unibot-incoming-request";
import { RESUME_IMPROVE_PREFIX } from "@/features/adk-chat/handoff-prompts";

export type ResumeImprovePromptInput = {
  section: UnibotResumeSection;
  /** Whether the editor field already has user-written content. */
  hasContent: boolean;
  entryId?: string;
};

const DISPLAY_WHEN_CONTENT: Record<UnibotResumeSection, string> = {
  summary: "Improve my current summary",
  education: "Improve this education entry",
  experience: "Improve this experience entry",
  projects: "Improve my project description for this entry",
  certifications: "Improve this certification entry",
  skills: "Improve my skills section",
  custom: "Improve this custom section entry",
};

const DISPLAY_WHEN_EMPTY: Record<UnibotResumeSection, string> = {
  summary: "Craft a summary for this resume",
  education: "Add coursework for this education entry",
  experience: "Add experience bullet points for this entry",
  projects: "Add a project description for this entry",
  certifications: "Add a description for this certification entry",
  skills: "Add skills for this resume",
  custom: "Add content for this custom section entry",
};

const AGENT_WHEN_CONTENT: Record<UnibotResumeSection, string> = {
  summary:
    "Improve my professional summary. Use get_summary and read experiences, skills, education, and projects for context, then update_summary.",
  education:
    "Improve this education entry. Use get_education or find_education and read related sections for context, then update_education.",
  experience:
    "Improve this work experience entry. Use get_experiences or get_experience_by_id and read related sections for context, then apply the smallest set of experience tools.",
  projects:
    "Improve this project entry. Use get_projects or get_project_by_id and read related sections for context, then update the project.",
  certifications: "Improve this certification entry. Read certifications from the resume and update the entry.",
  skills: "Improve my skills section. Use get_skills and read related sections for context, then update skills.",
  custom: "Improve this custom section entry. Read the custom section and update the targeted entry.",
};

const AGENT_WHEN_EMPTY: Record<UnibotResumeSection, string> = {
  summary:
    "Craft a professional summary for this resume. Read experiences, skills, education, and projects with tools, then update_summary.",
  education: "Add coursework and supporting details for this education entry. Use get_education or find_education, then update_education.",
  experience:
    "Add strong bullet points for this experience entry. Use get_experiences or get_experience_by_id, then add_bullet or update_experience_description as needed.",
  projects: "Add a project description for this entry. Use get_projects or get_project_by_id, then update the project description.",
  certifications: "Add a description for this certification entry using the certification tools.",
  skills: "Add relevant skills for this resume using get_skills and the skills update tools.",
  custom: "Add content for this custom section entry using the custom section tools.",
};

function normalizeSection(section: string): UnibotResumeSection {
  const key = section.trim().toLowerCase() as UnibotResumeSection;
  return key in DISPLAY_WHEN_CONTENT ? key : "custom";
}

/** Short copy shown in the improve sub-thread bubble. */
export function buildResumeImproveDisplayMessage(input: ResumeImprovePromptInput): string {
  const section = normalizeSection(input.section);
  return input.hasContent ? DISPLAY_WHEN_CONTENT[section] : DISPLAY_WHEN_EMPTY[section];
}

/** Agent turn — no pasted resume body; tools load context from session. */
export function buildResumeImproveAgentMessage(input: ResumeImprovePromptInput): string {
  const section = normalizeSection(input.section);
  const base = input.hasContent ? AGENT_WHEN_CONTENT[section] : AGENT_WHEN_EMPTY[section];
  const entryId = input.entryId?.trim();
  if (!entryId) return base;
  return `${base} Session resume_improve_entry_id is "${entryId}" — focus on that entry.`;
}

const ALL_AGENT_BOOTSTRAPS = new Set([...Object.values(AGENT_WHEN_CONTENT), ...Object.values(AGENT_WHEN_EMPTY)]);

const ALL_DISPLAY_MESSAGES = new Set([...Object.values(DISPLAY_WHEN_CONTENT), ...Object.values(DISPLAY_WHEN_EMPTY)]);

/** Map stored ADK user text to friendly UI (legacy verbose improves + agent bootstrap). */
export function resumeImproveUserDisplayText(sentText: string, section?: string, entryId?: string): string {
  const trimmed = sentText.trim();
  if (!trimmed) return trimmed;
  if (ALL_DISPLAY_MESSAGES.has(trimmed)) return trimmed;
  if (ALL_AGENT_BOOTSTRAPS.has(trimmed)) {
    const hasContent = !trimmed.toLowerCase().includes("craft ") && !trimmed.toLowerCase().includes("add ");
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
  if (trimmed.includes("Session resume_improve_entry_id")) {
    const hasContent = trimmed.toLowerCase().includes("improve ");
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
  if (ALL_AGENT_BOOTSTRAPS.has(trimmed)) return true;
  if (ALL_DISPLAY_MESSAGES.has(trimmed)) return true;
  return false;
}
