import type { ResumeData } from "@/types";

type ResumeContentSnapshot = {
  id: string;
  title: string;
  templateId: ResumeData["templateId"];
  isBase: boolean;
  slug: string;
  profile: ResumeData["profile"];
  experience: ResumeData["experience"];
  education: ResumeData["education"];
  skills: ResumeData["skills"];
  skillCategories: ResumeData["skillCategories"];
  projects: ResumeData["projects"];
  certifications: ResumeData["certifications"];
  customSections: ResumeData["customSections"];
  sectionOrder: ResumeData["sectionOrder"];
  educationLeftColumn?: boolean;
};

type ResumePreviewSnapshot = Omit<ResumeContentSnapshot, "title">;

export function getResumePreviewContentSignature(resume: ResumeData): string {
  const snapshot: ResumePreviewSnapshot = {
    id: resume.id,
    templateId: resume.templateId,
    isBase: Boolean(resume.isBase),
    slug: resume.slug?.trim() ?? "",
    profile: resume.profile,
    experience: resume.experience,
    education: resume.education,
    skills: resume.skills,
    skillCategories: resume.skillCategories,
    projects: resume.projects,
    certifications: resume.certifications,
    customSections: resume.customSections,
    sectionOrder: resume.sectionOrder,
    ...(resume.educationLeftColumn !== undefined ? { educationLeftColumn: resume.educationLeftColumn } : {}),
  };

  return JSON.stringify(snapshot);
}

export function getResumeContentSignature(resume: ResumeData): string {
  const snapshot: ResumeContentSnapshot = {
    id: resume.id,
    title: resume.title,
    templateId: resume.templateId,
    isBase: Boolean(resume.isBase),
    slug: resume.slug?.trim() ?? "",
    profile: resume.profile,
    experience: resume.experience,
    education: resume.education,
    skills: resume.skills,
    skillCategories: resume.skillCategories,
    projects: resume.projects,
    certifications: resume.certifications,
    customSections: resume.customSections,
    sectionOrder: resume.sectionOrder,
    ...(resume.educationLeftColumn !== undefined ? { educationLeftColumn: resume.educationLeftColumn } : {}),
  };

  return JSON.stringify(snapshot);
}
