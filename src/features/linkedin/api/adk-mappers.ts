import { LINKEDIN_ADK_PROFILE_KEY } from "@/src/features/linkedin/constants";
import type { LinkedInAnalysisSnapshot, LinkedInProfileContent } from "@/src/features/linkedin/types";

/** Shape stored under linkedin_data[current_linkedin] in ADK session state. */
export type LinkedInSessionProfile = {
  profile_url?: string;
  display_name: string;
  profile_picture_url: string | null;
  cover_picture_url: string | null;
  headline: string;
  about: string;
  experience: unknown[];
  skills: unknown[];
  overall_score: number;
  sections: LinkedInAnalysisSnapshot["result"]["sections"];
  section_scores: LinkedInAnalysisSnapshot["sectionScores"];
  top_actions: string[];
  connection_draft: {
    recipient_name: string;
    recipient_designation: string;
    message: string;
  };
  comment_draft: {
    post_context: string;
    message: string;
  };
  analyzed_at: string;
};

export type LinkedInAdkStateDeltaPayload = {
  active_context: "linkedin";
  current_linkedin: string;
  linkedin_data: Record<string, LinkedInSessionProfile>;
};

export function mapSnapshotToLinkedInSessionProfile(snapshot: LinkedInAnalysisSnapshot): LinkedInSessionProfile {
  const { result, analyzedAt, overallScore, sectionScores, profileContent } = snapshot;
  const content: LinkedInProfileContent = profileContent ?? {
    displayName: result.displayName,
    profilePictureUrl: result.profilePictureUrl,
    coverPictureUrl: result.coverPictureUrl ?? null,
    headline: "",
    about: "",
    experience: [],
    skills: [],
  };

  return {
    display_name: content.displayName || result.displayName,
    profile_picture_url: content.profilePictureUrl ?? result.profilePictureUrl,
    cover_picture_url: content.coverPictureUrl ?? result.coverPictureUrl ?? null,
    headline: content.headline ?? "",
    about: content.about ?? "",
    experience: Array.isArray(content.experience) ? content.experience : [],
    skills: Array.isArray(content.skills) ? content.skills : [],
    overall_score: overallScore ?? result.overallScore,
    sections: result.sections,
    section_scores: sectionScores,
    top_actions: result.topActions,
    connection_draft: {
      recipient_name: "",
      recipient_designation: "",
      message: "",
    },
    comment_draft: {
      post_context: "",
      message: "",
    },
    analyzed_at: analyzedAt,
  };
}

export function buildAdkLinkedInStateDelta(snapshot: LinkedInAnalysisSnapshot): LinkedInAdkStateDeltaPayload {
  const profile = mapSnapshotToLinkedInSessionProfile(snapshot);
  return {
    active_context: "linkedin",
    current_linkedin: LINKEDIN_ADK_PROFILE_KEY,
    linkedin_data: {
      [LINKEDIN_ADK_PROFILE_KEY]: profile,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Read linkedin_data[current] from a pulled ADK session state object. */
export function extractLinkedInSessionProfileFromAdkState(
  state: Record<string, unknown> | null | undefined,
  profileKey: string = LINKEDIN_ADK_PROFILE_KEY
): LinkedInSessionProfile | null {
  if (!state) return null;
  const linkedinData = state.linkedin_data;
  if (!isRecord(linkedinData)) return null;
  const currentRaw = state.current_linkedin;
  const key = typeof currentRaw === "string" && currentRaw.trim().length > 0 ? currentRaw.trim() : profileKey;
  const row = linkedinData[key];
  if (!isRecord(row)) return null;

  const connectionDraft = isRecord(row.connection_draft)
    ? {
        recipient_name: typeof row.connection_draft.recipient_name === "string" ? row.connection_draft.recipient_name : "",
        recipient_designation:
          typeof row.connection_draft.recipient_designation === "string" ? row.connection_draft.recipient_designation : "",
        message: typeof row.connection_draft.message === "string" ? row.connection_draft.message : "",
      }
    : { recipient_name: "", recipient_designation: "", message: "" };

  const commentDraft = isRecord(row.comment_draft)
    ? {
        post_context: typeof row.comment_draft.post_context === "string" ? row.comment_draft.post_context : "",
        message: typeof row.comment_draft.message === "string" ? row.comment_draft.message : "",
      }
    : { post_context: "", message: "" };

  return {
    display_name: typeof row.display_name === "string" ? row.display_name : "",
    profile_picture_url:
      typeof row.profile_picture_url === "string" && row.profile_picture_url.trim() ? row.profile_picture_url.trim() : null,
    cover_picture_url: typeof row.cover_picture_url === "string" && row.cover_picture_url.trim() ? row.cover_picture_url.trim() : null,
    headline: typeof row.headline === "string" ? row.headline : "",
    about: typeof row.about === "string" ? row.about : "",
    experience: Array.isArray(row.experience) ? row.experience : [],
    skills: Array.isArray(row.skills) ? row.skills : [],
    overall_score: typeof row.overall_score === "number" ? row.overall_score : 0,
    sections: Array.isArray(row.sections) ? (row.sections as LinkedInAnalysisSnapshot["result"]["sections"]) : [],
    section_scores: isRecord(row.section_scores) ? (row.section_scores as LinkedInAnalysisSnapshot["sectionScores"]) : undefined,
    top_actions: Array.isArray(row.top_actions) ? row.top_actions.filter((v): v is string => typeof v === "string") : [],
    connection_draft: connectionDraft,
    comment_draft: commentDraft,
    analyzed_at: typeof row.analyzed_at === "string" ? row.analyzed_at : "",
  };
}

/** Merge session profile text into an existing analysis snapshot for React Query. */
export function mapLinkedInSessionProfileToSnapshot(
  profile: LinkedInSessionProfile,
  previous: LinkedInAnalysisSnapshot | null | undefined
): LinkedInAnalysisSnapshot {
  const base = previous?.result;
  return {
    result: {
      profilePictureUrl: profile.profile_picture_url ?? base?.profilePictureUrl ?? null,
      coverPictureUrl: profile.cover_picture_url ?? base?.coverPictureUrl ?? null,
      displayName: profile.display_name || base?.displayName || "",
      overallScore: profile.overall_score ?? base?.overallScore ?? 0,
      sections: profile.sections.length > 0 ? profile.sections : (base?.sections ?? []),
      topActions: profile.top_actions.length > 0 ? profile.top_actions : (base?.topActions ?? []),
    },
    analyzedAt: profile.analyzed_at || previous?.analyzedAt || "",
    hasAnalysis: previous?.hasAnalysis ?? true,
    overallScore: profile.overall_score ?? previous?.overallScore,
    sectionScores: profile.section_scores ?? previous?.sectionScores,
    profileContent: {
      displayName: profile.display_name,
      profilePictureUrl: profile.profile_picture_url,
      coverPictureUrl: profile.cover_picture_url,
      headline: profile.headline,
      about: profile.about,
      experience: profile.experience,
      skills: profile.skills,
    },
  };
}
