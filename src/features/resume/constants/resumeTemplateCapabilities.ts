import type { ResumeTemplateId } from "@/types";

/**
 * Templates that render `profile.title` (job title) in preview/PDF header.
 * Editor personal-details field is hidden for all other templates.
 */
const TEMPLATES_WITH_PROFILE_JOB_TITLE = new Set<ResumeTemplateId>(["modern", "canada", "professional", "slatepro", "primeslate"]);

export const resumeTemplateShowsProfileJobTitle = (templateId: ResumeTemplateId): boolean =>
  TEMPLATES_WITH_PROFILE_JOB_TITLE.has(templateId);
