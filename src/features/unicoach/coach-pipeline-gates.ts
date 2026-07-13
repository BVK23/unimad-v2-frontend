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

export type CoachMoveGate = "payment" | "offer_confirm" | "refund_details" | "backward_confirm" | "skip_confirm" | "blocked" | null;

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
  refundedAt?: string | null;
  paymentJustRecorded?: boolean;
}): CoachMoveEvaluation {
  const {
    fromStage,
    toStage,
    entitlement,
    confirmOffer = false,
    confirmBackward = false,
    confirmSkip = false,
    refundedAt = null,
    paymentJustRecorded = false,
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

  if (paymentJustRecorded) return { allowed: true, gate: null, message: "" };

  if (kind === "full" || kind === "legacy_full") {
    if (toIdx < fromIdx && !confirmBackward) {
      return {
        allowed: false,
        gate: "backward_confirm",
        message: "Moving a student back may change their module access and clear later milestones. Continue?",
      };
    }
    if (toIdx - fromIdx > 1 && !confirmSkip) {
      return {
        allowed: false,
        gate: "skip_confirm",
        message: "You are skipping one or more stages. Continue?",
      };
    }
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

  if (toIdx - fromIdx > 1 && !confirmSkip) {
    return {
      allowed: false,
      gate: "skip_confirm",
      message: "You are skipping one or more stages. Continue?",
    };
  }

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
