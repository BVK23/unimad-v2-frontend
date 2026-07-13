/** Client-side mirror of Django `unicoach_coach_moves.evaluate_coach_pipeline_move`. */
import { COACH_PIPELINE_ORDER, MOUNTAIN_GRAPH_ORDER, type CoachPipelineStage } from "@/constants/unicoach-coach-pipeline";

export type CoachEntitlementKind = "full" | "partial" | "module" | "vsl_discovery" | "legacy_full";

export type CoachStudentEntitlement = {
  kind: CoachEntitlementKind;
  plan_ids: string[];
  max_free_stage: CoachPipelineStage | "completed";
  max_free_index: number;
  can_refund: boolean;
  has_paid: boolean;
  total_paid_gbp?: number;
};

export type CoachMoveGate =
  | "payment"
  | "offer_confirm"
  | "refund_details"
  | "backward_confirm"
  | "skip_confirm"
  | "same_day_confirm"
  | "blocked"
  | null;

export type CoachMoveEvaluation = {
  allowed: boolean;
  gate: CoachMoveGate;
  message: string;
};

const MOUNTAIN_INDEX: Record<string, number> = Object.fromEntries(MOUNTAIN_GRAPH_ORDER.map((s, i) => [s, i]));

function mountainIndex(stage: string): number {
  if (stage === "interviewing") return MOUNTAIN_INDEX.call_4 ?? 4;
  if (stage in MOUNTAIN_INDEX) return MOUNTAIN_INDEX[stage];
  if (stage === "offered" || stage === "refunded") return MOUNTAIN_GRAPH_ORDER.length;
  return 0;
}

function callDone(calls: Record<string, unknown> | null | undefined, key: string): boolean {
  if (!calls) return false;
  const bucket = (calls[key] ?? {}) as Record<string, unknown>;
  if (key === "call_1") return Boolean(bucket.call_completed || bucket.completed);
  return Boolean(bucket.completed);
}

