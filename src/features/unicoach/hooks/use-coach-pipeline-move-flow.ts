"use client";

import { useCallback, useState } from "react";
import type { RecordPaymentPayload } from "@/components/unicoach/UnicoachCoachRecordPaymentModal";
import type { CoachPipelineStage } from "@/constants/unicoach-coach-pipeline";
import { COACH_PIPELINE_LABELS } from "@/constants/unicoach-coach-pipeline";
import {
  entitlementFromAccess,
  evaluateCoachPipelineMove,
  type CoachMoveGate,
  type CoachStudentEntitlement,
} from "@/features/unicoach/coach-pipeline-gates";
import { useUpdateUnicoachStudentCallsMutation } from "@/features/unicoach/hooks/use-uniboard-unicoach";
import { recordUnicoachManualPayment } from "@/features/unicoach/server-actions/unicoach-actions";
import type { AssignedStudent } from "@/features/unicoach/types";
import confetti from "canvas-confetti";

export type PendingCoachGate = {
  userId: number;
  studentName?: string;
  from: CoachPipelineStage;
  to: CoachPipelineStage;
  gate: Exclude<CoachMoveGate, null>;
  message: string;
  entitlement: CoachStudentEntitlement;
};

function fireCoachCelebrateConfetti() {
  confetti({
    particleCount: 140,
    spread: 78,
    origin: { y: 0.35 },
    ticks: 240,
    colors: ["#2563eb", "#22c55e", "#eab308", "#f8fafc"],
  });
}

function resolveEntitlement(student: AssignedStudent | undefined, fallback?: CoachStudentEntitlement): CoachStudentEntitlement {
  if (fallback) return fallback;
  return entitlementFromAccess(student?.program_access_level, student?.plan_ids ?? [], 0);
}

