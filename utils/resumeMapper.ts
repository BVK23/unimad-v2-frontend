import { formatForInput } from "../components/resume/shared/dateUtils";
import { ResumeData, ResumeExperience, ResumeEducation, ResumeProject, ResumeSkill, ResumeTemplateId, SectionOrderItem } from "../types";

const normalizeLegacyTemplateId = (raw: string): ResumeTemplateId => {
  const u = raw.toUpperCase().replace(/\s+/g, "_");
  if (u === "PROFESSIONALS" || u === "PROFESSIONAL") return "professional";
  if (u === "SLATEPRO" || u === "SLATE_PRO" || raw === "SlatePro") return "slatepro";
  if (u === "PRIMESLATE" || u === "PRIME_SLATE" || raw === "PrimeSlate") return "primeslate";
  return raw.toLowerCase() as ResumeTemplateId;
};

export function mapDjangoResumeToFrontend(data: any): ResumeData {
  let profile = { city: "", name: "", email: "", phone: "", github: "", country: "", picture: "", linkedin: "", portfolio: "" };
  try {
    profile = typeof data.profile === "string" ? JSON.parse(data.profile) : data.profile;
  } catch (e) {
    console.warn("Failed to parse profile JSON", e);
  }

  let experiences = [];
  try {
    experiences = typeof data.experiences === "string" ? JSON.parse(data.experiences) : data.experiences;
  } catch (e) {
    console.warn("Failed to parse experiences JSON", e);
  }

  let educations = [];
  try {
    educations = typeof data.educations === "string" ? JSON.parse(data.educations) : data.educations;
  } catch (e) {
    console.warn("Failed to parse educations JSON", e);
  }

  let projects = [];
  try {
    projects = typeof data.projects === "string" ? JSON.parse(data.projects) : data.projects;
  } catch (e) {
    console.warn("Failed to parse projects JSON", e);
  }

  let skills = [];
  try {
    skills = typeof data.skills === "string" ? JSON.parse(data.skills) : data.skills;
  } catch (e) {
    console.warn("Failed to parse skills JSON", e);
  }

  let sectionOrderRaw = [];
  try {
    sectionOrderRaw = typeof data.section_order === "string" ? JSON.parse(data.section_order) : data.section_order;
  } catch (e) {
    console.warn("Failed to parse section_order JSON", e);
  }

  const mappedExperiences: ResumeExperience[] = experiences.map((exp: any) => ({
    id: String(exp.id),
    company: exp.organisation || "",
    role: exp.role || "",
    startDate: formatForInput(exp.startDate || ""),
    endDate: formatForInput(exp.endDate || ""),
    current: (exp.endDate || "").toLowerCase() === "present",
    location: exp.location || "",
    description: exp.descriptions || "",
    hidden: false,
  }));

  const mappedEducations: ResumeEducation[] = educations.map((edu: any) => ({
    id: String(edu.id),
    school: edu.institution || "",
    degree: edu.course || "",
    startDate: formatForInput(edu.startDate || ""),
    endDate: formatForInput(edu.endDate || ""),
    current: (edu.endDate || "").toLowerCase() === "present",
    location: edu.location || "",
    description: edu.courseWork || "",
    hidden: false,
  }));

  const mappedSkills: ResumeSkill[] = skills.map((skill: any) => ({
    id: String(skill.id),
    name: `${skill.category ? skill.category + ": " : ""}${skill.skill}`,
    hidden: false,
  }));

  const mappedProjects: ResumeProject[] = projects.map((proj: any) => ({
    id: String(proj.id),
    title: proj.title || "",
    url: proj.url || "",
    description: proj.descriptions || "",
    hidden: false,
  }));

  const mappedSectionOrder: SectionOrderItem[] = sectionOrderRaw.map((item: any) => {
    const key = Object.keys(item)[0]; // e.g., 'EXPERIENCES'
    return {
      id: key.toLowerCase(),
      hidden: item[key].hidden || false,
    };
  });

  return {
    id: String(data.resume_id || data.id || "1"),
    title: data.name || "Untitled Resume",
    lastModified: new Date(data.updated_at || Date.now()),
    templateId: normalizeLegacyTemplateId(String(data.template || "modern")),
    profile: {
      fullName: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      city: profile.city || "",
      country: profile.country || "",
      linkedin: profile.linkedin || "",
      github: profile.github || "",
      portfolio: profile.portfolio || "",
      picture: profile.picture || "",
      summary: data.summary || "",
      title: "",
    },
    experience: mappedExperiences,
    education: mappedEducations,
    skills: mappedSkills,
    projects: mappedProjects,
    certifications: [],
    customSections: [],
    sectionOrder: mappedSectionOrder,
  };
}
