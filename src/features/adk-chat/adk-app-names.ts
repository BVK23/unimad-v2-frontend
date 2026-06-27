/** ADK app name helpers — safe for client and server (no google-auth-library). */

export type AdkStudioAssetType = "coverletter" | "coldemail" | "referral" | "linkedin_post";

/** ADK 2.3 flow apps — must match unimadai-adk-agent `app/workflows/graph_spec.py` FLOW_ENTRIES. */
const STUDIO_FLOW_APP_BY_ASSET: Record<AdkStudioAssetType, string> = {
  coverletter: "coverletter",
  coldemail: "coldemail",
  referral: "referral",
  linkedin_post: "linkedin_post",
};

/** Pre-ADK-2.3 studio runner apps (removed from agent repo). */
const LEGACY_STUDIO_APP_ALIASES: Record<string, string> = {
  studio_coverletter_app: "coverletter",
  studio_coldemail_app: "coldemail",
  studio_referral_app: "referral",
  studio_linkedin_post_app: "linkedin_post",
  studio_app: "unibot",
};

/** Default ADK app for chat (Unibot). */
export const getAdkAppName = (): string => process.env.ADK_APP_NAME || "unibot";

/**
 * ADK flow app for a Studio asset sub-thread.
 * Prefer `resolveSubSessionAdkApp` / `resolveAdkSessionOptionsForFeatureSection` for sub-sessions.
 */
export const getAdkStudioAppName = (assetType?: AdkStudioAssetType): string => {
  const override = process.env.ADK_STUDIO_APP_NAME || process.env.NEXT_PUBLIC_ADK_STUDIO_APP_NAME;
  if (override?.trim()) {
    return resolveAdkAppName(override.trim());
  }
  if (assetType) {
    return STUDIO_FLOW_APP_BY_ASSET[assetType];
  }
  return getAdkAppName();
};

export const resolveAdkAppName = (appName?: string): string => {
  const trimmed = appName?.trim();
  if (!trimmed) {
    return getAdkAppName();
  }
  return LEGACY_STUDIO_APP_ALIASES[trimmed] ?? trimmed;
};

export type AdkSessionAppOptions = {
  appName?: string;
  /** When set, session GET/PATCH/history retry this app if the primary returns 404 (legacy subs). */
  fallbackAppName?: string;
};
