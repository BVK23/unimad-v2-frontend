"use client";

import PortfolioCreatingLayoutSkeleton from "@/components/portfolio/PortfolioCreatingLayoutSkeleton";
import {
  PortfolioGenerationLoadingPanel,
  type PortfolioGenerationLoadingMode,
} from "@/components/portfolio/PortfolioGenerationLoadingPanel";
import type { PortfolioCreationVariant } from "@/features/portfolio/constants/portfolioCreationCopy";

type PortfolioCreatingOverlayProps = {
  variant: PortfolioCreationVariant;
};

function variantToLoadingMode(variant: PortfolioCreationVariant): PortfolioGenerationLoadingMode {
  if (variant === "ai_regenerate" || variant === "ai_clone") return "regenerate";
  return "generate";
}

export default function PortfolioCreatingOverlay({ variant }: PortfolioCreatingOverlayProps) {
  const isFetch = variant === "fetch";

  if (isFetch) {
    return (
      <div
        className="absolute inset-0 z-50 flex flex-col bg-slate-50/95 dark:bg-[#080808]/95"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Loading your portfolio"
      >
        <PortfolioCreatingLayoutSkeleton />
      </div>
    );
  }

  const mode = variantToLoadingMode(variant);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col bg-slate-900/25 backdrop-blur-[3px] dark:bg-black/40"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="pointer-events-none flex-1 overflow-hidden opacity-60">
        <PortfolioCreatingLayoutSkeleton />
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
        <PortfolioGenerationLoadingPanel mode={mode} />
      </div>
    </div>
  );
}
