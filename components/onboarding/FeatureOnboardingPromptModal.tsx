"use client";

import React from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { ONBOARDING_PROMPT_COPY, onboardingHref, type OnboardingPromptKind } from "@/features/onboarding/featureGates";
import { useNicheDiscoveryStore } from "@/features/onboarding/niche-discovery/useNicheDiscoveryStore";
import { X } from "lucide-react";
import Link from "next/link";

type FeatureOnboardingPromptModalProps = {
  open: boolean;
  kind: OnboardingPromptKind;
  onDismiss: () => void;
};

export default function FeatureOnboardingPromptModal({ open, kind, onDismiss }: FeatureOnboardingPromptModalProps) {
  if (!open) return null;

  const copy = ONBOARDING_PROMPT_COPY[kind];

  return (
    <ModalPortalOverlay tier="nested" className="flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <h2 className="pr-8 text-lg font-semibold text-slate-900 dark:text-white">{copy.title}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{copy.body}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {kind === "niche" ? (
            <button
              type="button"
              onClick={() => {
                useNicheDiscoveryStore.getState().enter();
                onDismiss();
              }}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              {copy.cta}
            </button>
          ) : (
            <Link
              href={onboardingHref(kind)}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              {copy.cta}
            </Link>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Not now
          </button>
        </div>
      </div>
    </ModalPortalOverlay>
  );
}
