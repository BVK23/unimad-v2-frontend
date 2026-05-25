/**
 * Backend ATS payload shape from POST /api/resume/ats-score/ (`ats_score` field).
 * LLM output may omit optional fields.
 */
export type AtsSectionBackendStatus = "strong" | "good" | "needs_improvement";

export interface AtsSectionScore {
  score?: number;
  status?: AtsSectionBackendStatus | string;
  feedback?: string;
}

export interface AtsScorePayload {
  overall_score?: number;
  keyword_match_percentage?: number;
  missing_keywords?: string[];
  section_scores?: {
    profile?: AtsSectionScore;
    experience?: AtsSectionScore;
    skills?: AtsSectionScore;
    education?: AtsSectionScore;
    projects?: AtsSectionScore;
  };
  improvements?: string[];
}

export type AtsSectionUiStatus = "good" | "warning" | "critical";

export interface AtsScoreViewModel {
  score: number;
  improvements: string[];
  sectionAnalysis: {
    name: string;
    status: AtsSectionUiStatus;
    feedback: string;
  }[];
}

/** Metadata returned with cached or freshly calculated ATS scores. */
export type AtsScoreMeta = {
  scored_at: string | null;
  ats_calc_count: number;
  from_cache: boolean;
};

export type ResumeAtsCacheResult =
  | ({
      ok: true;
      ats_score: AtsScorePayload | null;
      resume_id: string;
    } & AtsScoreMeta)
  | { ok: false; error: string; status: number };

export type CalculateAtsScoreResult =
  | ({
      ok: true;
      ats_score: AtsScorePayload;
      resume_id: string;
      application_id?: string;
      role?: string;
      company?: string;
    } & AtsScoreMeta)
  | { ok: false; error: string; status: number; code?: string };
