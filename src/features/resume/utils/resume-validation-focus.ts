import type { ValidationError } from "@/utils/validation";

/** Stable DOM id for a resume form field (used to scroll/focus on export validation). */
export function resumeFieldDomId(section: string, field: string, id?: string): string {
  const parts = ["resume-field", section, field];
  if (id) parts.push(id);
  return parts.join("-");
}

const SECTION_LABELS: Record<string, string> = {
  profile: "Personal Details",
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  certifications: "Certifications",
  custom: "Custom section",
  ats: "Resume content",
};

const FIELD_LABELS: Record<string, string> = {
  fullName: "Full Name",
  email: "Email",
  phone: "Phone",
  portfolio: "Portfolio URL",
  company: "Company",
  role: "Role",
  startDate: "Start Date",
  endDate: "End Date",
  school: "School",
  degree: "Degree",
  title: "Title",
  url: "URL",
  credentialUrl: "Credential URL",
  substance: "Content",
};

export function formatResumeValidationMessage(error: ValidationError): string {
  if (error.section === "ats") {
    return error.message;
  }
  const section = SECTION_LABELS[error.section] ?? error.section;
  const field = FIELD_LABELS[error.field] ?? error.field;
  return `${error.message} — go to ${section} › ${field}.`;
}

export function focusResumeValidationField(error: ValidationError): void {
  if (error.section === "ats") return;
  const domId = resumeFieldDomId(error.section, error.field, error.id);
  const el = document.getElementById(domId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  if (el instanceof HTMLElement) {
    const focusable = el.matches("input, textarea, button, [tabindex]")
      ? el
      : el.querySelector<HTMLElement>("input, textarea, button, [tabindex]");
    focusable?.focus({ preventScroll: true });
  }
}
