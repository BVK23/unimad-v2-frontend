"use client";

import React, { useEffect, useState } from "react";
import {
  RESUME_GENERATION_MESSAGES,
  RESUME_GENERATION_MESSAGE_INTERVAL_MS,
  RESUME_GENERATION_TAIL_COUNT,
  type ResumeGenerationMessageVariant,
} from "@/features/resume/constants/resumeGenerationMessages";
import { getPrepareAssetGenerationMessageIndex } from "@/lib/jobs/prepare-asset-generation-messages";
import { Loader2 } from "lucide-react";

interface ResumeGenerationOverlayProps {
  variant: ResumeGenerationMessageVariant;
}

const ResumeGenerationMessageRotator: React.FC<{ variant: ResumeGenerationMessageVariant }> = ({ variant }) => {
  const messages = RESUME_GENERATION_MESSAGES[variant];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setStep(0), 0);
    return () => window.clearTimeout(id);
  }, [variant]);

  useEffect(() => {
    if (messages.length <= 1) return undefined;

    const id = window.setInterval(() => {
      setStep(prev => prev + 1);
    }, RESUME_GENERATION_MESSAGE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [messages.length, variant]);

  const index = getPrepareAssetGenerationMessageIndex(messages.length, step, RESUME_GENERATION_TAIL_COUNT);
  const statusLine = messages[index] ?? messages[0];

  return (
    <p
      key={`${variant}-${index}-${step}`}
      className="text-base font-medium text-slate-700 transition-opacity duration-300 dark:text-slate-200"
    >
      {statusLine}
    </p>
  );
};

const ResumeGenerationOverlay: React.FC<ResumeGenerationOverlayProps> = ({ variant }) => {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 backdrop-blur-sm dark:bg-[#1a1a1a]/95"
      aria-busy="true"
      aria-live="polite"
      aria-label="Generating resume"
    >
      <div className="flex max-w-sm flex-col items-center gap-4 px-8 text-center">
        <Loader2 size={36} className="animate-spin text-brand-600" />
        <ResumeGenerationMessageRotator key={variant} variant={variant} />
      </div>
    </div>
  );
};

export default ResumeGenerationOverlay;
