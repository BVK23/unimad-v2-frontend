/** Stable task keys per UX stage — must match `STAGE_TASK_KEYS` in Django `unicoach_journey.py`. */
export const STAGE_TASK_KEYS: Record<string, readonly string[]> = {
  "call-1-prep": ["add_education", "add_skills", "add_work_experiences", "answer_questions", "research_niche_activity"],
  "post-call-1": [
    "revise_resume",
    "publish_resume",
    "add_other_achievements",
    "record_video",
    "revise_portfolio",
    "fill_phone_number",
    "shortlist_applications",
    "create_calendly_account",
  ],
  "call-2": ["one_quality_application", "linkedin_optimisation"],
  "post-call-2": [
    "change_dp",
    "change_cover_pic",
    "change_headline",
    "change_about_section",
    "change_profile_picture",
    "add_recommendations",
    "complete_personal_branding_video",
  ],
  "call-3": ["checkin_about_programme", "application_roadmap_90_day"],
  complete: ["interview_preparation", "watch_vpd_session", "follow_the_system"],
};

export const UX_STAGE_ORDER = ["call-1-prep", "post-call-1", "call-2", "post-call-2", "call-3", "complete"] as const;

export type UxStageId = (typeof UX_STAGE_ORDER)[number];
