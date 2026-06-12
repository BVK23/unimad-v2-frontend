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

export type LinkedInAnalyzerErrorCode =
  | "LINKEDIN_URL_INVALID"
  | "LINKEDIN_URL_MISSING"
  | "PROFILE_NOT_FOUND"
  | "EMPTY_PROFILE"
  | "SCRAPER_UNAVAILABLE"
  | "SERVICE_MISCONFIGURED"
  | "UPSTREAM_ERROR"
  | "ANALYSIS_FAILED"
  | "ANALYZE_ERROR"
  | "NO_PROFILE"
  | (string & {});

export type LinkedInAnalyzerFailure = {
  success: false;
  error: string;
  code?: LinkedInAnalyzerErrorCode;
};

export type LinkedInAnalyzerSuccess<T> = {
  success: true;
  data: T;
};

export type LinkedInAnalyzerResult<T> = LinkedInAnalyzerSuccess<T> | LinkedInAnalyzerFailure;

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
