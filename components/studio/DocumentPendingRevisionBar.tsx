"use client";

import { assetTypeDisplayLabel } from "@/features/application-assets/config/selection-presets";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { Loader2 } from "lucide-react";

type DocumentPendingRevisionBarProps = {
  assetType: ApplicationAssetApiType;
  busy?: boolean;
  onAccept: () => void;
  onRevert: () => void;
};

const DocumentPendingRevisionBar = ({ assetType, busy = false, onAccept, onRevert }: DocumentPendingRevisionBarProps) => {
  const label = assetTypeDisplayLabel(assetType);

  return (
    <div
      className="absolute inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-brand-200 bg-brand-50/95 px-4 py-2.5 backdrop-blur-sm dark:border-brand-800 dark:bg-brand-950/90"
      role="status"
      aria-live="polite"
    >
      <p className="text-xs font-medium text-brand-900 dark:text-brand-100">Unibot revised your {label}</p>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onAccept()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
          Accept
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onRevert}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Revert
        </button>
      </div>
    </div>
  );
};

export default DocumentPendingRevisionBar;
