"use client";

import { useEffect, useState } from "react";
import { curtailRationale, formatRoleSuggestion } from "@/components/uniboard-onboarding/helpers";
import {
  getGroundedNicheSuggestions,
  getNicheDiscoveryQuestions,
  refineNicheDiscovery,
  saveOnboardingData,
  type GroundedNicheSuggestion,
  type NicheDiscoveryAnswer,
  type NicheDiscoveryQuestion,
} from "@/lib/actions/onboardingActions";
import { Loader2 } from "lucide-react";

type Props = {
  onDismiss: () => void;
  onSaved: (role: string) => void;
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

export default function UnibotNicheDiscoveryCard({ onDismiss, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"pick" | "qa" | "refining">("pick");
  const [suggestions, setSuggestions] = useState<FormattedSuggestion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manualRole, setManualRole] = useState("");
  const [questions, setQuestions] = useState<NicheDiscoveryQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getGroundedNicheSuggestions()
      .then(res => {
        if (cancelled) return;
        const formatted = formatSuggestions(res.roles ?? []);
        setSuggestions(formatted);
        const ideal = formatted.find(r => r.is_ideal);
        if (ideal) setSelectedId(ideal.id);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load suggestions.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTitle =
    manualRole.trim() || suggestions.find(s => s.id === selectedId)?.displayTitle || suggestions.find(s => s.is_ideal)?.displayTitle || "";

  const startDiscovery = async () => {
    setError(null);
    setMode("refining");
    try {
      const res = await getNicheDiscoveryQuestions(suggestions, { allowRerun: true });
      setQuestions(res.questions);
      setAnswers({});
      setQuestionIndex(0);
      setMode("qa");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start discovery");
      setMode("pick");
    }
  };

  const submitDiscovery = async () => {
    const payload: NicheDiscoveryAnswer[] = questions
      .map(q => ({ question_id: q.id, question: q.text, answer: (answers[q.id] ?? "").trim() }))
      .filter(a => a.answer);
    if (payload.length < questions.length) {
      setError("Please answer all questions.");
      return;
    }
    setMode("refining");
    setError(null);
    try {
      const res = await refineNicheDiscovery(payload, suggestions, { allowRerun: true });
      const formatted = formatSuggestions(res.roles ?? []);
      setSuggestions(formatted);
      const ideal = formatted.find(r => r.is_ideal);
      if (ideal) setSelectedId(ideal.id);
      setManualRole("");
      setMode("pick");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not refine suggestions");
      setMode("qa");
    }
  };

  const handleSave = async () => {
    const primary = selectedTitle.trim();
    if (!primary) return;
    setBusy(true);
    setError(null);
    try {
      const extras = suggestions
        .filter(s => s.id !== selectedId && s.displayTitle !== primary)
        .slice(0, 2)
        .map(s => s.displayTitle);
      await saveOnboardingData("desired_roles", { role: [primary, ...extras] });
      onSaved(primary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save role");
    } finally {
      setBusy(false);
    }
  };

  if (loading || mode === "refining") {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Loader2 size={14} className="animate-spin" />
        Loading niche suggestions…
      </div>
    );
  }

  if (mode === "qa") {
    const current = questions[questionIndex];
    const currentAnswer = current ? (answers[current.id] ?? "") : "";
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Narrow your niche</h3>
        <p className="mt-1 text-xs text-slate-500">
          Question {questionIndex + 1} of {questions.length}
        </p>
        {current ? <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{current.text}</p> : null}
        <textarea
          className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          rows={3}
          value={currentAnswer}
          onChange={e => current && setAnswers(prev => ({ ...prev, [current.id]: e.target.value }))}
          placeholder="Your answer"
        />
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        <div className="mt-4 flex gap-2">
          {questionIndex < questions.length - 1 ? (
            <button
              type="button"
              disabled={!currentAnswer.trim()}
              onClick={() => setQuestionIndex(i => i + 1)}
              className="flex-1 rounded-xl bg-brand-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void submitDiscovery()}
              className="flex-1 rounded-xl bg-brand-600 px-3 py-2 text-xs font-medium text-white"
            >
              See refined roles
            </button>
          )}
          <button type="button" onClick={() => setMode("pick")} className="rounded-xl px-3 py-2 text-xs text-slate-500">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Refine your target role</h3>
      <p className="mt-1 text-xs text-slate-500">Pick a role or answer a few questions to narrow it down.</p>
      <div className="mt-3 grid gap-2">
        {suggestions.slice(0, 5).map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setManualRole("");
              setSelectedId(s.id);
            }}
            className={`rounded-xl border px-3 py-2 text-left text-xs ${
              selectedId === s.id && !manualRole.trim()
                ? "border-brand-500 bg-brand-50 text-brand-900"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            <span className="font-medium">{s.displayTitle}</span>
            {s.displayRationale ? <span className="mt-0.5 block text-slate-500">{s.displayRationale}</span> : null}
          </button>
        ))}
      </div>
      <input
        className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        placeholder="Or type your role"
        value={manualRole}
        onChange={e => setManualRole(e.target.value)}
      />
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={busy || !selectedTitle.trim()}
          onClick={() => void handleSave()}
          className="rounded-xl bg-brand-600 px-3 py-2.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save target role"}
        </button>
        <button type="button" onClick={() => void startDiscovery()} className="text-xs text-brand-600">
          Answer a few questions to narrow it down
        </button>
        <button type="button" onClick={onDismiss} className="text-xs text-slate-500">
          Not now
        </button>
      </div>
    </div>
  );
}
