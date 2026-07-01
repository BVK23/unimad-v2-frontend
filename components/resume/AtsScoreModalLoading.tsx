"use client";

import { useEffect, useState } from "react";
import { FileSearch, Wand2 } from "lucide-react";

type LoadingPhase = {
  label: string;
  detail: string;
};

const FIRST_LOAD_PHASES: LoadingPhase[] = [
  { label: "Read", detail: "Reading your resume content…" },
  { label: "Check", detail: "Checking formatting and keywords…" },
  { label: "Score", detail: "Scoring against ATS criteria…" },
  { label: "Report", detail: "Assembling your score report…" },
];

const RECALC_PHASES: LoadingPhase[] = [
  { label: "Re-score", detail: "Re-running ATS analysis on your resume…" },
  { label: "Compare", detail: "Comparing with your previous score…" },
  { label: "Update", detail: "Updating your report…" },
];

const useLoadingPhase = (phases: LoadingPhase[], intervalMs = 2800) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex(current => Math.min(current + 1, phases.length - 1));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [phases, intervalMs]);

  return { phase: phases[index] ?? phases[0], index };
};

const PhaseStepper = ({ phases, activeIndex }: { phases: LoadingPhase[]; activeIndex: number }) => (
  <div className="flex w-full max-w-sm items-center justify-between gap-1" aria-hidden>
    {phases.map((phase, i) => {
      const isComplete = i < activeIndex;
      const isActive = i === activeIndex;
      return (
        <div key={phase.label} className="flex flex-1 items-center gap-1 min-w-0">
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <div
              className={`h-2 w-2 rounded-full transition-colors duration-500 ${
                isComplete ? "bg-brand-500" : isActive ? "bg-brand-500 ring-4 ring-brand-500/20" : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
            <span
              className={`text-[10px] font-medium uppercase tracking-wide truncate w-full text-center ${
                isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {phase.label}
            </span>
          </div>
          {i < phases.length - 1 ? (
            <div
              className={`h-px flex-1 mb-4 transition-colors duration-500 ${
                i < activeIndex ? "bg-brand-400/60" : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ) : null}
        </div>
      );
    })}
  </div>
);

const DocumentScanGraphic = () => (
  <div className="relative mx-auto h-44 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <div className="space-y-2.5 p-5 pt-6">
      <div className="h-2 w-14 rounded-full bg-slate-200 dark:bg-slate-600" />
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700" />
      <div className="h-1.5 w-[85%] rounded-full bg-slate-100 dark:bg-slate-700" />
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700" />
      <div className="h-1.5 w-[70%] rounded-full bg-slate-100 dark:bg-slate-700" />
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700" />
      <div className="h-1.5 w-[90%] rounded-full bg-slate-100 dark:bg-slate-700" />
    </div>
    <div className="ats-scan-line pointer-events-none absolute inset-x-3 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-80" />
    <style jsx>{`
      .ats-scan-line {
        animation: ats-scan-sweep 2.4s ease-in-out infinite;
      }
      @keyframes ats-scan-sweep {
        0%,
        100% {
          top: 18%;
          opacity: 0.35;
        }
        50% {
          top: 78%;
          opacity: 1;
        }
      }
    `}</style>
  </div>
);

type AtsScoreModalLoadingPanelProps = {
  mode: "first" | "recalc";
};

export const AtsScoreModalLoadingPanel = ({ mode }: AtsScoreModalLoadingPanelProps) => {
  const phases = mode === "first" ? FIRST_LOAD_PHASES : RECALC_PHASES;
  const { phase, index } = useLoadingPhase(phases);
  const title = mode === "first" ? "Building your ATS report" : "Refreshing your score";
  const subtitle =
    mode === "first"
      ? "This usually takes a few seconds. Your report will appear here when ready."
      : "Your current score stays visible above while we update the analysis below.";

  return (
    <div
      className="flex min-h-[min(420px,50vh)] flex-col items-center justify-center px-4 py-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-8 rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-8 dark:border-slate-800 dark:bg-slate-800/30">
        <div className="relative">
          <div className="absolute -inset-3 rounded-full bg-brand-500/5 animate-pulse" aria-hidden />
          <div className="relative flex items-center justify-center">
            <DocumentScanGraphic />
            <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-white bg-brand-600 text-white shadow-md dark:border-slate-900">
              <FileSearch size={16} aria-hidden />
            </div>
          </div>
        </div>

        <div className="w-full space-y-3 text-center">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
          <p key={phase.detail} className="text-sm font-medium text-brand-600 dark:text-brand-400 animate-in fade-in duration-300">
            {phase.detail}
          </p>
        </div>

        <PhaseStepper phases={phases} activeIndex={index} />
      </div>
    </div>
  );
};

export const AtsScoreModalRecalculateProgress = () => (
  <div className="h-0.5 w-full overflow-hidden bg-slate-100 dark:bg-slate-800" aria-hidden>
    <div className="ats-recalc-progress h-full w-1/3 bg-brand-500" />
    <style jsx>{`
      .ats-recalc-progress {
        animation: ats-progress-slide 1.4s ease-in-out infinite;
      }
      @keyframes ats-progress-slide {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(400%);
        }
      }
    `}</style>
  </div>
);

type AtsScoreModalFooterPlaceholderProps = {
  fixAllUsed: boolean;
};

export const AtsScoreModalFooterPlaceholder = ({ fixAllUsed }: AtsScoreModalFooterPlaceholderProps) => (
  <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
    <div className="flex flex-col sm:flex-row gap-4 opacity-30 pointer-events-none" aria-hidden>
      <button
        type="button"
        disabled
        className="flex-1 px-5 py-3 rounded-xl bg-brand-600 text-white text-sm font-medium inline-flex items-center justify-center gap-2 cursor-not-allowed"
      >
        <Wand2 size={18} />
        {fixAllUsed ? "Unibot fix applied" : "Fix once with Unibot"}
      </button>
      <button
        type="button"
        disabled
        className="flex-1 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium cursor-not-allowed"
      >
        Fix with a career coach
      </button>
    </div>
  </div>
);
