"use client";

import type { ReactNode } from "react";
import { btnGhost, btnPrimaryBrand } from "@/constants/ui/button-classes";

type ProfileConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  confirmDisabled?: boolean;
};

export function ProfileConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  confirmDisabled,
}: ProfileConfirmDialogProps) {
  if (!open) return null;

  const confirmClass = confirmVariant === "danger" ? `${btnPrimaryBrand} !bg-red-600 hover:!bg-red-700` : btnPrimaryBrand;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" aria-label="Close" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#111]">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">{description}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={confirmClass} disabled={confirmDisabled} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
