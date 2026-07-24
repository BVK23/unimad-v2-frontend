"use client";

import React, { useState } from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { dismissResumeOnboardingPrompt } from "@/features/resume/constants/resumeOnboardingPrompt";
import { syncResumeToProfile } from "@/features/resume/server-actions/resume-actions";
import { profileQk } from "@/features/user-profile/hooks/use-profile-data";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

type ResumeCompleteOnboardingModalProps = {
  open: boolean;
  resumeId: string;
  onDismiss: () => void;
};

export default function ResumeCompleteOnboardingModal({ open, resumeId, onDismiss }: ResumeCompleteOnboardingModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleDismiss = () => {
    dismissResumeOnboardingPrompt();
    onDismiss();
  };

  const handleContinue = async () => {
    if (!resumeId) return;
    setBusy(true);
    setError(null);
    try {
      await syncResumeToProfile(resumeId);
      void queryClient.invalidateQueries({ queryKey: profileQk.profile });
      onDismiss();
      router.refresh();
      router.push("/uniboard/onboarding?entry=niche");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your profile. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalPortalOverlay tier="nested" className="flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <button
          type="button"
          onClick={handleDismiss}
          disabled={busy}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 className="pr-8 text-lg font-semibold text-slate-900 dark:text-white">Complete onboarding from this resume?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          We&apos;ll use this resume to fill your profile, then take you to choose your target role (niche) so Unibot can personalise
          everything for you.
        </p>

        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            Continue to niche
          </button>
        </div>
      </div>
    </ModalPortalOverlay>
  );
}
