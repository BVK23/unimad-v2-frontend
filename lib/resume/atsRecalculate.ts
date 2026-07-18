import { MAX_RECALCULATIONS } from "./atsConstants";

export type AtsRecalculateBlockReason = "limit_reached" | "unsaved_changes" | "no_changes_since_score" | "missing_timestamps";

export type AtsRecalculateState = {
  allowed: boolean;
  reason: AtsRecalculateBlockReason | null;
  message: string | null;
};

function toTimestamp(value: string | Date | null | undefined): number | null {
  if (value == null) return null;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function getAtsRecalculateState(params: {
  scoredAt: string | null | undefined;
  resumeUpdatedAt: string | Date | null | undefined;
  atsCalcCount: number;
  hasUnsavedChanges?: boolean;
  scoreStale?: boolean;
}): AtsRecalculateState {
  if (params.atsCalcCount >= MAX_RECALCULATIONS) {
    return {
      allowed: false,
      reason: "limit_reached",
      message: `You've used all ${MAX_RECALCULATIONS} score calculations for this resume.`,
    };
  }

  if (params.hasUnsavedChanges) {
    return {
      allowed: false,
      reason: "unsaved_changes",
      message: "Save your resume before recalculating your ATS score.",
    };
  }

  // Older-rubric scores may always be recalculated (matches the server gate).
  if (params.scoreStale) {
    return { allowed: true, reason: null, message: null };
  }

  const scoredMs = toTimestamp(params.scoredAt);
  const updatedMs = toTimestamp(params.resumeUpdatedAt);

  if (params.atsCalcCount <= 0 && scoredMs == null) {
    return { allowed: true, reason: null, message: null };
  }

  if (scoredMs == null || updatedMs == null) {
    return {
      allowed: false,
      reason: "missing_timestamps",
      message: "Unable to verify resume changes. Save your resume and try again.",
    };
  }

  if (updatedMs > scoredMs) {
    return { allowed: true, reason: null, message: null };
  }

  return {
    allowed: false,
    reason: "no_changes_since_score",
    message: "No resume changes since your last score. Edit and save your resume to recalculate.",
  };
}
