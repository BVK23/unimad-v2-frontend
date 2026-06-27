"use client";

import type React from "react";
import type { SubThreadNavTarget } from "@/src/features/adk-chat/resolve-sub-thread-navigation";
import { ArrowUpRight } from "lucide-react";

type SubThreadGoToAssetLinkProps = {
  target: SubThreadNavTarget;
  onNavigate: (href: string) => void;
  highlighted?: boolean;
};

/** Faded deep-link when chat sub-thread asset ≠ what's open in the main panel. */
export function SubThreadGoToAssetLink({ target, onNavigate, highlighted = false }: SubThreadGoToAssetLinkProps): React.JSX.Element {
  return (
    <button
      type="button"
      data-unibot-go-to-target={target.href}
      onClick={e => {
        e.stopPropagation();
        onNavigate(target.href);
      }}
      className={`mb-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-all ${
        highlighted
          ? "bg-brand-50 text-brand-700 ring-2 ring-brand-400 ring-offset-1 dark:bg-brand-950/40 dark:text-brand-300"
          : "text-slate-400 hover:text-brand-600 dark:text-slate-500 dark:hover:text-brand-400"
      }`}
    >
      <ArrowUpRight size={11} aria-hidden className="shrink-0 opacity-70" />
      {target.label}
    </button>
  );
}
