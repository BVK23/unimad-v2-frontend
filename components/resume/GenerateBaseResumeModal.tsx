"use client";

import React from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { dismissPostOnboardingGenerateResumePrompt } from "@/features/resume/constants/resumeOnboardingPrompt";

type GenerateBaseResumeModalProps = {
  open: boolean;
  busy?: boolean;
  onDismiss: () => void;
  onGenerate: () => void;
};

export default function GenerateBaseResumeModal({ open, busy = false, onDismiss, onGenerate }: GenerateBaseResumeModalProps) {
  if (!open) return null;

  const handleDismiss = () => {
    dismissPostOnboardingGenerateResumePrompt();
    onDismiss();
  };

  return (
    <ModalPortalOverlay tier="nested" className="flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Generate your first resume?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          You&apos;ve finished onboarding. Want Unibot to build your base resume from the profile details you added?
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
          >
            Start on my own
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Yes, generate resume
          </button>
        </div>
      </div>
    </ModalPortalOverlay>
  );
}
