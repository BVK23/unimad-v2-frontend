"use client";

import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const ANALYZING_STEPS = [
  "Analysing your answers…",
  "Matching responses to your profile…",
  "Scoring your interview attempt…",
  "Crafting personalised feedback…",
  "Polishing coaching tips for your next round…",
  "Almost there — finalising your report…",
];

type InterviewAnalyzingViewProps = {
  /** Full-screen overlay matching the active interview session UI */
  variant?: "fullscreen" | "inline";
};

const InterviewAnalyzingView: React.FC<InterviewAnalyzingViewProps> = ({ variant = "fullscreen" }) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStepIndex(prev => (prev + 1) % ANALYZING_STEPS.length);
    }, 2400);
    return () => window.clearInterval(interval);
  }, []);

  const content = (
    <div className="flex max-w-lg flex-col items-center gap-8 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-blue-500/20" />
          <div className="relative h-12 w-12 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
        </div>
      </div>

      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-blue-300">
          <Sparkles size={12} />
          Processing interview
        </div>
        <h3 className="mb-3 text-2xl font-semibold text-white sm:text-3xl">Building your feedback</h3>
        <p key={stepIndex} className="animate-in fade-in text-base font-light text-slate-300 duration-500 sm:text-lg">
          {ANALYZING_STEPS[stepIndex]}
        </p>
      </div>

      <div className="flex w-full max-w-xs gap-1.5">
        {ANALYZING_STEPS.slice(0, 4).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= stepIndex % 4 ? "bg-blue-500" : "bg-white/10"}`}
          />
        ))}
      </div>

      <p className="max-w-sm text-sm text-slate-500">This usually takes under a minute. Please keep this tab open.</p>
    </div>
  );

  if (variant === "inline") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 font-sans">
        <div className="text-slate-900 dark:text-white">{content}</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden bg-[#0B1121] px-6 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
        <div className="h-[520px] w-[520px] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>
      <div className="relative z-10">{content}</div>
    </div>
  );
};

export default InterviewAnalyzingView;