function parseCallDate(raw: unknown): Date | null {
  if (typeof raw !== "string" || !raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function callCompletedToday(calls: Record<string, unknown> | null | undefined, fromStage: string): boolean {
  if (!calls || !["call_1", "call_2", "call_3", "call_4"].includes(fromStage)) return false;
  const bucket = (calls[fromStage] ?? {}) as Record<string, unknown>;
  const stamp = bucket.call_completed_at ?? bucket.completed_at;
  const dt = parseCallDate(stamp);
  if (!dt) return false;
  const now = new Date();
  return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth() && dt.getDate() === now.getDate();
}

function moveSkipsUnmarkedCall(fromStage: string, toStage: string, calls: Record<string, unknown> | null | undefined): boolean {
  if (!["call_2", "call_3", "call_4", "completed", "interviewing", "offered"].includes(toStage)) return false;

  if (["call_4", "completed", "interviewing", "offered"].includes(toStage)) {
    if (callDone(calls, "call_2") && !callDone(calls, "call_3")) return true;
    if (callDone(calls, "call_1") && !callDone(calls, "call_2") && (fromStage === "call_1" || fromStage === "not_started")) {
      return mountainIndex(toStage) - mountainIndex(fromStage) > 1;
    }
  }
  if (toStage === "call_3" && callDone(calls, "call_1") && !callDone(calls, "call_2")) {
    return mountainIndex(toStage) - mountainIndex(fromStage) > 1;
  }
  return false;
}

export function entitlementFromAccess(
  accessLevel: string | null | undefined,
  planIds: string[] | null | undefined = [],
  totalPaidGbp = 0
): CoachStudentEntitlement {
  const plans = planIds ?? [];
  const hasFull =
    plans.includes("unicoach_program") ||
    (plans.includes("unicoach_partial_1_of_2") && plans.includes("unicoach_partial_2_of_2")) ||
    accessLevel === "full";
  const hasPartialOnly = !hasFull && (plans.includes("unicoach_partial_1_of_2") || accessLevel === "partial");
  const modules = plans.filter(p => p.startsWith("unicoach_call_"));

  if (hasFull || accessLevel === "full") {
    return {
      kind: accessLevel === "full" && plans.length === 0 ? "legacy_full" : "full",
      plan_ids: plans,
      max_free_stage: "completed",
      max_free_index: MOUNTAIN_INDEX.completed ?? 5,
      can_refund: true,
      has_paid: true,
      total_paid_gbp: totalPaidGbp,
    };
  }
  if (hasPartialOnly) {
    return {
      kind: "partial",
      plan_ids: plans,
      max_free_stage: "call_2",
      max_free_index: MOUNTAIN_INDEX.call_2 ?? 2,
      can_refund: totalPaidGbp > 0 || plans.length > 0,
      has_paid: true,
      total_paid_gbp: totalPaidGbp,
    };
  }
  if (modules.length > 0 || accessLevel === "module") {
    let max: CoachPipelineStage = "call_1";
    if (modules.includes("unicoach_call_2")) max = "call_2";
    if (modules.includes("unicoach_call_3")) max = "call_3";
    if (modules.includes("unicoach_call_4")) max = "call_4";
    return {
      kind: "module",
      plan_ids: plans,
      max_free_stage: max,
      max_free_index: mountainIndex(max),
      can_refund: true,
      has_paid: true,
      total_paid_gbp: totalPaidGbp,
    };
  }
  if (accessLevel === "vsl_discovery") {
    return {
      kind: "vsl_discovery",
      plan_ids: plans,
      max_free_stage: "call_1",
      max_free_index: MOUNTAIN_INDEX.call_1 ?? 1,
      can_refund: false,
      has_paid: false,
      total_paid_gbp: totalPaidGbp,
    };
  }
  return {
    kind: "legacy_full",
    plan_ids: plans,
    max_free_stage: "completed",
    max_free_index: MOUNTAIN_INDEX.completed ?? 5,
    can_refund: true,
    has_paid: true,
    total_paid_gbp: totalPaidGbp,
  };
}

export function evaluateCoachPipelineMove(params: {
  fromStage: string;
  toStage: string;
  entitlement: CoachStudentEntitlement;
  confirmOffer?: boolean;
  confirmBackward?: boolean;
  confirmSkip?: boolean;
  confirmSameDay?: boolean;
  refundedAt?: string | null;
  paymentJustRecorded?: boolean;
  callsData?: Record<string, unknown> | null;
}): CoachMoveEvaluation {
  const {
    fromStage,
    toStage,
    entitlement,
    confirmOffer = false,
    confirmBackward = false,
    confirmSkip = false,
    confirmSameDay = false,
    refundedAt = null,
    paymentJustRecorded = false,
    callsData = null,
  } = params;

  if (!(COACH_PIPELINE_ORDER as readonly string[]).includes(toStage)) {
    return { allowed: false, gate: "blocked", message: "Invalid pipeline stage." };
  }

  const fromIdx = mountainIndex(fromStage);
  const toIdx = mountainIndex(toStage);
  const maxFree = entitlement.max_free_index;
  const kind = entitlement.kind;

  if (toStage === "offered") {
    if (confirmOffer) return { allowed: true, gate: null, message: "" };
    return {
      allowed: false,
      gate: "offer_confirm",
      message: "Confirm this student has landed a role before marking Offered.",
    };
  }

  if (toStage === "refunded") {
    if (!entitlement.can_refund) {
      return {
        allowed: false,
        gate: "blocked",
        message: "This student has no payment on record, so they cannot be marked Refunded.",
      };
    }
    if (!refundedAt) {
      return {
        allowed: false,
        gate: "refund_details",
        message: "Record when the refund was issued, then continue.",
      };
    }
    return { allowed: true, gate: null, message: "" };
  }

  const forwardConfirms = (): CoachMoveEvaluation | null => {
    const skips = toIdx - fromIdx > 1 || moveSkipsUnmarkedCall(fromStage, toStage, callsData);
    if (skips && !confirmSkip) {
      return {
        allowed: false,
        gate: "skip_confirm",
        message: "You are skipping one or more stages (a call in between is not marked complete). Continue?",
      };
    }
    if (toIdx > fromIdx && !confirmSameDay && callCompletedToday(callsData, fromStage)) {
      return {
        allowed: false,
        gate: "same_day_confirm",
        message:
          "You already marked a call complete for this student today. Are you sure you want to move them forward again on the same day?",
      };
    }
    return null;
  };

  if (paymentJustRecorded) {
    const confirm = forwardConfirms();
    if (confirm) return confirm;
    return { allowed: true, gate: null, message: "" };
  }

  if (kind === "full" || kind === "legacy_full") {
    if (toIdx < fromIdx && !confirmBackward) {
      return {
        allowed: false,
        gate: "backward_confirm",
        message: "Moving a student back may change their module access and clear later milestones. Continue?",
      };
    }
    const confirm = forwardConfirms();
    if (confirm) return confirm;
    return { allowed: true, gate: null, message: "" };
  }

  if (kind === "vsl_discovery") {
    if (toStage === "not_started" || toStage === "call_1") {
      if (toIdx < fromIdx && !confirmBackward) {
        return {
          allowed: false,
          gate: "backward_confirm",
          message: "Move this student back to an earlier stage?",
        };
      }
      return { allowed: true, gate: null, message: "" };
    }
    return {
      allowed: false,
      gate: "payment",
      message: "This student has not subscribed beyond Discovery. Record a payment to enroll them before moving past Discovery call.",
    };
  }

  if (toIdx > maxFree) {
    return {
      allowed: false,
      gate: "payment",
      message: "This student is not entitled to that stage yet. Record a payment (remaining installment or next module) to continue.",
    };
  }

  if (toIdx < fromIdx && !confirmBackward) {
    return {
      allowed: false,
      gate: "backward_confirm",
      message: "Moving a student back may affect their access. Are you sure?",
    };
  }

  const confirm = forwardConfirms();
  if (confirm) return confirm;

  return { allowed: true, gate: null, message: "" };
}

export const MANUAL_PAYMENT_PLAN_OPTIONS = [
  { value: "unicoach_program", label: "Full program" },
  { value: "unicoach_partial_1_of_2", label: "Partial — 1st installment" },
  { value: "unicoach_partial_2_of_2", label: "Partial — 2nd installment" },
  { value: "unicoach_call_2", label: "LinkedIn Branding only" },
  { value: "unicoach_call_3", label: "Application Strategy only" },
  { value: "unicoach_call_4", label: "Interview Mastery only" },
] as const;
