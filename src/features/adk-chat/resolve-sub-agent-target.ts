import type { UnibotAdkSessionRow } from "./session-registry";

/** Maps Django registry feature + section → ADK leaf agent for direct sub-session routing. */
export function resolveSubAgentTarget(row: Pick<UnibotAdkSessionRow, "feature" | "section"> | undefined): string | undefined {
  if (!row) {
    return undefined;
  }

  const feature = (row.feature ?? "").trim().toLowerCase();
  const section = (row.section ?? "").trim().toLowerCase();

  if (feature === "coverletter") return "cover_letter_draft_agent";
  if (feature === "coldemail") return "cold_email_draft_agent";
  if (feature === "referral") return "referral_draft_agent";
  if (feature === "linkedin_post") return "post_draft_agent";
  if (feature === "linkedin_topic") return "topic_planner_agent";

  if (feature === "application_asset") {
    if (section === "coverletter") return "cover_letter_draft_agent";
    if (section === "coldemail") return "cold_email_draft_agent";
    if (section === "referral") return "referral_draft_agent";
  }

  if (feature === "content_gen") {
    if (section === "topic") return "topic_planner_agent";
    if (section === "draft") return "post_draft_agent";
  }

  if (feature === "resume") {
    if (section === "ats") return "ats_agent";
    if (section === "summary") return "summary_agent";
    if (section === "education") return "education_agent";
    if (section === "experience") return "experience_agent";
    if (section === "projects") return "projects_agent";
    if (section === "skills") return "skills_agent";
    if (section === "certifications") return "certifications_agent";
    if (section === "custom") return "custom_sections_agent";
  }

  if (feature === "linkedin") {
    if (section === "pic") return "profile_pic_agent";
    if (section === "cover") return "cover_pic_agent";
    if (section === "headline") return "headline_agent";
    if (section === "about") return "about_agent";
    if (section === "experience") return "linkedin_experience_agent";
    if (section === "skills") return "linkedin_skills_agent";
    if (section === "connection") return "connection_agent";
    if (section === "comment") return "comment_agent";
  }

  return undefined;
}

export const SUB_AGENT_TARGET_STATE_KEY = "sub_agent_target";
