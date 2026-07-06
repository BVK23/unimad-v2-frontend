"use client";

import { useState } from "react";
import { AutoDismissBanner } from "@/components/ui/AutoDismissBanner";
import type { LinkedInReanalysisMeta } from "@/features/linkedin/types";

type LinkedInReanalysisBannerProps = {
  reanalysisMeta: LinkedInReanalysisMeta;
  sectionNames: string[];
};

export function LinkedInReanalysisBanner({ reanalysisMeta, sectionNames }: LinkedInReanalysisBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <AutoDismissBanner
      className="border-b border-brand-100 bg-brand-50/80 text-sm text-brand-900 dark:border-brand-900/40 dark:bg-brand-950/30 dark:text-brand-100"
      durationMs={15000}
      onDismiss={() => setDismissed(true)}
    >
      <p className="mx-auto max-w-6xl leading-relaxed">{reanalysisMeta.summary}</p>
      {sectionNames.length > 0 ? (
        <p className="mx-auto mt-1 max-w-6xl text-xs text-brand-800/80 dark:text-brand-200/80">Re-scored: {sectionNames.join(", ")}</p>
      ) : null}
    </AutoDismissBanner>
  );
}
