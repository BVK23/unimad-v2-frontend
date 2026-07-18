/**
 * Backend ATS payload shape from POST /api/resume/ats-score/ (`ats_score` field).
 * LLM output may omit optional fields.
 */
export type AtsSectionBackendStatus = "strong" | "good" | "needs_improvement";

export interface AtsSectionScore {
  score?: number;
  max_score?: number;
  status?: AtsSectionBackendStatus | string;
  feedback?: string;
}

export type AtsScoringMode = "general_only" | "jd_blended";

export type AtsWeightProfile = "fresh_graduate" | "standard";

export type AtsComparisonResetReason = "jd_changed";

export interface AtsScoreDelta {
  overall_score?: number;
  general_score?: number;
  jd_match_score?: number;
  keyword_match_percentage?: number;
  sections?: Partial<Record<keyof NonNullable<AtsScorePayload["section_scores"]>, number>>;
  keywords_resolved?: string[];
  keywords_still_missing?: string[];
}

export interface AtsPreviousSnapshot {
  overall_score?: number;
  general_score?: number;
  jd_match_score?: number;
  scored_at?: string | null;
}

export interface AtsScorePayload {
  overall_score?: number;
  general_score?: number;
  jd_match_score?: number;
  scoring_mode?: AtsScoringMode;
  score_version?: number;
  weight_profile?: AtsWeightProfile;
  weights?: { general?: number; jd?: number };
  keyword_match_percentage?: number;
  missing_keywords?: string[];
  jd_fingerprint?: string;
  application_id?: string;
  comparison_reset_reason?: AtsComparisonResetReason | null;
  comparison_message?: string | null;
  delta?: AtsScoreDelta;
  previous_snapshot?: AtsPreviousSnapshot;
  improvements_addressed?: string[];
  improvements_still_open?: string[];
  improvements_partial?: string[];
  score_change_summary?: string;
  keyword_resolved?: string[];
  keyword_still_missing?: string[];
  section_scores?: {
    header?: AtsSectionScore;
    profile?: AtsSectionScore;
    experience?: AtsSectionScore;
    skills?: AtsSectionScore;
    education?: AtsSectionScore;
    projects?: AtsSectionScore;
    certifications?: AtsSectionScore;
    formatting?: AtsSectionScore;
  };
  improvements?: string[];
}

export type AtsSectionUiStatus = "good" | "warning" | "critical";

export type AtsSectionKey = keyof NonNullable<AtsScorePayload["section_scores"]>;

export interface AtsSectionAnalysisRow {
  key: AtsSectionKey;
  name: string;
  status: AtsSectionUiStatus;
  /** Short one-line copy for the modal. */
  displayFeedback: string;
  /** Full analysis for Unibot context (includes score suffix and delta). */
  fullFeedback: string;
  /** Shown on status-dot hover only, e.g. "4/5" or "62/100". */
  scoreLabel?: string;
}

export interface AtsScoreViewModel {
  score: number;
  scoringMode?: AtsScoringMode;
  generalScore?: number;
  jdMatchScore?: number;
  /** Hybrid keyword coverage % (JD mode). */
  keywordMatchPercentage?: number;
  improvements: string[];
  sectionAnalysis: AtsSectionAnalysisRow[];
  hasComparison?: boolean;
  deltaOverall?: number;
  deltaGeneral?: number;
  deltaJdMatch?: number;
  deltaKeywordMatch?: number;
  comparisonResetReason?: AtsComparisonResetReason | null;
  comparisonMessage?: string | null;
  scoreChangeSummary?: string;
  improvementsAddressed: string[];
  improvementsStillOpen: string[];
  keywordsResolved: string[];
  keywordsStillMissing: string[];
  previousSnapshot?: AtsPreviousSnapshot;
}

/** Metadata returned with cached or freshly calculated ATS scores. */
export type AtsScoreMeta = {
  scored_at: string | null;
  resume_updated_at: string | null;
  ats_calc_count: number;
  from_cache: boolean;
  score_stale?: boolean;
  history_count?: number;
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
