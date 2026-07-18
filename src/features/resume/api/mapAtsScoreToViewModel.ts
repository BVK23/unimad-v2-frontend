import { buildDisplayFeedback, buildFullFeedback, buildScoreLabel, sanitizeProfileFeedback } from "./ats-section-display";
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

const SECTION_TIP_PATTERNS: Partial<Record<AtsSectionKey, RegExp>> = {
  header: /\b(header|email|phone|contact|linkedin|github|portfolio link)\b/i,
  profile: /\b(summary|professional summary|first sentence|filler|quantified differentiator)\b/i,
  experience: /\b(experience|bullet|role|action verb|xyz formula|quantify more experience)\b/i,
  skills: /\b(skills?|categoris|categoriz|soft-skill|keyword coverage)\b/i,
  education: /\b(education|degree|institution|coursework|graduation)\b/i,
  projects: /\b(projects?|project descriptions?)\b/i,
  certifications: /\b(certifications?|issuer)\b/i,
  formatting: /\b(date format|formatting|layout|section order)\b/i,
};

const mapBackendStatusToUi = (status: string | undefined): AtsSectionUiStatus => {
  if (status === "strong") return "good";
  if (status === "needs_improvement") return "critical";
  return "warning";
};

const formatDeltaSuffix = (delta: number | undefined): string => {
  if (typeof delta !== "number" || !Number.isFinite(delta) || delta === 0) return "";
  return ` (${delta > 0 ? `+${delta}` : delta})`;
};

const sectionHasOpenTip = (key: AtsSectionKey, improvements: string[]): boolean => {
  const pattern = SECTION_TIP_PATTERNS[key];
  if (!pattern) return false;
  return improvements.some(tip => pattern.test(tip));
};

const coerceStatus = (status: AtsSectionUiStatus, key: AtsSectionKey, improvements: string[]): AtsSectionUiStatus => {
  if (status === "good" && sectionHasOpenTip(key, improvements)) {
    return "warning";
  }
  return status;
};

const rowFromSection = (
  key: AtsSectionKey,
  label: string,
  sec: AtsSectionScore | undefined,
  sectionDelta: number | undefined,
  improvements: string[]
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
  let baseFeedback = typeof sec.feedback === "string" && sec.feedback.trim() ? sec.feedback : "—";
  let status = mapBackendStatusToUi(typeof sec.status === "string" ? sec.status : undefined);
  status = coerceStatus(status, key, improvements);
  if (key === "profile") {
    baseFeedback = sanitizeProfileFeedback(baseFeedback, status);
  }
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
    rowFromSection(key, label, section_scores?.[key], sectionDeltas?.[key], improvements)
  ).filter(row => row.fullFeedback !== "Not analyzed.");

  const generalRaw = payload?.general_score;
  const jdRaw = payload?.jd_match_score;
  const keywordRaw = payload?.keyword_match_percentage;

  const keywordsResolved = stringList(delta?.keywords_resolved?.length ? delta.keywords_resolved : payload?.keyword_resolved);
  const keywordsStillMissing = stringList(
    delta?.keywords_still_missing?.length ? delta.keywords_still_missing : (payload?.keyword_still_missing ?? payload?.missing_keywords)
  );
  // First-run JD ledger: show missing keywords even without a comparison delta.
  const firstRunMissing = stringList(payload?.missing_keywords);

  return {
    score,
    scoringMode: payload?.scoring_mode,
    generalScore: typeof generalRaw === "number" && Number.isFinite(generalRaw) ? Math.round(generalRaw) : undefined,
    jdMatchScore: typeof jdRaw === "number" && Number.isFinite(jdRaw) ? Math.round(jdRaw) : undefined,
    keywordMatchPercentage: typeof keywordRaw === "number" && Number.isFinite(keywordRaw) ? Math.round(keywordRaw) : undefined,
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
    keywordsStillMissing: keywordsStillMissing.length > 0 ? keywordsStillMissing : firstRunMissing,
    previousSnapshot: payload?.previous_snapshot,
  };
};

export const formatAtsDeltaLabel = (delta: number | undefined): string | null => {
  if (typeof delta !== "number" || !Number.isFinite(delta) || delta === 0) return null;
  const prefix = delta > 0 ? "+" : "";
  return `${prefix}${delta} since last score`;
};

/** Hero quote: only call out sections that are actually weak (G4f). */
export const getAtsHeroFocusSections = (vm: AtsScoreViewModel): string[] =>
  vm.sectionAnalysis.filter(row => row.status !== "good").map(row => row.name);
