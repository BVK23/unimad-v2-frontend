"use client";

import React, { useEffect, useState } from "react";
import { FileSearch, Loader2 } from "lucide-react";

const DEFAULT_MESSAGES = [
  "Reading the job posting…",
  "Extracting role and company…",
  "Pulling job description…",
  "Checking apply link and details…",
  "Almost there…",
] as const;

interface JobUrlImportLoadingProps {
  messages?: readonly string[];
  /** How long each status line is shown before cycling (ms). */
  intervalMs?: number;
  /** Compact layout for overlay inside the add-application card (no extra vertical padding). */
  compact?: boolean;
  className?: string;
}

/**
 * Inline loading state for job URL import (Discovery card, modals).
 * Cycles status copy while the backend researches the URL via Gemini.
 */
export default function JobUrlImportLoading({
  messages = DEFAULT_MESSAGES,
  intervalMs = 2800,
  compact = false,
  className = "",
}: JobUrlImportLoadingProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return undefined;

    const id = window.setInterval(() => {
      setIndex(prev => (prev + 1) % messages.length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [messages, intervalMs]);

  const statusLine = messages[index] ?? messages[0];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "py-2" : "py-8"} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={`relative ${compact ? "mb-2" : "mb-4"}`}>
        <div
          className={`rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin dark:border-brand-900/50 dark:border-t-brand-400 ${
            compact ? "h-10 w-10" : "h-14 w-14"
          }`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <FileSearch size={compact ? 18 : 22} className="text-brand-600 animate-pulse dark:text-brand-400" aria-hidden />
        </div>
      </div>
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Importing job</h4>
      <p className="mt-1.5 min-h-[1.25rem] text-xs text-slate-500 transition-opacity duration-300 dark:text-slate-400">{statusLine}</p>
      {!compact && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <Loader2 size={12} className="animate-spin shrink-0" aria-hidden />
          This can take up to a minute
        </p>
      )}
    </div>
  );
}
