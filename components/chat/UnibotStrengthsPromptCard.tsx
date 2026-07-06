"use client";

import { useEffect, useState } from "react";
import type { OnboardingOption } from "@/components/uniboard-onboarding/options";
import { STRENGTH_OPTIONS } from "@/components/uniboard-onboarding/options";
import { ONBOARDING_PROMPT_COPY } from "@/features/onboarding/featureGates";
import { normalizePersonalizedStrengthOptions } from "@/features/onboarding/strengths-focus/strength-options";
import type { StrengthsFocusTrigger } from "@/features/onboarding/strengths-focus/useStrengthsFocusStore";
import { getPersonalizedStrengthOptions, saveOnboardingData } from "@/lib/actions/onboardingActions";
import { Loader2 } from "lucide-react";

function toggleStrength(list: string[], id: string, max = 4): string[] {
  if (list.includes(id)) return list.filter(x => x !== id);
  if (list.length >= max) return list;
  return [...list, id];
}

type UnibotStrengthsPromptCardProps = {
  onDismiss: () => void;
  onSaved: () => void;
  trigger?: StrengthsFocusTrigger;
};

export default function UnibotStrengthsPromptCard({ onDismiss, onSaved, trigger = "general" }: UnibotStrengthsPromptCardProps) {
  const copy = ONBOARDING_PROMPT_COPY.strengths;
  const [options, setOptions] = useState<OnboardingOption[]>(STRENGTH_OPTIONS);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setOptionsLoading(true);
    void getPersonalizedStrengthOptions(trigger)
      .then(personalized => {
        if (cancelled) return;
        const normalized = normalizePersonalizedStrengthOptions(personalized);
        setOptions(normalized.length > 0 ? normalized : STRENGTH_OPTIONS);
      })
      .catch(() => {
        if (!cancelled) setOptions(STRENGTH_OPTIONS);
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trigger]);

  const handleSave = async () => {
    if (selected.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await saveOnboardingData("personalization_profile", {
        profile: {
          strengths: selected,
          tier: 3,
          updated_at: new Date().toISOString(),
        },
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save strengths");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{copy.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{copy.body}</p>
      {optionsLoading ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <Loader2 size={14} className="animate-spin" />
          Personalising options for you…
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {options.map(opt => {
            const isSelected = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={busy}
                onClick={() => setSelected(prev => toggleStrength(prev, opt.id))}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                  isSelected
                    ? "border-brand-500 bg-brand-50 text-brand-900 dark:border-brand-400 dark:bg-brand-950/40 dark:text-brand-100"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
      {error ? (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={busy || optionsLoading || selected.length === 0}
          onClick={() => void handleSave()}
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-3 py-2.5 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : copy.cta}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDismiss}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          Do it later
        </button>
      </div>
    </div>
  );
}

export const UNIBOT_STRENGTHS_NUDGE_DISMISS_KEY = "unibot_strengths_nudge_dismissed";
