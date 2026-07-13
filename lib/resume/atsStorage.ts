import { RECALC_STORAGE_PREFIX } from "./atsConstants";

export interface ResumeAtsSession {
  recalcAttemptsUsed: number;
  fixAllUsed: boolean;
  /** ATS `scored_at` when Fix with Unibot was used — invalidates stale localStorage on id reuse. */
  fixUsedAtScoredAt?: string | null;
  /** Resume `updated_at` when fix was used — extra guard against stale browser state. */
  fixUsedAtResumeUpdatedAt?: string | null;
}

const defaultSession = (): ResumeAtsSession => ({
  recalcAttemptsUsed: 0,
  fixAllUsed: false,
  fixUsedAtScoredAt: null,
  fixUsedAtResumeUpdatedAt: null,
});

type LoadResumeAtsSessionOptions = {
  currentScoredAt?: string | null;
  currentResumeUpdatedAt?: string | null;
};

function isFixSessionValid(parsed: Partial<ResumeAtsSession>, options: LoadResumeAtsSessionOptions): boolean {
  if (!parsed.fixAllUsed) return false;
  const storedScoredAt = parsed.fixUsedAtScoredAt?.trim();
  if (!storedScoredAt) return false;

  const currentScoredAt = options.currentScoredAt?.trim();
  if (!currentScoredAt || storedScoredAt !== currentScoredAt) return false;

  const storedResumeUpdatedAt = parsed.fixUsedAtResumeUpdatedAt?.trim();
  const currentResumeUpdatedAt = options.currentResumeUpdatedAt?.trim();
  if (storedResumeUpdatedAt && currentResumeUpdatedAt && storedResumeUpdatedAt !== currentResumeUpdatedAt) {
    return false;
  }

  return true;
}

export function loadResumeAtsSession(resumeId: string, options: LoadResumeAtsSessionOptions = {}): ResumeAtsSession {
  if (typeof window === "undefined" || !resumeId) return defaultSession();
  try {
    const raw = localStorage.getItem(`${RECALC_STORAGE_PREFIX}${resumeId}`);
    if (!raw) return defaultSession();
    const parsed = JSON.parse(raw) as Partial<ResumeAtsSession>;
    const fixAllUsed = isFixSessionValid(parsed, options);
    return {
      recalcAttemptsUsed: Math.min(5, Math.max(0, parsed.recalcAttemptsUsed ?? 0)),
      fixAllUsed,
      fixUsedAtScoredAt: fixAllUsed ? (parsed.fixUsedAtScoredAt ?? null) : null,
      fixUsedAtResumeUpdatedAt: fixAllUsed ? (parsed.fixUsedAtResumeUpdatedAt ?? null) : null,
    };
  } catch {
    return defaultSession();
  }
}

export function saveResumeAtsSession(resumeId: string, session: ResumeAtsSession): void {
  if (typeof window === "undefined" || !resumeId) return;
  try {
    localStorage.setItem(`${RECALC_STORAGE_PREFIX}${resumeId}`, JSON.stringify(session));
  } catch {
    /* ignore quota errors */
  }
}
