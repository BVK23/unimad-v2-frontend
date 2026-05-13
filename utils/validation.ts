import { ResumeData } from "../types";
import { compareResumeMonthDates } from "./resumeMonthDate";

export interface ValidationError {
  section: "profile" | "experience" | "education" | "projects" | "certifications" | "custom";
  id?: string; // For list items
  field: string;
  message: string;
}

export const validateResume = (data: ResumeData): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Helper Regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\d\s\+\-\(\)\.]{6,}$/; // Min 6 chars, allow digits, spaces, +, -, (), .
  const urlRegex = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/[^\s]*)?$/i;

  // 1. Profile Validation
  if (!data.profile.fullName?.trim()) {
    errors.push({ section: "profile", field: "fullName", message: "Full Name is required" });
  }

  if (!data.profile.email?.trim()) {
    errors.push({ section: "profile", field: "email", message: "Email is required" });
  } else if (!emailRegex.test(data.profile.email)) {
    errors.push({ section: "profile", field: "email", message: "Invalid email format" });
  }

  if (!data.profile.phone?.trim()) {
    errors.push({ section: "profile", field: "phone", message: "Phone is required" });
  } else if (!phoneRegex.test(data.profile.phone)) {
    errors.push({ section: "profile", field: "phone", message: "Invalid phone format (digits only)" });
  }

  if (data.profile.portfolio?.trim() && !urlRegex.test(data.profile.portfolio)) {
    errors.push({ section: "profile", field: "portfolio", message: "Invalid URL format" });
  }

  // 2. Experience Validation
  data.experience.forEach(exp => {
    if (!exp.company?.trim()) {
      errors.push({ section: "experience", id: exp.id, field: "company", message: "Company is required" });
    }
    if (!exp.role?.trim()) {
      errors.push({ section: "experience", id: exp.id, field: "role", message: "Role is required" });
    }
    if (!exp.startDate?.trim()) {
      errors.push({ section: "experience", id: exp.id, field: "startDate", message: "Start Date is required" });
    }
    if (!exp.current && !exp.endDate?.trim()) {
      errors.push({ section: "experience", id: exp.id, field: "endDate", message: "End Date is required" });
    }
    // Date Logic (compare normalized YYYY-MM; raw string compare breaks for "MMM YYYY" text)
    if (exp.startDate && exp.endDate && !exp.current) {
      const cmp = compareResumeMonthDates(exp.startDate, exp.endDate);
      if (cmp !== null && cmp > 0) {
        errors.push({ section: "experience", id: exp.id, field: "endDate", message: "End Date cannot be before Start Date" });
      }
    }
  });

  // 3. Education Validation
  data.education.forEach(edu => {
    if (!edu.school?.trim()) {
      errors.push({ section: "education", id: edu.id, field: "school", message: "School is required" });
    }
    if (!edu.degree?.trim()) {
      errors.push({ section: "education", id: edu.id, field: "degree", message: "Degree is required" });
    }
    if (!edu.startDate?.trim()) {
      errors.push({ section: "education", id: edu.id, field: "startDate", message: "Start Date is required" });
    }
    if (!edu.current && !edu.endDate?.trim()) {
      errors.push({ section: "education", id: edu.id, field: "endDate", message: "End Date is required" });
    }
    // Date Logic (compare normalized YYYY-MM; string compare is wrong for "MMM YYYY" text)
    if (edu.startDate && edu.endDate && !edu.current) {
      const cmp = compareResumeMonthDates(edu.startDate, edu.endDate);
      if (cmp !== null && cmp > 0) {
        errors.push({ section: "education", id: edu.id, field: "endDate", message: "End Date cannot be before Start Date" });
      }
    }
  });

  // 4. Projects Validation
  data.projects.forEach(proj => {
    if (!proj.title?.trim()) {
      errors.push({ section: "projects", id: proj.id, field: "title", message: "Project title is required" });
    }
    if (proj.url?.trim() && !urlRegex.test(proj.url)) {
      errors.push({ section: "projects", id: proj.id, field: "url", message: "Invalid URL format" });
    }
  });

  // 5. Certifications Validation
  data.certifications.forEach(cert => {
    if (!cert.title?.trim()) {
      errors.push({ section: "certifications", id: cert.id, field: "title", message: "Certification title is required" });
    }
    if (cert.credentialUrl?.trim() && !urlRegex.test(cert.credentialUrl)) {
      errors.push({ section: "certifications", id: cert.id, field: "credentialUrl", message: "Invalid URL format" });
    }
  });

  // 6. Custom Sections Validation
  data.customSections.forEach(sec => {
    if (!sec.title?.trim()) {
      errors.push({ section: "custom", id: sec.id, field: "title", message: "Section Title is required" });
    }
    sec.items.forEach(item => {
      if (!item.title?.trim()) {
        errors.push({ section: "custom", id: item.id, field: "title", message: "Item Title is required" });
      }
      // Date Logic for Custom Items
      if (item.hasDates && item.startDate && item.endDate && !item.current) {
        const cmp = compareResumeMonthDates(item.startDate, item.endDate);
        if (cmp !== null && cmp > 0) {
          errors.push({ section: "custom", id: item.id, field: "endDate", message: "Invalid Date Range" });
        }
      }
    });
  });

  return errors;
};
