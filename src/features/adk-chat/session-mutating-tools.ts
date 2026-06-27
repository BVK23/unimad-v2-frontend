/**
 * Registry: mutating ADK tool name → session domain + keys to read after GET.
 * @see docs/ADK_SESSION_CONTRACT.md
 */
import {
  isMutatingApplicationAssetTool,
  isMutatingContentGenTool,
  isMutatingLinkedInTool,
  isMutatingPortfolioTool,
  isMutatingResumeTool,
} from "./streaming/stream-activity";

export type MutatingSessionDomain = "resume" | "portfolio" | "linkedin" | "content_gen" | "application_asset";

/** Session state keys pulled after a mutating tool in this domain. */
export const SESSION_KEYS_BY_DOMAIN: Record<MutatingSessionDomain, readonly string[]> = {
  resume: ["resume_data", "current_resume"],
  portfolio: ["portfolio_data", "current_portfolio"],
  linkedin: ["linkedin_data"],
  content_gen: [
    "content_gen_data",
    "current_content_gen",
    "content_gen_topic",
    "content_gen_funnel",
    "content_gen_mood",
    "content_gen_asset_id",
  ],
  application_asset: [
    "application_asset_data",
    "current_application_asset",
    "application_asset_type",
    "application_asset_id",
    "application_role",
    "application_company",
    "application_jd",
    "application_contact_name",
  ],
};

export function mutatingToolDomain(toolName: string): MutatingSessionDomain | null {
  if (isMutatingResumeTool(toolName)) return "resume";
  if (isMutatingPortfolioTool(toolName)) return "portfolio";
  if (isMutatingLinkedInTool(toolName)) return "linkedin";
  if (isMutatingContentGenTool(toolName)) return "content_gen";
  if (isMutatingApplicationAssetTool(toolName)) return "application_asset";
  return null;
}

export function isMutatingSessionTool(toolName: string): boolean {
  return mutatingToolDomain(toolName) !== null;
}
