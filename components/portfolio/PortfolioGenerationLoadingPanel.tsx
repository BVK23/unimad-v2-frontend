"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

/** Rotates continuously — no fixed “completed steps” UI tied to backend timing. */
const PORTFOLIO_GENERATION_MESSAGES = [
  "Reading your personal data from onboarding…",
  "Crafting your USP…",
  "Crafting your quick summary…",
  "Building your domain profile fit…",
  "Highlighting experience and projects…",
  "Shaping your elevator pitch…",
  "Laying out your portfolio sections…",
  "Applying final touches and polishing your portfolio…",
] as const;

const PORTFOLIO_REGENERATION_MESSAGES = [
  "Reading your personal data from onboarding…",
  "Crafting your USP…",
  "Crafting your quick summary…",
  "Building your domain profile fit…",
  "Refreshing experience and project sections…",
  "Shaping your elevator pitch…",
  "Laying out your portfolio sections…",
  "Applying final touches and polishing your portfolio…",
] as const;

const MESSAGE_ROTATION_MS = 1800;

const useRotatingMessage = (messages: readonly string[]) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex(current => (current + 1) % messages.length);
    }, MESSAGE_ROTATION_MS);
    return () => window.clearInterval(id);
  }, [messages]);

  return messages[index] ?? messages[0];
};

const PortfolioBlocksGraphic = () => (
  <div className="relative mx-auto h-40 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
    <div className="space-y-2 p-4 pt-5">
      <div className="h-2 w-16 rounded-full bg-slate-200 dark:bg-slate-600" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-700" />
        <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-700" />
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700" />
      <div className="h-1.5 w-[80%] rounded-full bg-slate-100 dark:bg-slate-700" />
    </div>
    <div className="portfolio-gen-scan-line pointer-events-none absolute inset-x-2 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
    <style jsx>{`
      .portfolio-gen-scan-line {
        animation: portfolio-gen-scan 2.6s ease-in-out infinite;
      }
      @keyframes portfolio-gen-scan {
        0%,
        100% {
          top: 12%;
          opacity: 0.4;
        }
        50% {
          top: 82%;
          opacity: 1;
        }
      }
    `}</style>
  </div>
);

export type PortfolioGenerationLoadingMode = "generate" | "regenerate";

type Props = {
  mode: PortfolioGenerationLoadingMode;
};

export function PortfolioGenerationLoadingPanel({ mode }: Props) {
  const messages = mode === "regenerate" ? PORTFOLIO_REGENERATION_MESSAGES : PORTFOLIO_GENERATION_MESSAGES;
  const statusMessage = useRotatingMessage(messages);
  const title = mode === "regenerate" ? "Regenerating your portfolio" : "Generating your portfolio";
  const subtitle =
    mode === "regenerate"
      ? "Unibot is rebuilding your sections from your latest profile. This can take a minute."
      : "Unibot is drafting a personalised portfolio from your profile. This can take a minute.";

  return (
    <div
      className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white/95 px-6 py-8 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-slate-950/95"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={statusMessage}
    >
      <div className="flex flex-col items-center gap-7">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-brand-500/10 animate-pulse" aria-hidden />
          <div className="relative">
            <PortfolioBlocksGraphic />
            <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow-lg dark:border-slate-900">
              <Sparkles size={18} aria-hidden className="animate-pulse" />
            </div>
          </div>
        </div>

        <div className="w-full space-y-2 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
          <p
            key={statusMessage}
            className="min-h-[2.5rem] text-sm font-medium text-brand-600 dark:text-brand-400 animate-in fade-in slide-in-from-bottom-1 duration-300"
          >
            {statusMessage}
          </p>
        </div>

        <div className="h-0.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden>
          <div className="portfolio-gen-progress h-full w-1/3 rounded-full bg-brand-500" />
          <style jsx>{`
            .portfolio-gen-progress {
              animation: portfolio-gen-progress-slide 1.5s ease-in-out infinite;
            }
            @keyframes portfolio-gen-progress-slide {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(400%);
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
