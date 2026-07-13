/**
 * Unicoach journey API contracts (aligned with Django journey-state / advance).
 */

export type UnicoachAccessLevel = "full" | "partial" | string;

export type UnicoachStudentMeta = {
  program_start_date: string | null;
  closed_by: string | null;
  conversion_mode: string | null;
};

export type UnicoachSubscriptionSummary = {
  program_label: string;
  access_level: string;
  plan_ids: string[];
  modules: string[];
  purchases: string[];
  total_paid_gbp: number;
  currency: string;
};

export type JourneyTargetProfile = {
  id: number;
  name: string;
  email: string;
  phone_number?: string | null;
  role?: string | null;
  desired_roles?: string[] | null;
  linkedin_url?: string | null;
  city?: string | null;
  country?: string | null;
  location_display?: string | null;
  profile_picture?: string | null;
  joined_at?: string | null;
};

export type JourneyChatPeers = {
  coach: { id: number; name?: string | null; profile_picture?: string | null } | null;
  student: { id: number; name?: string | null; profile_picture?: string | null };
};

export type JourneyChecklistBucket = Record<
  string,
  { completed?: boolean; completed_at?: string | null; metadata?: Record<string, unknown>; source?: string }
>;

export type JourneyChecklist = {
  schema_version?: number;
  tasks?: Record<string, JourneyChecklistBucket>;
  gates?: { prepare_for_interview_at?: string | null; interview_ready_confirmed_at?: string | null };
  execution_tracker?: ExecutionTracker;
} & Record<string, JourneyChecklistBucket | unknown>;

export type ExecutionTracker = {
  quality_application_ids?: string[];
  quantity_applications_count?: number;
  connections_count?: number;
  comments_count?: number;
  post_dates?: string[];
  daily_log?: Record<string, DailyExecutionDayEntry | Record<string, unknown>>;
};

export type DailyExecutionItemKey =
  | "quality_applications"
  | "quantity_applications"
  | "connections"
  | "comments"
  | "posts"
  | "interview_prep"
  | "vpd";

export type DailyExecutionDayEntry = {
  /** Tasks placed on this day (week view drag-drop). Day view lists all items with counters. */
  tasks?: DailyExecutionItemKey[];
  counts?: Partial<Record<DailyExecutionItemKey, number>>;
};

export type JourneyFlags = {
  call_1_completed?: boolean;
  portfolio_done?: boolean;
  show_coach_working_on_portfolio?: boolean;
  max_unlocked_stage?: string;
  booking_key?: string | null;
  interview_ready_confirmed_at?: string | null;
  interview_confirm_enabled?: boolean;
  prepare_for_interview_at?: string | null;
  prepare_for_interview_enabled?: boolean;
  prepare_for_interview_block_reason?: string | null;
  show_booking?: boolean;
  booking_block_reason?: string | null;
  /** Module id where the book-next-call CTA should render (may differ from ux_stage). */
  booking_stage_id?: string | null;
  has_interview_stage_application?: boolean;
};

export type StageTaskMeta = {
  key: string;
  label: string;
  completer: string;
  editable: boolean;
  disabled_reason?: string | null;
};

export type StageDefinitionPayload = {
  id: string;
  has_dashboard?: boolean;
  booking?: string | null;
  /** Shown once below the checklist when a whole-module gate blocks edits (e.g. call-3). */
  stage_gate_reason?: string | null;
  tasks_meta?: StageTaskMeta[];
};

export type JourneyState = {
  ux_stage: string;
  max_unlocked_stage?: string;
  unicoach_access_level: UnicoachAccessLevel;
  program_chosen?: string | null;
  program_access_level?: string | null;
  subscription_summary?: UnicoachSubscriptionSummary | null;
  journey_checklist: JourneyChecklist;
  stage_task_keys: Record<string, string[]>;
  stage_definitions?: Record<string, StageDefinitionPayload>;
  stage_checklist_complete: boolean;
  journey_flags?: JourneyFlags;
  execution_tracker?: ExecutionTracker;
  calls: Record<string, unknown>;
  next_call_to_enable: unknown;
  booking_links: Record<string, string>;
  booking_url_for_stage: string | null;
  comment_section: string | null | undefined;
  primary_action: string;
  viewer_profile_id?: number;
  student_meta?: UnicoachStudentMeta;
  journey_target_profile?: JourneyTargetProfile;
  chat_peers?: JourneyChatPeers;
};

export type AssignedStudent = {
  id: number;
  name: string;
  email: string;
  phone_number?: string | null;
  linkedin_url?: string | null;
  role?: string | null;
  desired_roles?: string[] | null;
  location_display?: string | null;
  /** UnicoachStudentData.created_at — used when program_start_date is unset. */
  enrolled_at?: string | null;
  program_start_date?: string | null;
  ux_stage?: string | null;
  program_label?: string | null;
  program_chosen?: string | null;
  program_access_level?: string | null;
  plan_ids?: string[];
  linkedin_profile_picture?: string | null;
  unimad_profile_picture?: string | null;
  google_profile_picture?: string | null;
  profile_picture?: string | null;
  unread_counts?: Record<string, number>;
  has_unread?: boolean;
};

export type CoachData = {
  coach_name: string;
  coach_email: string;
  coach_profile_picture?: string | null;
  assigned_users: AssignedStudent[];
};

export type UnicoachStudentsByStage = Record<string, AssignedStudent[]>;

export type UnicoachInitResponse = {
  subscribed?: boolean;
  coach_data?: CoachData | unknown;
  is_being_impersonated?: boolean;
  user_unread_counts?: Record<string, number>;
  error?: string;
};

export type UnicoachProfileInfo = {
  User: Record<string, { name?: string; profile_picture?: string | null }>;
  coaches: Record<string, { name?: string; profile_picture?: string | null; email?: string }>;
  calls: Record<string, unknown>;
  next_call_to_enable: unknown;
  pending_feedback_for_call?: unknown;
};

export type UnicoachCommentRow = {
  id: number;
  section_name: string;
  message: string;
  sender_id: number;
  created_at: string;
  is_edited?: boolean;
  edited_at?: string | null;
};

export type UnicoachCommentsResponse = {
  comments: UnicoachCommentRow[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
};

export function parseCoachData(init: UnicoachInitResponse): CoachData | null {
  const raw = init.coach_data;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.coach_name !== "string" || typeof o.coach_email !== "string") return null;
  const assigned = Array.isArray(o.assigned_users) ? (o.assigned_users as AssignedStudent[]) : [];
  return {
    coach_name: o.coach_name,
    coach_email: o.coach_email,
    coach_profile_picture: typeof o.coach_profile_picture === "string" ? o.coach_profile_picture : null,
    assigned_users: assigned,
  };
}
