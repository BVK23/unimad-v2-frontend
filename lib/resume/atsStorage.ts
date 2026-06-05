import { RECALC_STORAGE_PREFIX } from './atsConstants';

export interface ResumeAtsSession {
  recalcAttemptsUsed: number;
  fixAllUsed: boolean;
}

const defaultSession = (): ResumeAtsSession => ({
  recalcAttemptsUsed: 0,
  fixAllUsed: false,
});

export function loadResumeAtsSession(resumeId: string): ResumeAtsSession {
  if (typeof window === 'undefined' || !resumeId) return defaultSession();
  try {
    const raw = localStorage.getItem(`${RECALC_STORAGE_PREFIX}${resumeId}`);
    if (!raw) return defaultSession();
    const parsed = JSON.parse(raw) as Partial<ResumeAtsSession>;
    return {
      recalcAttemptsUsed: Math.min(5, Math.max(0, parsed.recalcAttemptsUsed ?? 0)),
      fixAllUsed: Boolean(parsed.fixAllUsed),
    };
  } catch {
    return defaultSession();
  }
}

export function saveResumeAtsSession(resumeId: string, session: ResumeAtsSession): void {
  if (typeof window === 'undefined' || !resumeId) return;
  try {
    localStorage.setItem(`${RECALC_STORAGE_PREFIX}${resumeId}`, JSON.stringify(session));
  } catch {
    /* ignore quota errors */
  }
}
