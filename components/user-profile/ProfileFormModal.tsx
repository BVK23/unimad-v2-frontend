"use client";

import type { ReactNode } from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { btnGhost, btnPrimaryBrand } from "@/constants/ui/button-classes";
import { X } from "lucide-react";

type ProfileFormModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  children: ReactNode;
};

export function ProfileFormModal({
  open,
  title,
  onClose,
  onSubmit,
  submitLabel = "Save",
  submitDisabled,
  children,
}: ProfileFormModalProps) {
  if (!open) return null;

  return (
    <ModalPortalOverlay open={open} className="flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#111]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-brand-600 dark:text-brand-400">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={btnPrimaryBrand} disabled={submitDisabled} onClick={onSubmit}>
            {submitLabel}
          </button>
        </div>
      </div>
    </ModalPortalOverlay>
  );
}

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-[#0a0a0a] dark:text-slate-100";

export function ProfileFormField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1.5 ${className ?? ""}`}>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export function ProfileFormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function ProfileFormTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldClass} min-h-[120px] resize-y ${props.className ?? ""}`} />;
}
