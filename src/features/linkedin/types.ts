export type LinkedInSectionStatus = "good" | "warning" | "critical";

export type LinkedInSectionAnalysis = {
  id: string;
  name: string;
  status: LinkedInSectionStatus;
  score: number;
  feedback: string;
  tip: string;
  priority?: string;
  recommendations?: string[];
};

export type LinkedInAnalyzeResult = {
  profilePictureUrl: string | null;
  coverPictureUrl?: string | null;
  displayName: string;
  overallScore: number;
  sections: LinkedInSectionAnalysis[];
  topActions: string[];
};

/** Scraped profile text from GET /api/linkedin/analysis/ profileContent. */
export type LinkedInProfileContent = {
  displayName: string;
  profilePictureUrl: string | null;
  coverPictureUrl: string | null;
  headline: string;
  about: string;
  experience: unknown[];
  skills: unknown[];
};

/** Cached analysis from GET /api/linkedin/analysis/ (after mapper). */
export type LinkedInAnalysisSnapshot = {
  result: LinkedInAnalyzeResult;
  analyzedAt: string;
  hasAnalysis?: boolean;
  overallScore?: number;
  profileContent?: LinkedInProfileContent;
  sectionScores?: Record<
    string,
    {
      id?: string;
      name?: string;
      score?: number;
      status?: string;
      feedback?: string;
      tip?: string;
      priority?: string;
      recommendations?: string[];
      suggested_value?: string | null;
    }
  >;
};
