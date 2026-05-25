import type { AtsScorePayload, AtsScoreViewModel, AtsSectionScore, AtsSectionUiStatus } from "./ats-types";

const SECTION_ORDER: { key: keyof NonNullable<AtsScorePayload["section_scores"]>; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "experience", label: "Experience" },
  { key: "skills", label: "Skills" },
  { key: "education", label: "Education" },
  { key: "projects", label: "Projects" },
];

const mapBackendStatusToUi = (status: string | undefined): AtsSectionUiStatus => {
  if (status === "strong") return "good";
  if (status === "needs_improvement") return "critical";
  return "warning";
};

const rowFromSection = (label: string, sec: AtsSectionScore | undefined): AtsScoreViewModel["sectionAnalysis"][0] => {
  if (!sec) {
    return {
      name: label,
      status: "critical",
      feedback: "Not analyzed.",
    };
  }
  return {
    name: label,
    status: mapBackendStatusToUi(typeof sec.status === "string" ? sec.status : undefined),
    feedback: typeof sec.feedback === "string" && sec.feedback.trim() ? sec.feedback : "—",
  };
};

/**
 * Maps Django `ats_score` JSON to the shape used by ResumeEditor modal (dots + copy).
 */
export const mapAtsScoreToViewModel = (payload: AtsScorePayload | null | undefined): AtsScoreViewModel => {
  const raw = typeof payload?.overall_score === "number" ? payload.overall_score : Number(payload?.overall_score);
  const score = Number.isFinite(raw) ? Math.min(100, Math.max(0, Math.round(raw))) : 0;

  const improvements = Array.isArray(payload?.improvements) ? payload.improvements.filter((s): s is string => typeof s === "string") : [];

  const section_scores = payload?.section_scores;
  const sectionAnalysis = SECTION_ORDER.map(({ key, label }) => rowFromSection(label, section_scores?.[key]));

  return {
    score,
    improvements,
    sectionAnalysis,
  };
};
