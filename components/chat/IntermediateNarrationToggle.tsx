"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FormattedAgentMessage } from "./FormattedAgentMessage";

/** Most recent non-empty line — used for the collapsed streaming preview. */
export function latestIntermediateLine(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return text.trim();
  return lines[lines.length - 1] ?? text.trim();
}

export type IntermediateNarrationToggleProps = {
  /** Parked interim narration (and/or live interim text while streaming). */
  text: string;
  /** When true, collapsed view prefers the latest streaming line. */
  isStreaming?: boolean;
  className?: string;
};

/**
 * Collapsible lighter-opacity UI for ReAct interim model text.
 * Collapsed: latest line only (Markdown-rendered). Expanded: full intermediate narration.
 */
export function IntermediateNarrationToggle({ text, isStreaming = false, className }: IntermediateNarrationToggleProps) {
  const [expanded, setExpanded] = useState(false);
  const trimmed = text.trim();
  if (!trimmed) return null;

  const collapsedPreview = latestIntermediateLine(trimmed);

  return (
    <div className={`w-full min-w-0 ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="group flex w-full max-w-full items-start gap-1 rounded-md px-0.5 py-0.5 text-left text-slate-400 transition-colors hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400"
        aria-expanded={expanded}
        aria-label={expanded ? "Hide intermediate updates" : "Show intermediate updates"}
      >
        <span className="mt-0.5 shrink-0 opacity-80">
          {expanded ? <ChevronDown size={12} aria-hidden /> : <ChevronRight size={12} aria-hidden />}
        </span>
        {expanded ? (
          <span className="min-w-0 flex-1 text-[12px] leading-relaxed text-slate-400/90 dark:text-slate-500">Intermediate updates</span>
        ) : (
          <span className={`min-w-0 flex-1 overflow-hidden text-[12px] leading-relaxed ${isStreaming ? "opacity-70" : "opacity-80"}`}>
            <FormattedAgentMessage
              content={collapsedPreview}
              className="line-clamp-1 text-[12px] leading-relaxed text-slate-400 dark:text-slate-500 [&_p]:mb-0"
            />
          </span>
        )}
        {!expanded && isStreaming ? (
          <span className="mt-1 h-1 w-1 shrink-0 animate-pulse rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden />
        ) : null}
      </button>
      {expanded ? (
        <div className="mt-0.5 border-l border-slate-200/80 pl-2.5 text-[12px] leading-relaxed text-slate-400 dark:border-white/10 dark:text-slate-500">
          <FormattedAgentMessage content={trimmed} className="text-slate-400 dark:text-slate-500" />
        </div>
      ) : null}
    </div>
  );
}
