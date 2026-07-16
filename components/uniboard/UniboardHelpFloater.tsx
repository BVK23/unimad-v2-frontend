"use client";

import React, { useState } from "react";
import ResumeKnowledgeBaseModal from "@/components/resume/ResumeKnowledgeBaseModal";
import { FINISH_ONBOARDING_CTA, ONBOARDING_GATE_MESSAGES } from "@/constants/onboarding-tooltips";
import { useOnboardingGate } from "@/features/onboarding/context/OnboardingGateContext";
import { needsProfileSetup, onboardingHref } from "@/features/onboarding/featureGates";
import { BookOpen, ChevronRight, Sparkles, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export type UniboardHelpFloaterProps = {
  /** Portfolio-only: show generate / regenerate CTA. */
  onGeneratePortfolio?: () => void;
  showPortfolioGenerate?: boolean;
  /** Defaults to “Generate portfolio with Unibot”. */
  portfolioGenerateLabel?: string;
  /** Portfolio-only: revert last Replace Portfolio Gen. */
  onRevertPortfolio?: () => void;
  showPortfolioRevert?: boolean;
};

type KnowledgeBaseAvailability = {
  enabled: boolean;
  label: string;
  disabledHint?: string;
};

/**
 * Bottom-right Uniboard help floater.
 *
 * FAB icon:
 * - Sparkles when onboarding is incomplete (nudge to finish setup)
 * - BookOpen when fully onboarded (feature help / knowledge base)
 *
 * Hosts:
 * - Finish onboarding (when profile/niche incomplete)
 * - Feature knowledge base (enabled when that feature has one; otherwise disabled)
 * - Portfolio generate nudge (portfolio page only)
 *
 * When adding a new feature knowledge base, wire it here — do not put a separate
 * toolbar “i” / help button on the feature page. See AGENTS.md.
 */
export function UniboardHelpFloater({
  onGeneratePortfolio,
  showPortfolioGenerate = false,
  portfolioGenerateLabel = "Generate portfolio with Unibot",
  onRevertPortfolio,
  showPortfolioRevert = false,
}: UniboardHelpFloaterProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { featureGates } = useOnboardingGate();
  const [open, setOpen] = useState(false);
  const [showResumeKnowledgeBase, setShowResumeKnowledgeBase] = useState(false);

  const onPortfolio = pathname.includes("/uniboard/portfolio");
  const onResume = pathname.includes("/uniboard/resume");
  const needsOnboarding = needsProfileSetup(featureGates);
  const FloaterIcon = needsOnboarding ? Sparkles : BookOpen;
  const panelTitle = onPortfolio ? "Portfolio" : needsOnboarding ? "Get started" : "Help";
  const finishOnboardingHref = onboardingHref("profile_setup");

  const knowledgeBase = resolveKnowledgeBaseAvailability(pathname);

  const handleFinishOnboarding = () => {
    setOpen(false);
    router.push(finishOnboardingHref);
  };

  const handleKnowledgeBaseClick = () => {
    if (!knowledgeBase.enabled) return;
    if (onResume) {
      setShowResumeKnowledgeBase(true);
      setOpen(false);
    }
  };

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-[100] rounded-full bg-brand-600 p-3 text-white shadow-lg transition-all hover:scale-105 hover:bg-brand-700"
          title={needsOnboarding ? "Get started" : "Knowledge base & help"}
          aria-label={needsOnboarding ? "Open get started menu" : "Open help menu"}
        >
          <FloaterIcon size={20} />
        </button>
      ) : (
        <div className="fixed bottom-4 right-4 z-[100] w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/80">
            <div className="flex items-center gap-2">
              <FloaterIcon size={14} className="text-brand-600 dark:text-brand-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">{panelTitle}</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-1 p-2">
            {needsOnboarding ? (
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span>{FINISH_ONBOARDING_CTA}</span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            ) : null}

            {knowledgeBase.enabled ? (
              <button
                type="button"
                onClick={handleKnowledgeBaseClick}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span>{knowledgeBase.label}</span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            ) : (
              <div
                className="flex w-full cursor-not-allowed items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-400 dark:text-slate-500"
                title={knowledgeBase.disabledHint}
                aria-disabled="true"
              >
                <span>{knowledgeBase.label}</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Soon</span>
              </div>
            )}

            {showPortfolioGenerate && onGeneratePortfolio ? (
              <button
                type="button"
                onClick={() => {
                  onGeneratePortfolio();
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span>{portfolioGenerateLabel}</span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            ) : null}

            {showPortfolioRevert && onRevertPortfolio ? (
              <button
                type="button"
                onClick={() => {
                  onRevertPortfolio();
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span>Revert to previous portfolio</span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            ) : null}

            {onPortfolio && needsOnboarding ? (
              <p className="px-3 pb-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                {ONBOARDING_GATE_MESSAGES.portfolio}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <ResumeKnowledgeBaseModal open={showResumeKnowledgeBase} onClose={() => setShowResumeKnowledgeBase(false)} />
    </>
  );
}

/** @deprecated Prefer `UniboardHelpFloater`. */
export const FeatureOnboardingFloater = UniboardHelpFloater;

function resolveKnowledgeBaseAvailability(pathname: string): KnowledgeBaseAvailability {
  if (pathname.includes("/uniboard/resume")) {
    return { enabled: true, label: "Knowledge base" };
  }

  return {
    enabled: false,
    label: "Knowledge base",
    disabledHint: "Knowledge base for this feature is coming soon.",
  };
}
