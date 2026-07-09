/** Zustand / editor key for an unsaved scratch resume (not yet persisted). */
export const NEW_RESUME_DRAFT_ID = "__new_resume_draft__";

export function isPersistedResumeId(resumeId: string | undefined | null): boolean {
  if (!resumeId?.trim()) return false;
  return resumeId !== NEW_RESUME_DRAFT_ID;
}
