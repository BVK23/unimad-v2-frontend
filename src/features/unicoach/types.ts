/**
 * Unicoach journey API contracts (aligned with Django journey-state / advance).
 */

export type UnicoachAccessLevel = "full" | "partial" | string;

export type UnicoachStudentMeta = {
  program_start_date: string | null;
  closed_by: string | null;
  conversion_mode: string | null;
};

export type JourneyTargetProfile = {
  id: number;
  name: string;
  email: string;
  phone_number?: string | null;
  role?: string | null;
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
  gates?: { prepare_for_interview_at?: string | null };
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
  portfolio_done?: boolean;
  show_coach_working_on_portfolio?: boolean;
  max_unlocked_stage?: string;
  booking_key?: string | null;
  prepare_for_interview_at?: string | null;
  prepare_for_interview_enabled?: boolean;
  prepare_for_interview_block_reason?: string | null;
  show_booking?: boolean;
  booking_block_reason?: string | null;
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
  tasks_meta?: StageTaskMeta[];
};

export type JourneyState = {
  ux_stage: string;
  max_unlocked_stage?: string;
  unicoach_access_level: UnicoachAccessLevel;
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
  todos: UnicoachTodo[];
  calls: Record<string, unknown>;
  next_call_to_enable: unknown;
  pending_feedback_for_call?: unknown;
};

export type UnicoachTodo = {
  id?: string;
  title?: string;
  description?: string;
  isCompleted?: boolean;
  section_name?: string;
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
