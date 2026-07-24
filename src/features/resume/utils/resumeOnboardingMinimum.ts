import type { ResumeData } from "@/types";
import { htmlToPlainText } from "@/utils/html-to-text";

const hasText = (value: string | undefined | null): boolean => Boolean(value?.trim());

const visible = <T extends { hidden?: boolean }>(items: T[] | undefined): T[] => (items ?? []).filter(item => !item.hidden);

/**
 * Minimum resume content required before nudging user to complete onboarding → niche.
 * Mirrors onboarding profile-builder rules (education + experience OR project + 3 skills).
 */
export const resumeMeetsOnboardingProfileMinimum = (resume: ResumeData): boolean => {
  const educations = visible(resume.education).filter(e => hasText(e.degree) && hasText(e.school));
  if (educations.length < 1) return false;

  const experiences = visible(resume.experience).filter(e => hasText(e.role) && hasText(e.company));
  const projects = visible(resume.projects).filter(p => hasText(p.title));

  if (experiences.length < 1 && projects.length < 1) return false;

  const skills = visible(resume.skills).filter(s => hasText(s.name));
  if (skills.length < 3) return false;

  return true;
};

/** Plain-text preview for modal copy (optional). */
export const summarizeResumeForOnboarding = (resume: ResumeData): string => {
  const edu = visible(resume.education).length;
  const exp = visible(resume.experience).length;
  const proj = visible(resume.projects).length;
  const skills = visible(resume.skills).length;
  return `${edu} education · ${exp} experience · ${proj} projects · ${skills} skills`;
};

export const resumeDescriptionPlain = (html: string | undefined): string => {
  if (!html?.trim()) return "";
  return htmlToPlainText(html).trim();
};
