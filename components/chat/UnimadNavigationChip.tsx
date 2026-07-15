"use client";

import type { UnimadNavigationAction } from "@/src/features/adk-chat/parse-unimad-navigation";
import { ArrowUpRight } from "lucide-react";

type Props = {
  navigation: UnimadNavigationAction;
  onNavigate: (path: string) => void;
};

/** Text CTA for Unibot navigation suggestions (resume deep-links, feature Go-to, etc.). */
export function UnimadNavigationChip({ navigation, onNavigate }: Props) {
  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => onNavigate(navigation.path)}
        className="inline-flex max-w-full items-center gap-0.5 text-left text-[13px] font-normal leading-snug text-slate-600 transition-colors hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
      >
        <span className="min-w-0 truncate">{navigation.label}</span>
        <ArrowUpRight size={12} aria-hidden className="shrink-0 opacity-60" />
      </button>
    </div>
  );
}
