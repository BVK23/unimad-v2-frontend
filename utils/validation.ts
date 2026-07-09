import { ResumeData } from "../types";
import { compareResumeMonthDates } from "./resumeMonthDate";

export interface ValidationError {
  section: "profile" | "experience" | "education" | "projects" | "certifications" | "custom" | "ats";
  id?: string; // For list items
  field: string;
  message: string;
}

const LEGACY_CUSTOM_SECTION_TITLES = new Set(["", "untitled section", "untitled"]);
const LEGACY_CUSTOM_ITEM_TITLES = new Set(["", "activity name", "new item"]);

function stripHtml(html: string | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

function isMeaningfulCustomSectionTitle(title: string | undefined): boolean {
  const t = (title ?? "").trim().toLowerCase();
  return t.length > 0 && !LEGACY_CUSTOM_SECTION_TITLES.has(t);
}

function isMeaningfulCustomItemTitle(title: string | undefined): boolean {
  const t = (title ?? "").trim().toLowerCase();
  return t.length > 0 && !LEGACY_CUSTOM_ITEM_TITLES.has(t);
}

/** Field-level rules for Share & Download (and shared with ATS gating). */
export const validateResume = (data: ResumeData): ValidationError[] => {
  const errors: ValidationError[] = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\d\s\+\-\(\)\.]{6,}$/;
  const urlRegex = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/[^\s]*)?$/i;

  // 1. Profile — only name + email are required
  if (!data.profile.fullName?.trim()) {
    errors.push({ section: "profile", field: "fullName", message: "Full Name is required" });
  }

  if (!data.profile.email?.trim()) {
    errors.push({ section: "profile", field: "email", message: "Email is required" });
  } else if (!emailRegex.test(data.profile.email)) {
    errors.push({ section: "profile", field: "email", message: "Invalid email format" });
  }

  // Phone optional; validate format only when provided
  if (data.profile.phone?.trim() && !phoneRegex.test(data.profile.phone)) {
    errors.push({ section: "profile", field: "phone", message: "Invalid phone format (digits only)" });
  }

  if (data.profile.portfolio?.trim() && !urlRegex.test(data.profile.portfolio)) {
    errors.push({ section: "profile", field: "portfolio", message: "Invalid URL format" });
  }

  // 2. Experience — company + role required; dates optional but must be valid if both set
  data.experience.forEach(exp => {
    if (!exp.company?.trim()) {
      errors.push({ section: "experience", id: exp.id, field: "company", message: "Company is required" });
    }
    if (!exp.role?.trim()) {
      errors.push({ section: "experience", id: exp.id, field: "role", message: "Role is required" });
    }
    if (exp.startDate && exp.endDate && !exp.current) {
      const cmp = compareResumeMonthDates(exp.startDate, exp.endDate);
      if (cmp !== null && cmp > 0) {
        errors.push({ section: "experience", id: exp.id, field: "endDate", message: "End Date cannot be before Start Date" });
      }
    }
  });

  // 3. Education — school + degree required; dates optional but must be valid if both set
  data.education.forEach(edu => {
    if (!edu.school?.trim()) {
      errors.push({ section: "education", id: edu.id, field: "school", message: "School is required" });
    }
    if (!edu.degree?.trim()) {
      errors.push({ section: "education", id: edu.id, field: "degree", message: "Degree is required" });
    }
    if (edu.startDate && edu.endDate && !edu.current) {
      const cmp = compareResumeMonthDates(edu.startDate, edu.endDate);
      if (cmp !== null && cmp > 0) {
        errors.push({ section: "education", id: edu.id, field: "endDate", message: "End Date cannot be before Start Date" });
      }
    }
  });

  // 4. Projects — title required
  data.projects.forEach(proj => {
    if (!proj.title?.trim()) {
      errors.push({ section: "projects", id: proj.id, field: "title", message: "Project title is required" });
    }
    if (proj.url?.trim() && !urlRegex.test(proj.url)) {
      errors.push({ section: "projects", id: proj.id, field: "url", message: "Invalid URL format" });
    }
  });

  // 5. Certifications — title required
  data.certifications.forEach(cert => {
    if (!cert.title?.trim()) {
      errors.push({ section: "certifications", id: cert.id, field: "title", message: "Certification title is required" });
    }
    if (cert.credentialUrl?.trim() && !urlRegex.test(cert.credentialUrl)) {
      errors.push({ section: "certifications", id: cert.id, field: "credentialUrl", message: "Invalid URL format" });
    }
  });

  // 6. Custom sections — real title required (not default/empty)
  data.customSections.forEach(sec => {
    if (!isMeaningfulCustomSectionTitle(sec.title)) {
      errors.push({ section: "custom", id: sec.id, field: "title", message: "Section title is required (cannot be default)" });
    }
    sec.items.forEach(item => {
      if (!isMeaningfulCustomItemTitle(item.title)) {
        errors.push({ section: "custom", id: item.id, field: "title", message: "Item title is required" });
      }
      if (item.hasDates && item.startDate && item.endDate && !item.current) {
        const cmp = compareResumeMonthDates(item.startDate, item.endDate);
        if (cmp !== null && cmp > 0) {
          errors.push({ section: "custom", id: item.id, field: "endDate", message: "End Date cannot be before Start Date" });
        }
      }
    });
  });

  return errors;
};

function hasFilledExperience(data: ResumeData): boolean {
  return data.experience.some(e => e.company?.trim() && e.role?.trim());
}

function hasFilledEducation(data: ResumeData): boolean {
  return data.education.some(e => e.school?.trim() && e.degree?.trim());
}

function hasFilledProject(data: ResumeData): boolean {
  return data.projects.some(p => p.title?.trim());
}

function hasFilledCertification(data: ResumeData): boolean {
  return data.certifications.some(c => c.title?.trim());
}

function hasSummary(data: ResumeData): boolean {
  return stripHtml(data.profile.summary).length > 0;
}

/**
 * ATS needs enough substance to score meaningfully.
 * Accepts any of:
 * - 1 education + 1 experience
 * - 1 education + 1 project
 * - 1 education + 1 certification
 * - 1 experience + 1 project
 * - 1 experience + 1 certification
 * - 1 experience + summary
 */
export function resumeHasAtsSubstance(data: ResumeData): boolean {
  const edu = hasFilledEducation(data);
  const exp = hasFilledExperience(data);
  const proj = hasFilledProject(data);
  const cert = hasFilledCertification(data);
  const summary = hasSummary(data);

  if (edu && exp) return true;
  if (edu && proj) return true;
  if (edu && cert) return true;
  if (exp && proj) return true;
  if (exp && cert) return true;
  if (exp && summary) return true;
  return false;
}

export type AtsGateResult = { ok: true } | { ok: false; reason: "fields" | "substance"; message: string; firstError?: ValidationError };

export function getAtsGateState(data: ResumeData): AtsGateResult {
  const fieldErrors = validateResume(data);
  if (fieldErrors.length > 0) {
    return {
      ok: false,
      reason: "fields",
      message: fieldErrors[0].message,
      firstError: fieldErrors[0],
    };
  }
  if (!resumeHasAtsSubstance(data)) {
    return {
      ok: false,
      reason: "substance",
      message:
        "Add more content to unlock ATS Score. For example an education or experience section, plus another section like a project, certification, or summary.",
    };
  }
  return { ok: true };
}
