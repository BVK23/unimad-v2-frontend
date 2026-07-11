import type { OnboardingEducation, OnboardingExperience, OnboardingProject } from "@/features/onboarding/types";
import { compareResumeMonthDates, normalizeResumeMonthStorage } from "@/utils/resumeMonthDate";
import type { ProfileBuilderData } from "./types";

export type ProfileBuilderValidationError = {
  section: "education" | "experience" | "projects" | "skills";
  index?: number;
  field?: string;
  message: string;
};

const URL_REGEX = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/[^\s]*)?$/i;

function isPresentEnd(endDate: string): boolean {
  const lower = endDate.trim().toLowerCase();
  return lower === "present" || lower === "current";
}

function hasText(value: string | undefined | null): boolean {
  return Boolean(value?.trim());
}

function hasDescriptions(descriptions: string[] | undefined): boolean {
  return (descriptions ?? []).some(d => d.trim().length > 0);
}

function isStartInFuture(startDate: string): boolean {
  const normalized = normalizeResumeMonthStorage(startDate);
  if (!normalized || isPresentEnd(normalized)) return false;
  const [y, m] = normalized.split("-").map(Number);
  if (!y || !m) return false;
  const now = new Date();
  const start = new Date(y, m - 1, 1);
  const today = new Date(now.getFullYear(), now.getMonth(), 1);
  return start > today;
}

function validateDateRange(
  startDate: string,
  endDate: string,
  section: "education" | "experience",
  label: string
): ProfileBuilderValidationError[] {
  const start = startDate.trim();
  const end = endDate.trim();
  if (!start || !end) return [];

  const errors: ProfileBuilderValidationError[] = [];

  if (isPresentEnd(end)) {
    if (isStartInFuture(start)) {
      errors.push({
        section,
        field: "startDate",
        message: `${label}: Start date cannot be in the future when end date is Present.`,
      });
    }
  } else {
    const cmp = compareResumeMonthDates(start, end);
    if (cmp !== null && cmp > 0) {
      errors.push({
        section,
        field: "startDate",
        message: `${label}: Start date must be before end date.`,
      });
    }
  }

  return errors;
}

export function validateEducationEntry(edu: OnboardingEducation, index: number): ProfileBuilderValidationError[] {
  const label = `Education ${index + 1}`;
  const errors: ProfileBuilderValidationError[] = [];

  if (!hasText(edu.institution)) {
    errors.push({ section: "education", index, field: "institution", message: `${label}: University name is required.` });
  }
  if (!hasText(edu.course)) {
    errors.push({ section: "education", index, field: "course", message: `${label}: Course name is required.` });
  }
  if (!hasText(edu.courseWork)) {
    errors.push({ section: "education", index, field: "courseWork", message: `${label}: Coursework is required.` });
  }

  validateDateRange(edu.startDate, edu.endDate, "education", label).forEach(err => {
    errors.push({ ...err, index });
  });

  return errors;
}

export function validateExperienceEntry(exp: OnboardingExperience, index: number): ProfileBuilderValidationError[] {
  const label = `Experience ${index + 1}`;
  const errors: ProfileBuilderValidationError[] = [];

  if (!hasText(exp.organisation)) {
    errors.push({ section: "experience", index, field: "organisation", message: `${label}: Company name is required.` });
  }
  if (!hasText(exp.role)) {
    errors.push({ section: "experience", index, field: "role", message: `${label}: Role name is required.` });
  }
  if (!hasDescriptions(exp.descriptions)) {
    errors.push({ section: "experience", index, field: "descriptions", message: `${label}: Description is required.` });
  }

  validateDateRange(exp.startDate, exp.endDate, "experience", label).forEach(err => {
    errors.push({ ...err, index });
  });

  return errors;
}

export function validateProjectEntry(proj: OnboardingProject, index: number): ProfileBuilderValidationError[] {
  const label = `Project ${index + 1}`;
  const errors: ProfileBuilderValidationError[] = [];

  if (!hasText(proj.name)) {
    errors.push({ section: "projects", index, field: "name", message: `${label}: Project name is required.` });
  }
  if (!hasDescriptions(proj.descriptions)) {
    errors.push({ section: "projects", index, field: "descriptions", message: `${label}: Description is required.` });
  }
  if (proj.link?.trim() && !URL_REGEX.test(proj.link.trim())) {
    errors.push({ section: "projects", index, field: "link", message: `${label}: Link must be a valid URL.` });
  }

  return errors;
}

export function validateProfileBuilderData(data: ProfileBuilderData): ProfileBuilderValidationError[] {
  const errors: ProfileBuilderValidationError[] = [];

  if (data.educations.length < 1) {
    errors.push({ section: "education", message: "Add at least one education entry." });
  } else {
    data.educations.forEach((edu, index) => {
      errors.push(...validateEducationEntry(edu, index));
    });
  }

  if (data.experiences.length < 1 && !data.experienceSkipped) {
    errors.push({ section: "experience", message: "Add experience or mark yourself as a fresher." });
  } else if (!data.experienceSkipped) {
    data.experiences.forEach((exp, index) => {
      errors.push(...validateExperienceEntry(exp, index));
    });
  }

  const needsProject = data.experiences.length === 0 || data.experienceSkipped;
  if (needsProject && data.projects.length < 1) {
    errors.push({ section: "projects", message: "Add at least one project or internship." });
  } else {
    data.projects.forEach((proj, index) => {
      errors.push(...validateProjectEntry(proj, index));
    });
  }

  if (data.skills.length < 3) {
    errors.push({ section: "skills", message: "Add at least 3 skills." });
  }

  return errors;
}

export function formatProfileBuilderValidationError(error: ProfileBuilderValidationError): string {
  return error.message;
}

export function fieldErrorsForEntry(
  errors: ProfileBuilderValidationError[],
  section: ProfileBuilderValidationError["section"],
  index: number
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const err of errors) {
    if (err.section !== section || err.index !== index || !err.field) continue;
    map[err.field] = err.message.replace(/^[^:]+:\s*/, "");
  }
  return map;
}
