"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Mic2 } from "lucide-react";

const LAUNCH_STEPS = [
  "Processing your request…",
  "Preparing your interview questions…",
  "Getting your screen ready…",
  "Setting up your microphone…",
  "Connecting you to your AI interviewer…",
  "Almost there…",
];

interface InterviewLaunchOverlayProps {
  error?: string | null;
  onDismissError?: () => void;
}

const InterviewLaunchOverlay: React.FC<InterviewLaunchOverlayProps> = ({ error, onDismissError }) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (error) return;
    const interval = window.setInterval(() => {
      setStepIndex(prev => (prev + 1) % LAUNCH_STEPS.length);
    }, 2400);
    return () => window.clearInterval(interval);
  }, [error]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-white/95 p-8 backdrop-blur-sm dark:bg-[#0a0a0a]/95">
      <div className="flex max-w-sm flex-col items-center text-center">
        {error ? (
          <>
            <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
            {onDismissError ? (
              <button
                type="button"
                onClick={onDismissError}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
              >
                Back
              </button>
            ) : null}
          </>
        ) : (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-blue-500/15 blur-xl" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40">
                <Mic2 className="h-7 w-7 text-blue-600" />
              </div>
              <Loader2 className="absolute -bottom-1 -right-1 h-6 w-6 animate-spin text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">Starting interview prep</h3>
            <p key={stepIndex} className="animate-in fade-in text-sm font-light text-slate-600 duration-500 dark:text-slate-400">
              {LAUNCH_STEPS[stepIndex]}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewLaunchOverlay;
