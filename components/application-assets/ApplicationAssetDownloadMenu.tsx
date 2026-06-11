"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileText } from "lucide-react";

type ApplicationAssetDownloadMenuProps = {
  disabled?: boolean;
  isBusy?: boolean;
  onDownloadPdf: () => void | Promise<void>;
  onDownloadDocx: () => void | Promise<void>;
};

export function ApplicationAssetDownloadMenu({
  disabled = false,
  isBusy = false,
  onDownloadPdf,
  onDownloadDocx,
}: ApplicationAssetDownloadMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const run = async (action: () => void | Promise<void>) => {
    setOpen(false);
    await action();
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled || isBusy}
        onClick={() => setOpen(prev => !prev)}
        title="Download"
        aria-label="Download document"
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        <Download size={14} />
        <ChevronDown size={12} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void run(onDownloadPdf)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download size={14} className="shrink-0 text-slate-500" />
            {isBusy ? "Preparing…" : "Download PDF"}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void run(onDownloadDocx)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileText size={14} className="shrink-0 text-slate-500" />
            {isBusy ? "Preparing…" : "Download Word"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
