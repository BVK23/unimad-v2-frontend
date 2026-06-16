"use client";

import type { ReactNode } from "react";
import { CompanyLogo } from "@/components/jobs/CompanyLogo";
import type { PrepareApplicationReturnSession } from "@/lib/jobs/prepare-application-return";
import { Save, X } from "lucide-react";

type PrepareApplicationReturnBarProps = {
  session: PrepareApplicationReturnSession;
  onSaveAndReturn: () => void;
  onDismiss: () => void;
  /** Hide when the current asset has not been generated yet. */
  showSaveAndReturn?: boolean;
  /** Optional controls before Save & return (e.g. resume template + ATS). */
  actions?: ReactNode;
};

export function PrepareApplicationReturnBar({
  session,
  onSaveAndReturn,
  onDismiss,
  showSaveAndReturn = true,
  actions,
}: PrepareApplicationReturnBarProps) {
  return (
    <div className="flex min-h-16 shrink-0 items-center gap-3 border-b border-brand-200/80 bg-brand-50/90 px-4 py-2.5 dark:border-brand-800/50 dark:bg-brand-950/40 sm:px-6">
      <button
        type="button"
        onClick={onDismiss}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/80 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Close and stay in editor"
      >
        <X size={18} />
      </button>
      <CompanyLogo logoUrl={session.logo} company={session.company} size="xs" />
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">Editing</p>
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{session.role}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{session.company}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
      {showSaveAndReturn ? (
        <button
          type="button"
          onClick={onSaveAndReturn}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-brand-700"
        >
          <Save size={14} />
          Save & return
        </button>
      ) : null}
    </div>
  );
}
