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
