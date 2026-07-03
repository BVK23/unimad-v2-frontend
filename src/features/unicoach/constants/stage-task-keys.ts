/** Stable task keys per UX module — must match `STAGE_TASK_KEYS` in Django `unicoach_stage_schema.py`. */
export const STAGE_TASK_KEYS: Record<string, readonly string[]> = {
  "call-1": ["fix_your_role", "build_your_resume", "personalised_job_search_strategy"],
  "call-2": ["change_dp", "change_banner", "change_headline", "change_about_section", "add_two_recommendations"],
  "call-3": ["publish_resume", "add_other_achievements", "film_intro_video", "humanise_portfolio", "set_up_booking_link"],
  "call-4": ["interview_preparation", "watch_vpd_session", "follow_the_system"],
};

export const UX_STAGE_ORDER = ["call-1", "call-2", "call-3", "call-4"] as const;

export type UxStageId = (typeof UX_STAGE_ORDER)[number];
