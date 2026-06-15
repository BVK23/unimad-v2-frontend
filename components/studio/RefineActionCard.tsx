"use client";

import type { AssetActionMeta } from "@/types";
import { Pencil, Wand2 } from "lucide-react";

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
  const Icon = meta.kind === "preset" ? Wand2 : Pencil;
  const actionLabel = meta.presetLabel ?? "Custom edit";
  const assetLabel = ASSET_LABELS[meta.assetType] ?? "Document";
  const truncatedQuote =
    meta.selectedText.length > MAX_QUOTE_LENGTH ? `${meta.selectedText.slice(0, MAX_QUOTE_LENGTH)}…` : meta.selectedText;

  return (
    <div className="w-full max-w-[90%] rounded-xl border border-brand-100 bg-brand-50/60 dark:border-brand-800/60 dark:bg-brand-950/40">
      <div className="px-3.5 py-2.5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-800/50 dark:text-brand-300">
            <Icon size={13} aria-hidden />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">{actionLabel}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">on {assetLabel}</span>
            </div>
          </div>
        </div>
        <div className="mt-1.5 flex gap-2.5">
          <div className="flex w-6 shrink-0 justify-center self-stretch">
            <div className="w-0.5 min-h-[1rem] rounded-full bg-brand-200 dark:bg-brand-700" aria-hidden />
          </div>
          <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">&ldquo;{truncatedQuote}&rdquo;</p>
        </div>
      </div>
    </div>
  );
};

export default RefineActionCard;
