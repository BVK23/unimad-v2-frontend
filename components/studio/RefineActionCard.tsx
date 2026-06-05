"use client";

import { useState } from "react";
import type { AssetActionMeta } from "@/types";
import { ChevronDown, ChevronUp, Pencil, Wand2 } from "lucide-react";

type RefineActionCardProps = {
  meta: AssetActionMeta;
};

const ASSET_LABELS: Record<string, string> = {
  coverletter: "Cover Letter",
  coldemail: "Cold Email",
  referral: "Referral",
};

const MAX_QUOTE_LENGTH = 120;

const RefineActionCard = ({ meta }: RefineActionCardProps) => {
  const [showPrompt, setShowPrompt] = useState(false);

  const Icon = meta.kind === "preset" ? Wand2 : Pencil;
  const actionLabel = meta.presetLabel ?? "Custom edit";
  const assetLabel = ASSET_LABELS[meta.assetType] ?? "Document";
  const truncatedQuote =
    meta.selectedText.length > MAX_QUOTE_LENGTH ? `${meta.selectedText.slice(0, MAX_QUOTE_LENGTH)}…` : meta.selectedText;

  return (
    <div className="w-full max-w-[90%] rounded-xl border border-brand-100 bg-brand-50/60 dark:border-brand-800/60 dark:bg-brand-950/40">
      <div className="flex items-start gap-2.5 px-3.5 py-2.5">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-800/50 dark:text-brand-300">
          <Icon size={13} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">{actionLabel}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">on {assetLabel}</span>
          </div>
          <blockquote className="mt-1 border-l-2 border-brand-200 pl-2 text-[11px] leading-relaxed text-slate-500 dark:border-brand-700 dark:text-slate-400">
            &ldquo;{truncatedQuote}&rdquo;
          </blockquote>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowPrompt(p => !p)}
        className="flex w-full items-center gap-1 border-t border-brand-100 px-3.5 py-1.5 text-[10px] font-medium text-slate-400 transition-colors hover:text-slate-600 dark:border-brand-800/60 dark:text-slate-500 dark:hover:text-slate-300"
        aria-expanded={showPrompt}
        aria-label={showPrompt ? "Hide prompt" : "View prompt"}
      >
        {showPrompt ? <ChevronUp size={10} aria-hidden /> : <ChevronDown size={10} aria-hidden />}
        {showPrompt ? "Hide prompt" : "View prompt"}
      </button>

      {showPrompt && (
        <div className="border-t border-brand-100 px-3.5 py-2 dark:border-brand-800/60">
          <pre className="whitespace-pre-wrap text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">{meta.prompt}</pre>
        </div>
      )}
    </div>
  );
};

export default RefineActionCard;
