"use client";

import { useEffect, useState } from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { MANUAL_PAYMENT_PLAN_OPTIONS } from "@/features/unicoach/coach-pipeline-gates";

export type RecordPaymentPayload = {
  plan_id: string;
  amount_gbp: number;
  paid_at: string;
  note?: string;
};

type UnicoachCoachRecordPaymentModalProps = {
  open: boolean;
  studentName?: string;
  defaultPlanId?: string;
  defaultAmount?: number;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onClose: () => void;
  onSubmit: (payload: RecordPaymentPayload) => Promise<void> | void;
};

export function UnicoachCoachRecordPaymentModal({
  open,
  studentName,
  defaultPlanId = "unicoach_program",
  defaultAmount = 199,
  title = "Record payment & enroll",
  description = "This student paid outside the platform (or needs the next installment recorded). Fill in the details to unlock the correct program access.",
  confirmLabel = "Save payment",
  onClose,
  onSubmit,
}: UnicoachCoachRecordPaymentModalProps) {
  const [planId, setPlanId] = useState(defaultPlanId);
  const [amount, setAmount] = useState(String(defaultAmount));
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPlanId(defaultPlanId);
    setAmount(String(defaultAmount));
    setPaidAt(new Date().toISOString().slice(0, 10));
    setNote("");
    setError("");
  }, [open, defaultPlanId, defaultAmount]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    setError("");
    const amountNum = Number(amount);
    if (!planId) {
      setError("Choose an enrollment type.");
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!paidAt) {
      setError("Enter the payment date.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        plan_id: planId,
        amount_gbp: amountNum,
        paid_at: paidAt,
        note: note.trim() || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortalOverlay
      open={open}
      className="flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={saving ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coach-record-payment-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-[#111]"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="coach-record-payment-title" className="text-lg font-medium text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {studentName ? `${description} Student: ${studentName}.` : description}
        </p>

        <div className="mt-5 space-y-3">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Enrollment type
            <select
              value={planId}
              onChange={e => setPlanId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              {MANUAL_PAYMENT_PLAN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Amount paid (£)
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>

          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Payment date
            <input
              type="date"
              value={paidAt}
              onChange={e => setPaidAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>

          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Note (optional)
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Bank transfer, Stripe link, etc."
            />
          </label>
        </div>

        {error ? <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p> : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSubmit()}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </ModalPortalOverlay>
  );
}
