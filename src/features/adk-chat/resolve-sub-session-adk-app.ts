import { getAdkAppName } from "./adk-app-names";
import type { AdkSessionServiceOptions } from "./session-history";
import { getRegistryRow, type UnibotAdkSessionRow } from "./session-registry";

/**
 * Sub-session ADK flow apps — graph entry nodes (leaf specialist as Workflow root).
 *
 * Mapping is **frontend-only**. ADK `apps/` exposes one app per row below;
 * see unimadai-adk-agent `app/workflows/graph_spec.py` FLOW_ENTRIES.
 */
export const SUB_SESSION_FLOW_APPS = {
  linkedinTopic: "linkedin_topic",
  linkedinPost: "linkedin_post",
  contentGen: "content_gen",
  coverletter: "coverletter",
  coldemail: "coldemail",
  referral: "referral",
  resumeSummary: "resume_summary",
  resumeEducation: "resume_education",
  resumeExperience: "resume_experience",
  resumeProjects: "resume_projects",
  resumeSkills: "resume_skills",
  linkedinPic: "linkedin_pic",
  linkedinCover: "linkedin_cover",
  linkedinHeadline: "linkedin_headline",
  linkedinAbout: "linkedin_about",
  linkedinExperience: "linkedin_experience",
  linkedinSkills: "linkedin_skills",
} as const;

export type SubSessionFlowAppName = (typeof SUB_SESSION_FLOW_APPS)[keyof typeof SUB_SESSION_FLOW_APPS];

/** @deprecated Use SUB_SESSION_FLOW_APPS */
export const SUB_SESSION_ADK_APPS = SUB_SESSION_FLOW_APPS;

const RESUME_SECTION_FLOWS: Record<string, SubSessionFlowAppName> = {
  summary: SUB_SESSION_FLOW_APPS.resumeSummary,
  education: SUB_SESSION_FLOW_APPS.resumeEducation,
  experience: SUB_SESSION_FLOW_APPS.resumeExperience,
  projects: SUB_SESSION_FLOW_APPS.resumeProjects,
  skills: SUB_SESSION_FLOW_APPS.resumeSkills,
};

const LINKEDIN_SECTION_FLOWS: Record<string, SubSessionFlowAppName> = {
  pic: SUB_SESSION_FLOW_APPS.linkedinPic,
  cover: SUB_SESSION_FLOW_APPS.linkedinCover,
  headline: SUB_SESSION_FLOW_APPS.linkedinHeadline,
  about: SUB_SESSION_FLOW_APPS.linkedinAbout,
  experience: SUB_SESSION_FLOW_APPS.linkedinExperience,
  skills: SUB_SESSION_FLOW_APPS.linkedinSkills,
};

/** Maps Django registry feature + section → ADK runtime app name (`apps/<name>/`). */
export function resolveSubSessionAdkApp(row: Pick<UnibotAdkSessionRow, "kind" | "feature" | "section"> | undefined): string | undefined {
  if (!row || row.kind !== "sub") {
    return undefined;
  }

  const feature = (row.feature ?? "").trim().toLowerCase();
  const section = (row.section ?? "").trim().toLowerCase();

  if (feature === "linkedin_topic") return SUB_SESSION_FLOW_APPS.linkedinTopic;
  if (feature === "linkedin_post") return SUB_SESSION_FLOW_APPS.linkedinPost;
  if (feature === "coverletter") return SUB_SESSION_FLOW_APPS.coverletter;
  if (feature === "coldemail") return SUB_SESSION_FLOW_APPS.coldemail;
  if (feature === "referral") return SUB_SESSION_FLOW_APPS.referral;

  if (feature === "resume") {
    return RESUME_SECTION_FLOWS[section] ?? SUB_SESSION_FLOW_APPS.resumeSummary;
  }

  if (feature === "linkedin") {
    return LINKEDIN_SECTION_FLOWS[section] ?? SUB_SESSION_FLOW_APPS.linkedinHeadline;
  }

  if (feature === "application_asset") {
    if (section === "coverletter") return SUB_SESSION_FLOW_APPS.coverletter;
    if (section === "coldemail") return SUB_SESSION_FLOW_APPS.coldemail;
    if (section === "referral") return SUB_SESSION_FLOW_APPS.referral;
  }

  if (feature === "content_gen") {
    if (section === "topic") return SUB_SESSION_FLOW_APPS.linkedinTopic;
    if (section === "draft") return SUB_SESSION_FLOW_APPS.linkedinPost;
    return SUB_SESSION_FLOW_APPS.contentGen;
  }

  return undefined;
}

/** ADK session service options for a session id (sub-flow with legacy `app` fallback). */
export function resolveAdkSessionOptionsForSessionId(adkSessionId: string): AdkSessionServiceOptions {
  const row = getRegistryRow(adkSessionId);
  return resolveAdkSessionOptionsForRegistryRow(row);
}

export function resolveAdkSessionOptionsForRegistryRow(
  row: Pick<UnibotAdkSessionRow, "kind" | "feature" | "section"> | undefined
): AdkSessionServiceOptions {
  const subApp = resolveSubSessionAdkApp(row);
  if (!subApp) {
    return {};
  }
  const mainApp = getAdkAppName();
  if (subApp === mainApp) {
    return { appName: subApp };
  }
  return { appName: subApp, fallbackAppName: mainApp };
}

export function resolveAdkSessionOptionsForFeatureSection(feature: string, section: string = ""): AdkSessionServiceOptions {
  return resolveAdkSessionOptionsForRegistryRow({ kind: "sub", feature, section });
}
