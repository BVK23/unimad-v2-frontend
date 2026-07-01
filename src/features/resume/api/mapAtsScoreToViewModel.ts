import { buildDisplayFeedback, buildFullFeedback, buildScoreLabel } from "./ats-section-display";
import type { AtsScorePayload, AtsScoreViewModel, AtsSectionKey, AtsSectionScore, AtsSectionUiStatus } from "./ats-types";

export const ATS_SECTION_ORDER: { key: AtsSectionKey; label: string }[] = [
  { key: "header", label: "Header" },
  { key: "profile", label: "Summary" },
  { key: "experience", label: "Experience" },
  { key: "skills", label: "Skills" },
  { key: "education", label: "Education" },
  { key: "projects", label: "Projects" },
  { key: "certifications", label: "Certifications" },
  { key: "formatting", label: "Formatting" },
];

const mapBackendStatusToUi = (status: string | undefined): AtsSectionUiStatus => {
  if (status === "strong") return "good";
  if (status === "needs_improvement") return "critical";
  return "warning";
};

const formatDeltaSuffix = (delta: number | undefined): string => {
  if (typeof delta !== "number" || !Number.isFinite(delta) || delta === 0) return "";
  return ` (${delta > 0 ? `+${delta}` : delta})`;
};

const rowFromSection = (
  key: AtsSectionKey,
  label: string,
  sec: AtsSectionScore | undefined,
  sectionDelta?: number
): AtsScoreViewModel["sectionAnalysis"][0] => {
  if (!sec) {
    return {
      key,
      name: label,
      status: "critical",
      displayFeedback: "Not analyzed.",
      fullFeedback: "Not analyzed.",
    };
  }
  const scoreSuffix = typeof sec.score === "number" && typeof sec.max_score === "number" ? ` (${sec.score}/${sec.max_score})` : "";
  const baseFeedback = typeof sec.feedback === "string" && sec.feedback.trim() ? sec.feedback : "—";
  const status = mapBackendStatusToUi(typeof sec.status === "string" ? sec.status : undefined);
  const deltaSuffix = formatDeltaSuffix(sectionDelta);
  return {
    key,
    name: label,
    status,
    displayFeedback: buildDisplayFeedback(baseFeedback, status, key),
    fullFeedback: buildFullFeedback(baseFeedback, scoreSuffix, deltaSuffix),
    scoreLabel: buildScoreLabel(sec.score, sec.max_score),
  };
};

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];

/**
 * Maps Django `ats_score` JSON to the shape used by ResumeEditor modal (dots + copy).
 */
export const mapAtsScoreToViewModel = (payload: AtsScorePayload | null | undefined): AtsScoreViewModel => {
  const raw = typeof payload?.overall_score === "number" ? payload.overall_score : Number(payload?.overall_score);
  const score = Number.isFinite(raw) ? Math.min(100, Math.max(0, Math.round(raw))) : 0;

  const improvements = stringList(payload?.improvements);
  const delta = payload?.delta;
  const section_scores = payload?.section_scores;
  const sectionDeltas = delta?.sections;

  const sectionAnalysis = ATS_SECTION_ORDER.map(({ key, label }) =>
    rowFromSection(key, label, section_scores?.[key], sectionDeltas?.[key])
  ).filter(row => row.fullFeedback !== "Not analyzed.");

  const generalRaw = payload?.general_score;
  const jdRaw = payload?.jd_match_score;

  const keywordsResolved = stringList(delta?.keywords_resolved?.length ? delta.keywords_resolved : payload?.keyword_resolved);
  const keywordsStillMissing = stringList(
    delta?.keywords_still_missing?.length ? delta.keywords_still_missing : (payload?.keyword_still_missing ?? payload?.missing_keywords)
  );

  return {
    score,
    scoringMode: payload?.scoring_mode,
    generalScore: typeof generalRaw === "number" && Number.isFinite(generalRaw) ? Math.round(generalRaw) : undefined,
    jdMatchScore: typeof jdRaw === "number" && Number.isFinite(jdRaw) ? Math.round(jdRaw) : undefined,
    improvements,
    sectionAnalysis,
    hasComparison: typeof delta?.overall_score === "number" && Number.isFinite(delta.overall_score),
    deltaOverall: typeof delta?.overall_score === "number" ? Math.round(delta.overall_score) : undefined,
    deltaGeneral: typeof delta?.general_score === "number" ? Math.round(delta.general_score) : undefined,
    deltaJdMatch: typeof delta?.jd_match_score === "number" ? Math.round(delta.jd_match_score) : undefined,
    deltaKeywordMatch: typeof delta?.keyword_match_percentage === "number" ? Math.round(delta.keyword_match_percentage) : undefined,
    comparisonResetReason: payload?.comparison_reset_reason ?? null,
    comparisonMessage: typeof payload?.comparison_message === "string" ? payload.comparison_message : null,
    scoreChangeSummary: typeof payload?.score_change_summary === "string" ? payload.score_change_summary : undefined,
    improvementsAddressed: stringList(payload?.improvements_addressed),
    improvementsStillOpen: stringList(payload?.improvements_still_open),
    keywordsResolved,
    keywordsStillMissing,
    previousSnapshot: payload?.previous_snapshot,
  };
};

export const formatAtsDeltaLabel = (delta: number | undefined): string | null => {
  if (typeof delta !== "number" || !Number.isFinite(delta) || delta === 0) return null;
  const prefix = delta > 0 ? "+" : "";
  return `${prefix}${delta} since last score`;
};