export function useCoachPipelineMoveFlow(options?: {
  getStudent?: (userId: number) => AssignedStudent | undefined;
  onAfterSuccess?: (result: { userId: number; targetStage: string; celebrateOffer?: boolean }) => void;
}) {
  const updateCallsMutation = useUpdateUnicoachStudentCallsMutation();
  const [stageOverrides, setStageOverrides] = useState<Record<number, CoachPipelineStage>>({});
  const [pendingGate, setPendingGate] = useState<PendingCoachGate | null>(null);
  const [refundDate, setRefundDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [moveError, setMoveError] = useState<string | null>(null);
  const [paymentRecording, setPaymentRecording] = useState(false);

  const clearOverride = useCallback((userId: number) => {
    setStageOverrides(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  const revertPending = useCallback(() => {
    if (pendingGate) clearOverride(pendingGate.userId);
    setPendingGate(null);
    setMoveError(null);
  }, [clearOverride, pendingGate]);

  const commitMove = useCallback(
    async (
      userId: number,
      targetStage: CoachPipelineStage,
      flags: {
        confirmOffer?: boolean;
        confirmBackward?: boolean;
        confirmSkip?: boolean;
        refundedAt?: string;
        paymentJustRecorded?: boolean;
      } = {}
    ) => {
      setMoveError(null);
      try {
        const result = await updateCallsMutation.mutateAsync({
          userId,
          targetStage,
          confirmOffer: flags.confirmOffer,
          confirmBackward: flags.confirmBackward,
          confirmSkip: flags.confirmSkip,
          refundedAt: flags.refundedAt,
          paymentJustRecorded: flags.paymentJustRecorded,
        });
        clearOverride(userId);
        setPendingGate(null);
        if (result.celebrate_offer) fireCoachCelebrateConfetti();
        options?.onAfterSuccess?.({
          userId,
          targetStage,
          celebrateOffer: Boolean(result.celebrate_offer),
        });
        return result;
      } catch (err) {
        const e = err as Error & { gate?: string; status?: number };
        if (e.status === 409 && e.gate) {
          const student = options?.getStudent?.(userId);
          setPendingGate({
            userId,
            studentName: student?.name,
            from: "not_started",
            to: targetStage,
            gate: e.gate as Exclude<CoachMoveGate, null>,
            message: e.message,
            entitlement: resolveEntitlement(student),
          });
          return null;
        }
        clearOverride(userId);
        setPendingGate(null);
        setMoveError(e.message || "Could not update student stage.");
        throw err;
      }
    },
    [clearOverride, options, updateCallsMutation]
  );

  const requestMove = useCallback(
    (userId: number, targetStage: CoachPipelineStage, fromStage: CoachPipelineStage) => {
      if (fromStage === targetStage) return;
      setMoveError(null);
      setStageOverrides(prev => ({ ...prev, [userId]: targetStage }));

      const student = options?.getStudent?.(userId);
      const entitlement = resolveEntitlement(student);
      const evaluation = evaluateCoachPipelineMove({
        fromStage,
        toStage: targetStage,
        entitlement,
      });

      if (evaluation.allowed) {
        void commitMove(userId, targetStage).catch(() => undefined);
        return;
      }

      if (evaluation.gate === "blocked") {
        clearOverride(userId);
        setMoveError(evaluation.message);
        return;
      }

      setPendingGate({
        userId,
        studentName: student?.name,
        from: fromStage,
        to: targetStage,
        gate: evaluation.gate as Exclude<CoachMoveGate, null>,
        message: evaluation.message,
        entitlement,
      });
    },
    [clearOverride, commitMove, options]
  );

  const confirmPendingSimple = useCallback(async () => {
    if (!pendingGate) return;
    const flags: {
      confirmOffer?: boolean;
      confirmBackward?: boolean;
      confirmSkip?: boolean;
      refundedAt?: string;
    } = {};
    if (pendingGate.gate === "offer_confirm") flags.confirmOffer = true;
    if (pendingGate.gate === "backward_confirm") flags.confirmBackward = true;
    if (pendingGate.gate === "skip_confirm") flags.confirmSkip = true;
    if (pendingGate.gate === "refund_details") {
      if (!refundDate) {
        setMoveError("Enter the refund date.");
        return;
      }
      flags.refundedAt = refundDate;
    }
    await commitMove(pendingGate.userId, pendingGate.to, flags).catch(() => undefined);
  }, [commitMove, pendingGate, refundDate]);

  const submitPaymentThenMove = useCallback(
    async (payload: RecordPaymentPayload) => {
      if (!pendingGate) return;
      setPaymentRecording(true);
      try {
        const recorded = await recordUnicoachManualPayment({
          userId: pendingGate.userId,
          planId: payload.plan_id,
          amountGbp: payload.amount_gbp,
          paidAt: payload.paid_at,
          note: payload.note,
        });
        if (recorded.celebrate_payment) fireCoachCelebrateConfetti();
        await commitMove(pendingGate.userId, pendingGate.to, { paymentJustRecorded: true });
      } finally {
        setPaymentRecording(false);
      }
    },
    [commitMove, pendingGate]
  );

  const recordPaymentStandalone = useCallback(async (userId: number, payload: RecordPaymentPayload) => {
    setPaymentRecording(true);
    try {
      const recorded = await recordUnicoachManualPayment({
        userId,
        planId: payload.plan_id,
        amountGbp: payload.amount_gbp,
        paidAt: payload.paid_at,
        note: payload.note,
      });
      if (recorded.celebrate_payment) fireCoachCelebrateConfetti();
      return recorded;
    } finally {
      setPaymentRecording(false);
    }
  }, []);

  return {
    stageOverrides,
    pendingGate,
    refundDate,
    setRefundDate,
    moveError,
    setMoveError,
    paymentRecording,
    requestMove,
    confirmPendingSimple,
    revertPending,
    submitPaymentThenMove,
    recordPaymentStandalone,
    clearOverride,
    pipelinePending: updateCallsMutation.isPending || paymentRecording,
    gateTitle: pendingGate
      ? pendingGate.gate === "payment"
        ? "Record payment to continue"
        : pendingGate.gate === "offer_confirm"
          ? "Mark as Offered?"
          : pendingGate.gate === "refund_details"
            ? "Record refund"
            : pendingGate.gate === "backward_confirm"
              ? "Move student back?"
              : `Move to ${COACH_PIPELINE_LABELS[pendingGate.to]}?`
      : "",
  };
}
