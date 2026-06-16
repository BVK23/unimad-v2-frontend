"use client";

import React, { useEffect, useState } from "react";
import {
  getPrepareAssetGenerationMessageIndex,
  PREPARE_ASSET_GENERATION_MESSAGES,
  prepareAssetGenerationTitle,
  type PrepareAssetGenerationKind,
} from "@/lib/jobs/prepare-asset-generation-messages";
import { Loader2, Wand2 } from "lucide-react";

interface PrepareAssetGenerationLoadingProps {
  kind: PrepareAssetGenerationKind;
  /** How long each status line is shown before advancing (ms). */
  intervalMs?: number;
  className?: string;
}

/**
 * Preview-area loading state while Prepare Application generates resume, cover letter, or cold email.
 */
export default function PrepareAssetGenerationLoading({ kind, intervalMs = 1500, className = "" }: PrepareAssetGenerationLoadingProps) {
  const messages = PREPARE_ASSET_GENERATION_MESSAGES[kind];
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Avoid calling setState synchronously inside the effect body.
    const id = window.setTimeout(() => setStep(0), 0);
    return () => window.clearTimeout(id);
  }, [kind]);

  useEffect(() => {
    if (messages.length <= 1) return undefined;

    const id = window.setInterval(() => {
      setStep(prev => prev + 1);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [messages.length, intervalMs, kind]);

  const index = getPrepareAssetGenerationMessageIndex(messages.length, step);
  const statusLine = messages[index] ?? messages[0];

  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative mb-5 h-14 w-14">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600 dark:border-brand-900/50 dark:border-t-brand-400" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Wand2 size={20} className="animate-pulse text-brand-600 dark:text-brand-400" aria-hidden />
        </div>
      </div>
      <h3 className="mb-2 font-medium text-slate-900 dark:text-white">{prepareAssetGenerationTitle(kind)}</h3>
      <p
        key={`${kind}-${index}-${step}`}
        className="min-h-[1.25rem] max-w-sm animate-in fade-in duration-300 text-sm text-slate-600 dark:text-slate-300"
      >
        {statusLine}
      </p>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <Loader2 size={12} className="shrink-0 animate-spin" aria-hidden />
        Tailoring content from your profile and the job description
      </p>
    </div>
  );
}
