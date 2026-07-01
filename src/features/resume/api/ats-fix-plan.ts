import type { UnibotResumeSection } from "@/components/chat/unibot-incoming-request";
import type { ResumeData } from "@/types";
import type { AtsScoreViewModel, AtsSectionKey } from "./ats-types";
import {
  buildAtsImproveAgentMessage,
  buildAtsImproveTopicTitle,
  buildAtsImproveUserDisplay,
  type AtsImprovePromptInput,
} from "./build-ats-improve-prompt";
import { collectOrphanImprovements, getRoutedImprovementsForSection, routeImprovementsToSection } from "./route-improvements-to-section";

export type AtsFixPlanSection = {
  section: UnibotResumeSection;
  displayText: string;
  agentText: string;
  topicTitle: string;
};

const ATS_TO_UNIBOT_SECTION: Partial<Record<AtsSectionKey, UnibotResumeSection>> = {
  profile: "summary",
  experience: "experience",
  skills: "skills",
  education: "education",
  projects: "projects",
  certifications: "certifications",
};

const ORPHAN_IMPROVEMENT_KEYS: AtsSectionKey[] = ["header", "formatting"];

const CERTIFICATIONS_SECTION_TITLE = /^certifications?$/i;

/** Certifications are optional in ATS — Fix with Unibot only improves them when content already exists. */
export const resumeHasCertificationsContent = (resume: ResumeData): boolean => {
  const hasStandardCerts = resume.certifications.some(cert =>
    Boolean(cert.title?.trim() || cert.description?.trim() || cert.issuer?.trim())
  );
  if (hasStandardCerts) return true;

  return resume.customSections.some(section => {
    if (!CERTIFICATIONS_SECTION_TITLE.test(section.title?.trim() ?? "")) return false;
    return section.items?.some(item => Boolean(item.title?.trim() || item.description?.trim() || item.subtitle?.trim())) ?? false;
  });
};

const shouldIncludeAtsFixSection = (rowKey: AtsSectionKey, resume: ResumeData): boolean => {
  if (rowKey === "certifications") return resumeHasCertificationsContent(resume);
  return true;
};

const sectionHasContent = (resume: ResumeData, unibotSection: UnibotResumeSection): boolean => {
  switch (unibotSection) {
    case "summary":
      return Boolean(resume.profile?.summary?.trim() || resume.profile?.title?.trim());
    case "experience":
      return resume.experience.some(exp => exp.role?.trim() || exp.description?.trim() || exp.company?.trim());
    case "education":
      return resume.education.some(edu => edu.degree?.trim() || edu.school?.trim() || edu.description?.trim());
    case "projects":
      return resume.projects.some(proj => proj.title?.trim() || proj.description?.trim());
    case "skills":
      return resume.skills.some(skill => skill.name?.trim());
    case "certifications":
      return resume.certifications.some(cert => cert.title?.trim() || cert.description?.trim());
    case "custom":
      return resume.customSections.some(section => section.items?.some(item => item.description?.trim() || item.title?.trim()));
    default:
      return false;
  }
};

const weakMappableSections = (vm: AtsScoreViewModel): AtsScoreViewModel["sectionAnalysis"] =>
  vm.sectionAnalysis.filter(row => row.status !== "good" && ATS_TO_UNIBOT_SECTION[row.key]);

export const buildAtsFixPlan = (vm: AtsScoreViewModel, resume: ResumeData): AtsFixPlanSection[] => {
  const weakRows = weakMappableSections(vm).filter(row => shouldIncludeAtsFixSection(row.key, resume));
  if (weakRows.length === 0) return [];

  const weakKeys = weakRows.map(row => row.key);
  const routed = routeImprovementsToSection(vm.improvements, weakKeys);

  const summaryOpens = weakRows.some(row => row.key === "profile");
  const orphanExtras = summaryOpens ? collectOrphanImprovements(routed, ORPHAN_IMPROVEMENT_KEYS) : [];

  return weakRows.map(row => {
    const unibotSection = ATS_TO_UNIBOT_SECTION[row.key] as UnibotResumeSection;
    const sectionImprovements = [...getRoutedImprovementsForSection(routed, row.key)];
    if (row.key === "profile") {
      sectionImprovements.push(...orphanExtras);
    }

    const promptInput: AtsImprovePromptInput = {
      section: unibotSection,
      sectionLabel: row.name,
      hasContent: sectionHasContent(resume, unibotSection),
      atsVm: vm,
      sectionRow: row,
      sectionImprovements,
    };

    return {
      section: unibotSection,
      displayText: buildAtsImproveUserDisplay(promptInput),
      agentText: buildAtsImproveAgentMessage(promptInput),
      topicTitle: buildAtsImproveTopicTitle(row.name),
    };
  });
};

export const canRunAtsFix = (vm: AtsScoreViewModel | null | undefined, resume: ResumeData): boolean => {
  if (!vm) return false;
  return buildAtsFixPlan(vm, resume).length > 0;
};
