"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getGroundedNicheSuggestions,
  getNicheDiscoveryQuestions,
  refineNicheDiscovery,
  type GroundedNicheSuggestion,
  type NicheDiscoveryAnswer,
  type NicheDiscoveryQuestion,
} from "@/lib/actions/onboardingActions";
import { Sparkles } from "lucide-react";
import { curtailRationale, formatRoleSuggestion } from "./helpers";
import { GhostButton, NICHE_LOADING_MESSAGES, OnboardingLoadingScreen, OptionCard, PrimaryButton, QuestionHeader, TextField } from "./ui";

type NicheStepProps = {
  name: string;
  onNext: (selectedRole: string, allRoles: string[]) => void;
  mockRoles?: GroundedNicheSuggestion[];
  /** Reserved: discovery Q&A always uses the live API when backend is reachable. */
  liveDiscovery?: boolean;
};

type FormattedSuggestion = GroundedNicheSuggestion & {
  displayTitle: string;
  displayRationale: string;
};

type StepMode = "suggestions" | "discovery_qa" | "discovery_loading";

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

function SuggestionCards({
  suggestions,
  selectedId,
  manualRole,
  onSelect,
}: {
  suggestions: FormattedSuggestion[];
  selectedId: string | null;
  manualRole: string;
  onSelect: (id: string) => void;
}) {
  const ideal = suggestions.find(s => s.is_ideal) ?? suggestions[0];
  const alts = suggestions.filter(s => s.id !== ideal?.id);

  return (
    <>
      {ideal ? (
        <div className="w-full rounded-[16px] border-2 border-[#346DE0] bg-gradient-to-br from-[#F0F6FE] to-white p-5 text-left">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-[#346DE0]" />
            <span className="text-xs font-bold uppercase tracking-wide text-[#346DE0]">Top match</span>
          </div>
          <button
            type="button"
            onClick={() => onSelect(ideal.id)}
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
              onClick={() => onSelect(alt.id)}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

export default function NicheStep({ name, onNext, mockRoles, liveDiscovery = true }: NicheStepProps) {
  const [mode, setMode] = useState<StepMode>("suggestions");
  const [loading, setLoading] = useState(!mockRoles?.length);
  const [suggestions, setSuggestions] = useState<FormattedSuggestion[]>(() => (mockRoles?.length ? formatSuggestions(mockRoles) : []));
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const ideal = mockRoles?.find(r => r.is_ideal) ?? mockRoles?.[0];
    return ideal?.id ?? null;
  });
  const [manualRole, setManualRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [discoveryUsed, setDiscoveryUsed] = useState(false);

  const [questions, setQuestions] = useState<NicheDiscoveryQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);

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
        if (!cancelled) setError("Could not load suggestions. Enter your role below.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mockRoles]);

  const selectedTitle = useMemo(() => {
    if (manualRole.trim()) return manualRole.trim();
    const picked = suggestions.find(s => s.id === selectedId);
    const ideal = suggestions.find(s => s.is_ideal) ?? suggestions[0];
    return picked?.displayTitle ?? ideal?.displayTitle ?? "";
  }, [manualRole, selectedId, suggestions]);

  const handleContinue = () => {
    const primary = selectedTitle.trim();
    const extras = suggestions
      .filter(s => s.id !== selectedId && s.displayTitle !== primary)
      .slice(0, 2)
      .map(s => s.displayTitle);
    onNext(primary, [primary, ...extras]);
  };

  const startDiscovery = async () => {
    setError(null);
    setMode("discovery_loading");
    try {
      const res = await getNicheDiscoveryQuestions(suggestions);
      setQuestions(res.questions);
      setAnswers({});
      setQuestionIndex(0);
      setMode("discovery_qa");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start discovery");
      setMode("suggestions");
    }
  };

  const submitDiscovery = async () => {
    const payload: NicheDiscoveryAnswer[] = questions
      .map(q => ({
        question_id: q.id,
        question: q.text,
        answer: (answers[q.id] ?? "").trim(),
      }))
      .filter(a => a.answer);

    if (payload.length < questions.length) {
      setError("Please answer all questions before continuing.");
      return;
    }

    setError(null);
    setMode("discovery_loading");
    try {
      const res = await refineNicheDiscovery(payload, suggestions);
      const formatted = formatSuggestions(res.roles ?? []);
      setSuggestions(formatted);
      const ideal = formatted.find(r => r.is_ideal);
      if (ideal) setSelectedId(ideal.id);
      setManualRole("");
      setDiscoveryUsed(true);
      setMode("suggestions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not refine suggestions");
      setMode("discovery_qa");
    }
  };

  if (loading || mode === "discovery_loading") {
    return <OnboardingLoadingScreen messages={NICHE_LOADING_MESSAGES} intervalMs={1400} />;
  }

  if (mode === "discovery_qa") {
    const current = questions[questionIndex];
    const currentAnswer = current ? (answers[current.id] ?? "") : "";
    const allAnswered = questions.every(q => (answers[q.id] ?? "").trim());

    return (
      <div className="flex flex-col items-center gap-6">
        <QuestionHeader title="Let's narrow it down" subtitle={`Question ${questionIndex + 1} of ${questions.length}`} />
        {current ? (
          <div className="w-full max-w-md rounded-[16px] border border-[rgba(12,15,26,0.12)] bg-white p-5 text-left">
            <p className="text-[15px] font-medium text-[#0C0F1A]">{current.text}</p>
            {current.options && current.options.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {current.options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswers(prev => ({ ...prev, [current.id]: opt }))}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      currentAnswer === opt
                        ? "border-[#346DE0] bg-[#346DE0] text-white"
                        : "border-[rgba(12,15,26,0.12)] bg-[#F8FAFC] text-[#0C0F1A] hover:border-[#346DE0]/40"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="mt-4">
              <TextField
                value={currentAnswer}
                onChange={v => setAnswers(prev => ({ ...prev, [current.id]: v }))}
                placeholder="Or type your answer"
                autoFocus
              />
            </div>
          </div>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex w-full max-w-md flex-col gap-2.5">
          {questionIndex < questions.length - 1 ? (
            <PrimaryButton
              fullWidth
              disabled={!currentAnswer.trim()}
              onClick={() => {
                setError(null);
                setQuestionIndex(i => i + 1);
              }}
            >
              Next question
            </PrimaryButton>
          ) : (
            <PrimaryButton fullWidth disabled={!allAnswered} onClick={() => void submitDiscovery()}>
              See refined suggestions
            </PrimaryButton>
          )}
          <GhostButton
            fullWidth
            onClick={() => {
              if (questionIndex > 0) setQuestionIndex(i => i - 1);
              else setMode("suggestions");
            }}
          >
            Back
          </GhostButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <QuestionHeader
        title={name.trim() ? `${name.trim()}, here's your suggested niche` : "Your suggested niche"}
        subtitle="Pick the role that feels closest. We'll personalise Unibot around it."
      />

      {error ? <p className="text-sm text-amber-700">{error}</p> : null}

      <SuggestionCards
        suggestions={suggestions}
        selectedId={selectedId}
        manualRole={manualRole}
        onSelect={id => {
          setManualRole("");
          setSelectedId(id);
        }}
      />

      <div className="w-full max-w-md space-y-2">
        <p className="text-sm font-medium text-[#4A5568]">Not quite right?</p>
        <TextField
          placeholder="Enter your desired role"
          value={manualRole}
          onChange={v => {
            setManualRole(v);
            if (v.trim()) setSelectedId(null);
          }}
          onEnter={() => {
            if (selectedTitle.trim()) handleContinue();
          }}
        />
        {!discoveryUsed ? (
          <div className="flex items-center gap-2 text-sm text-[#4A5568]">
            <span>or</span>
            <button type="button" onClick={() => void startDiscovery()} className="font-medium text-[#346DE0] hover:underline">
              Answer a few questions to narrow it down
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex w-full max-w-md flex-col gap-2.5">
        <PrimaryButton fullWidth disabled={!selectedTitle.trim()} onClick={handleContinue}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
