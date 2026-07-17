"use client";

import { PortfolioGenerationLoadingPanel } from "@/components/portfolio/PortfolioGenerationLoadingPanel";

/** Full-page backdrop + loading panel — same pattern as portfolio generation. */
export default function VpdCreatingOverlay() {
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col bg-slate-900/25 backdrop-blur-[3px] dark:bg-black/40"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Generating your Value Proposition Document"
    >
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg">
          <PortfolioGenerationLoadingPanel
            mode="generate"
            title="Generating your Value Prop Doc"
            subtitle="Unibot is drafting a tailored VPD from your profile and this role. This can take a minute."
          />
        </div>
      </div>
    </div>
  );
}
