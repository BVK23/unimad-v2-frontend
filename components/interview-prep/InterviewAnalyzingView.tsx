"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

const ANALYZING_STEPS = [
  "Reviewing your answers…",
  "Matching responses to interview criteria…",
  "Scoring clarity, structure, and relevance…",
  "Identifying strengths and gaps in your delivery…",
  "Generating personalized feedback for each question…",
  "Calculating your overall interview score…",
  "Polishing coaching tips you can use on the real interview…",
  "Almost there — finalizing your report…",
];

const InterviewAnalyzingView: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStepIndex(prev => (prev + 1) % ANALYZING_STEPS.length);
    }, 2800);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-8 p-8 font-sans">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl" />
        <Loader2 className="relative h-12 w-12 animate-spin text-blue-600" />
      </div>

      <div className="max-w-md text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
          <Sparkles size={12} />
          Analyzing your mock interview
        </div>
        <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">Building your feedback report</h3>
        <p key={stepIndex} className="animate-in fade-in text-sm font-light text-slate-600 duration-500 dark:text-slate-400">
          {ANALYZING_STEPS[stepIndex]}
        </p>
      </div>

      <div className="flex w-full max-w-xs gap-1.5">
        {ANALYZING_STEPS.slice(0, 5).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
              i <= stepIndex % 5 ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>

      <p className="max-w-sm text-center text-xs text-slate-400">
        This usually takes under a minute. We&apos;re using AI to score your answers and write actionable feedback.
      </p>
    </div>
  );
};

export default InterviewAnalyzingView;
