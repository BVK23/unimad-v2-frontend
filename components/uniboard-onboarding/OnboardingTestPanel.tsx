"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ONBOARDING_STEP_LABELS,
  ONBOARDING_STEP_ORDER,
  ONBOARDING_TEST_QUICK_LINKS,
  type OnboardingStepKey,
  type OnboardingTestAnswers,
  type OnboardingTestConfig,
  type OnboardingTestPreset,
} from "./testMode";

type OnboardingTestPanelProps = {
  config: OnboardingTestConfig;
  currentStep: OnboardingStepKey;
  answers: OnboardingTestAnswers;
  onJumpToStep: (step: OnboardingStepKey, answers: OnboardingTestAnswers) => void;
  onSkipSaveChange: (skip: boolean) => void;
  onMockNicheChange: (mock: boolean) => void;
};

const PRESETS: { id: OnboardingTestPreset; label: string; hint: string }[] = [
  { id: "blank", label: "Blank", hint: "Empty answers, welcome step" },
  { id: "explorer", label: "Explorer", hint: "just_exploring only, skips niche and enters app" },
  { id: "job_seeker", label: "Job seeker", hint: "Full path, at personalize opt-in" },
  { id: "post_niche", label: "Post-niche", hint: "Resume path done, at strengths (no picks yet)" },
  { id: "personalized", label: "Personalized", hint: "Tier 3 answers filled — jump to any late step" },
  { id: "existing_user", label: "Existing user", hint: "No intent answers yet — simulates backfill" },
];

export default function OnboardingTestPanel({
  config,
  currentStep,
  answers,
  onJumpToStep,
  onSkipSaveChange,
  onMockNicheChange,
}: OnboardingTestPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("test", "1");
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) params.delete(key);
        else params.set(key, value);
      }
      router.replace(`/uniboard/onboarding?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const applyPreset = (preset: OnboardingTestPreset) => {
    updateParams({ preset, step: null });
    router.refresh();
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-[200] rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-lg"
      >
        Test mode
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] max-h-[45vh] overflow-y-auto border-t border-amber-300 bg-amber-50/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Dev test mode</p>
            <p className="mt-0.5 text-[11px] text-amber-900/80">
              Logged-in only · saves {config.skipSave ? "off" : "on"} · niche API {config.mockNiche ? "mocked" : "live"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="shrink-0 rounded-lg px-2 py-1 text-xs text-amber-800 hover:bg-amber-100"
          >
            Hide
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              title={p.hint}
              onClick={() => applyPreset(p.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                config.preset === p.id ? "bg-amber-600 text-white" : "bg-white text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ONBOARDING_TEST_QUICK_LINKS.map(link => (
            <button
              key={link.label}
              type="button"
              onClick={() => router.replace(`/uniboard/onboarding?${link.query}`, { scroll: false })}
              className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-[#346DE0] ring-1 ring-[#346DE0]/25 hover:bg-[#F0F6FE]"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {ONBOARDING_STEP_ORDER.map(step => (
            <button
              key={step}
              type="button"
              onClick={() => onJumpToStep(step, answers)}
              className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                currentStep === step ? "bg-[#346DE0] text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {ONBOARDING_STEP_LABELS[step]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-amber-900">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={config.skipSave}
              onChange={e => {
                onSkipSaveChange(e.target.checked);
                updateParams({ save: e.target.checked ? null : "1" });
              }}
            />
            Skip API saves
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={config.mockNiche}
              onChange={e => {
                onMockNicheChange(e.target.checked);
                updateParams({ mockNiche: e.target.checked ? null : "0" });
              }}
            />
            Mock niche suggestions
          </label>
          <span className="text-amber-800/70">
            Turn on <strong>saves</strong> to test Enter Unimad / skip flows against the API.
          </span>
        </div>
      </div>
    </div>
  );
}
