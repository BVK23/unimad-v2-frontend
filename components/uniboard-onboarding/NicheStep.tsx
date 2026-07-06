"use client";

import { useEffect, useMemo, useState } from "react";
import { getGroundedNicheSuggestions } from "@/lib/actions/onboardingActions";
import type { GroundedNicheSuggestion } from "@/lib/actions/onboardingActions";
import { Sparkles } from "lucide-react";
import { curtailRationale, formatRoleSuggestion } from "./helpers";
import { NICHE_LOADING_MESSAGES, OnboardingLoadingScreen, OptionCard, PrimaryButton, QuestionHeader, TextField } from "./ui";

type NicheStepProps = {
  name: string;
  onNext: (selectedRole: string, allRoles: string[]) => void;
  /** Dev test mode — skip API and use fixed suggestions. */
  mockRoles?: GroundedNicheSuggestion[];
};

type FormattedSuggestion = GroundedNicheSuggestion & {
  displayTitle: string;
  displayRationale: string;
};

function formatSuggestions(roles: GroundedNicheSuggestion[]): FormattedSuggestion[] {
  return roles.map(role => {
    const formatted = formatRoleSuggestion(role.title, role.rationale);
    return {
      ...role,
      displayTitle: formatted.title,
      displayRationale: curtailRationale(formatted.rationale),
    };
  });
}

export default function NicheStep({ name, onNext, mockRoles }: NicheStepProps) {
  const [loading, setLoading] = useState(!mockRoles?.length);
  const [suggestions, setSuggestions] = useState<FormattedSuggestion[]>(() => (mockRoles?.length ? formatSuggestions(mockRoles) : []));
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const ideal = mockRoles?.find(r => r.is_ideal) ?? mockRoles?.[0];
    return ideal?.id ?? null;
  });
  const [manualRole, setManualRole] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mockRoles?.length) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await getGroundedNicheSuggestions();
        if (!cancelled) {
          const formatted = formatSuggestions(res.roles ?? []);
          setSuggestions(formatted);
          const ideal = formatted.find(r => r.is_ideal);
          if (ideal) setSelectedId(ideal.id);
        }
      } catch {
        if (!cancelled) setError("Could not load suggestions. Type your role below.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mockRoles]);

  const ideal = suggestions.find(s => s.is_ideal) ?? suggestions[0];
  const alts = suggestions.filter(s => s.id !== ideal?.id);

  const selectedTitle = useMemo(() => {
    if (manualRole.trim()) return manualRole.trim();
    const picked = suggestions.find(s => s.id === selectedId);
    return picked?.displayTitle ?? ideal?.displayTitle ?? "";
  }, [manualRole, selectedId, suggestions, ideal]);

  if (loading) {
    return <OnboardingLoadingScreen messages={NICHE_LOADING_MESSAGES} intervalMs={1400} />;
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <QuestionHeader
        title={name.trim() ? `${name.trim()}, here's your suggested niche` : "Your suggested niche"}
        subtitle="Pick the role that feels closest : we'll personalise Unibot around it."
      />

      {error ? <p className="text-sm text-amber-700">{error}</p> : null}

      {ideal ? (
        <div className="w-full rounded-[16px] border-2 border-[#346DE0] bg-gradient-to-br from-[#F0F6FE] to-white p-5 text-left">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-[#346DE0]" />
            <span className="text-xs font-bold uppercase tracking-wide text-[#346DE0]">Top match</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setManualRole("");
              setSelectedId(ideal.id);
            }}
            className={`w-full rounded-[12px] p-4 text-left transition-colors ${
              selectedId === ideal.id && !manualRole.trim() ? "bg-[#346DE0] text-white" : "bg-white/80"
            }`}
          >
            <p className="text-lg font-bold">{ideal.displayTitle}</p>
            {ideal.displayRationale ? (
              <p
                className={`mt-1.5 line-clamp-2 text-sm leading-snug ${
                  selectedId === ideal.id && !manualRole.trim() ? "text-white/90" : "text-[#4A5568]"
                }`}
              >
                {ideal.displayRationale}
              </p>
            ) : null}
          </button>
        </div>
      ) : null}

      {alts.length > 0 ? (
        <div className="grid w-full gap-2.5 sm:grid-cols-2">
          {alts.map(alt => (
            <OptionCard
              key={alt.id}
              label={alt.displayTitle}
              description={alt.displayRationale}
              selected={selectedId === alt.id && !manualRole.trim()}
              onClick={() => {
                setManualRole("");
                setSelectedId(alt.id);
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="w-full max-w-md">
        <TextField placeholder="Not quite right? Type your role" value={manualRole} onChange={setManualRole} />
      </div>

      <div className="flex w-full max-w-md flex-col gap-2.5">
        <PrimaryButton
          fullWidth
          disabled={!selectedTitle.trim()}
          onClick={() => {
            const primary = selectedTitle.trim();
            const extras = suggestions
              .filter(s => s.id !== selectedId && s.displayTitle !== primary)
              .slice(0, 2)
              .map(s => s.displayTitle);
            onNext(primary, [primary, ...extras]);
          }}
        >
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
