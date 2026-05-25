/** Stable task keys per UX stage — must match `STAGE_TASK_KEYS` in Django `unicoach_journey.py`. */
export const STAGE_TASK_KEYS: Record<string, readonly string[]> = {
  "call-1-prep": ["niche_worksheet", "resume_draft", "linkedin_headline_about"],
  "post-call-1": ["revise_resume", "linkedin_follow_through", "portfolio_tasks"],
  "call-2": ["shortlist_role", "submit_jd", "call2_quality_application"],
  "post-call-2": ["five_quality_applications", "branding_video", "branding_update"],
  "call-3": ["interview_targets", "interview_prep_worksheet", "call3_attended"],
  complete: ["weekly_execution", "coach_progress_update"],
};

export const UX_STAGE_ORDER = ["call-1-prep", "post-call-1", "call-2", "post-call-2", "call-3", "complete"] as const;

export type UxStageId = (typeof UX_STAGE_ORDER)[number];
