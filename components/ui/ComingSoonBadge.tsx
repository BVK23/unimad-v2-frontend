"use client";

import { Sparkles } from "lucide-react";

type ComingSoonBadgeProps = {
  label?: "soon" | "coming-soon";
  variant?: "inline" | "corner";
  className?: string;
};

export function ComingSoonBadge({ label = "soon", variant = "inline", className = "" }: ComingSoonBadgeProps) {
  const text = label === "soon" ? "Soon" : "Coming soon";

  if (variant === "corner") {
    return (
      <span className={`pointer-events-none absolute -right-1 -top-2 z-10 select-none ${className}`} aria-hidden>
        <span className="relative inline-flex overflow-hidden rounded-full border border-white/30 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider text-white shadow-[0_2px_8px_rgba(37,99,235,0.35)] ring-1 ring-brand-400/30 dark:border-brand-300/20 dark:from-brand-500 dark:via-brand-400 dark:to-brand-500 dark:ring-brand-300/25">
          <span className="coming-soon-badge-shimmer" aria-hidden />
          {text}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden items-center gap-1 rounded-full border border-brand-200/70 bg-gradient-to-br from-white via-brand-50/90 to-violet-50/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 shadow-[0_1px_2px_rgba(37,99,235,0.08)] dark:border-brand-800/50 dark:from-slate-900 dark:via-brand-950/40 dark:to-violet-950/30 dark:text-brand-300 dark:shadow-none ${className}`}
    >
      <span className="coming-soon-badge-shimmer opacity-60 dark:opacity-40" aria-hidden />
      <Sparkles size={10} strokeWidth={2.25} className="relative text-brand-500 dark:text-brand-400" aria-hidden />
      <span className="relative">{text}</span>
    </span>
  );
}
