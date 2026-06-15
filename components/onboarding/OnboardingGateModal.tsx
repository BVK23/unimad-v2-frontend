"use client";

import React from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { MODAL_OVERLAY_ABOVE_MENU_Z_CLASS } from "@/lib/ui/modal-overlay";
import { X } from "lucide-react";
import Link from "next/link";

type OnboardingGateModalProps = {
  open: boolean;
  userName?: string;
  onDismiss?: () => void;
  /** When true, user can dismiss and stay on the page (studio/jobs). When false, modal blocks the feature page. */
  dismissible?: boolean;
};

export default function OnboardingGateModal({ open, userName, onDismiss, dismissible = false }: OnboardingGateModalProps) {
  if (!open) return null;

  const heading = userName ? `Hi ${userName}, finish setting up your profile` : "Complete your onboarding";

  return (
    <ModalPortalOverlay
      className="flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      zClass={MODAL_OVERLAY_ABOVE_MENU_Z_CLASS}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-gate-title"
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        {dismissible ? (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        ) : null}

        <h2 id="onboarding-gate-title" className="text-lg font-semibold text-slate-900 dark:text-white pr-8">
          {heading}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Please finish onboarding first to get personalised help across Resume, Portfolio, Studio, and job applications.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/onboarding"
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Go to Onboarding
          </Link>
          {dismissible ? (
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Stay on this page
            </button>
          ) : (
            <Link
              href="/uniboard/resume"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Go to Resume
            </Link>
          )}
        </div>
      </div>
    </ModalPortalOverlay>
  );
}
