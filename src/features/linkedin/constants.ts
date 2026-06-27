export const LINKEDIN_COMMENT_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/elnmehpjicaamapkjjjeemglpfbnbghc?utm_source=item-share-cb";

/** Single LinkedIn analysis row per user — key in ADK session linkedin_data. */
export const LINKEDIN_ADK_PROFILE_KEY = "default";

/** Minimum body length before a draft can be posted or scheduled on LinkedIn. */
export const MIN_LINKEDIN_POST_CHARS = 20;

export const LINKEDIN_POST_TOO_SHORT_MESSAGE = "Way too short for a proper LinkedIn post. Add more before posting or scheduling.";

/** Section ids aligned with Django section_scores and Improve buttons. */
export const LINKEDIN_SECTION_IDS = ["pic", "cover", "headline", "about", "exp", "skills"] as const;

export type LinkedInSectionId = (typeof LINKEDIN_SECTION_IDS)[number];

/** ADK specialist routing keys (includes non-dashboard sections). */
export const LINKEDIN_ADK_AGENT_SECTIONS = ["pic", "cover", "headline", "about", "experience", "skills", "connection", "comment"] as const;

export type LinkedInAdkAgentSection = (typeof LINKEDIN_ADK_AGENT_SECTIONS)[number];

/** Dispatched from Unibot chat to trigger dashboard Re-Analyze (LinkedIn page only). */
export const LINKEDIN_REANALYZE_EVENT = "linkedin-reanalyze";
