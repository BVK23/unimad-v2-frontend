"use client";

import { useEffect, useMemo, useState } from "react";
import PortfolioCreatingLayoutSkeleton from "@/components/portfolio/PortfolioCreatingLayoutSkeleton";
import {
  PORTFOLIO_CREATION_COPY,
  PORTFOLIO_CREATION_STEPS,
  PORTFOLIO_ESCALATION_15S,
  PORTFOLIO_ESCALATION_7S,
  PORTFOLIO_STEP_ROTATION_MS,
  type PortfolioCreationVariant,
} from "@/features/portfolio/constants/portfolioCreationCopy";
import { Loader2 } from "lucide-react";

type PortfolioCreatingOverlayProps = {
  variant: PortfolioCreationVariant;
};

const IndeterminateProgressBar = () => (
  <div className="w-full max-w-xs h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
    <div className="h-full w-1/3 rounded-full bg-brand-600 dark:bg-brand-500 animate-portfolio-indeterminate" />
  </div>
);

export default function PortfolioCreatingOverlay({ variant }: PortfolioCreatingOverlayProps) {
  const copy = PORTFOLIO_CREATION_COPY[variant];
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!copy.rotateSteps) {
      return;
    }
    const interval = setInterval(() => {
      setStepIndex(prev => (prev + 1) % PORTFOLIO_CREATION_STEPS.length);
    }, PORTFOLIO_STEP_ROTATION_MS);
    return () => clearInterval(interval);
  }, [copy.rotateSteps]);

  const headline = useMemo(() => {
    if (elapsedSeconds >= PORTFOLIO_ESCALATION_15S && copy.escalation15s) {
      return copy.escalation15s;
    }
    if (elapsedSeconds >= PORTFOLIO_ESCALATION_7S && copy.escalation7s) {
      return copy.escalation7s;
    }
    return copy.primary;
  }, [copy, elapsedSeconds]);

  const stepLabel = copy.rotateSteps ? PORTFOLIO_CREATION_STEPS[stepIndex] : null;
  const statusLabel = stepLabel ? `${headline} ${stepLabel}` : headline;

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col bg-slate-50/95 dark:bg-[#080808]/95"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={statusLabel}
    >
      <PortfolioCreatingLayoutSkeleton />

      <div className="shrink-0 border-t border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#111]/90 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
          <Loader2 size={28} className="animate-spin text-brand-600" aria-hidden />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{headline}</p>
          {stepLabel && <p className="text-xs text-slate-500 dark:text-slate-400 transition-opacity duration-300">{stepLabel}</p>}
          {variant !== "fetch" && <IndeterminateProgressBar />}
        </div>
      </div>
    </div>
  );
}
