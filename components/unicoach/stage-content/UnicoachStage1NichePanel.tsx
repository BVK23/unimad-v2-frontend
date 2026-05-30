"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  UNICOACH_EDUCATION_EXAMPLE,
  UNICOACH_QUESTIONS_1_3,
  UNICOACH_QUESTIONS_4_6,
  UNICOACH_STAGE1_ONBOARDING_VIDEO_URL,
  UNICOACH_WORK_EXAMPLE,
} from "@/constants/unicoach-niche-content";
import {
  useGenerateNicheMutation,
  useUnicoachModuleData,
  useUpdateUnicoachModuleMutation,
} from "@/features/unicoach/hooks/use-unicoach-module-data";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

type Props = {
  targetUserId?: string | null;
  readOnly?: boolean;
};

function Section({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50"
      >
        <span className="text-sm font-medium text-slate-900 dark:text-white">{title}</span>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open ? <div className="border-t border-slate-100 dark:border-slate-800 px-3 pb-3 pt-2">{children}</div> : null}
    </div>
  );
}

export const UnicoachStage1NichePanel: React.FC<Props> = ({ targetUserId, readOnly = false }) => {
  const { data, isLoading } = useUnicoachModuleData(true, targetUserId);
  const updateMutation = useUpdateUnicoachModuleMutation(targetUserId);
  const generateMutation = useGenerateNicheMutation(targetUserId);
  const [open, setOpen] = useState<Record<string, boolean>>({ intro: true, education: true });

  const niche = data?.niche;
  const education = niche?.education?.length ? niche.education : UNICOACH_EDUCATION_EXAMPLE.map(r => ["", "", ""]);
  const qa = niche?.question_answers ?? {};

  const experiences = useMemo(() => {
    const raw = niche?.experiences;
    if (!Array.isArray(raw) || raw.length === 0) return UNICOACH_WORK_EXAMPLE.map(r => ["", ""]);
    return raw.map(row => (Array.isArray(row) ? row : [row.company ?? "", row.enjoyment ?? ""]));
  }, [niche?.experiences]);

  const saveEducation = useCallback(
    (rows: string[][]) => {
      if (readOnly) return;
      void updateMutation.mutateAsync({ mode: "education", data: rows });
    },
    [readOnly, updateMutation]
  );

  const saveQuestion = useCallback(
    (qKey: string, answer: string) => {
      if (readOnly) return;
      void updateMutation.mutateAsync({
        mode: "question_answers",
        data: [{ id: qKey, answer }],
      });
    },
    [readOnly, updateMutation]
  );

  const saveExperiences = useCallback(
    (rows: string[][]) => {
      if (readOnly) return;
      void updateMutation.mutateAsync({ mode: "experiences", data: rows });
    },
    [readOnly, updateMutation]
  );

  const nicheAnalysis = niche?.niche_analysis;
  const canGenerate =
    education.some(r => r.some(c => c.trim())) &&
    UNICOACH_QUESTIONS_1_3.some((_, i) => (qa[`q${i + 1}`] ?? "").trim()) &&
    experiences.some(r => r[0]?.trim());

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading niche worksheet…</p>;
  }

  return (
    <div className="space-y-4">
      <Section title="Stage 1 onboarding" open={open.intro} onToggle={() => setOpen(o => ({ ...o, intro: !o.intro }))}>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          Applying to every role can keep you jobless. Use this framework to define your niche before Call 1.
        </p>
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
          <video src={UNICOACH_STAGE1_ONBOARDING_VIDEO_URL} controls className="h-full w-full object-cover" preload="metadata" />
        </div>
      </Section>

      <Section title="Add your education" open={open.education} onToggle={() => setOpen(o => ({ ...o, education: !o.education }))}>
        <p className="text-xs text-slate-500 mb-3">Include academic history, courses, and certifications.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-2 pr-2 font-medium">Education</th>
                <th className="pb-2 pr-2 font-medium">Domain</th>
                <th className="pb-2 font-medium">Was it fun?</th>
              </tr>
            </thead>
            <tbody>
              {education.map((row, ri) => (
                <tr key={ri}>
                  {[0, 1, 2].map(ci => (
                    <td key={ci} className="pb-2 pr-2">
                      <input
                        disabled={readOnly}
                        defaultValue={row[ci] ?? ""}
                        onBlur={e => {
                          const next = education.map((r, i) => (i === ri ? [...r] : [...r]));
                          next[ri][ci] = e.target.value;
                          saveEducation(next);
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-600 dark:bg-slate-900"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Answer a few questions"
        open={Boolean(open.questions)}
        onToggle={() => setOpen(o => ({ ...o, questions: !o.questions }))}
      >
        <div className="space-y-3">
          {UNICOACH_QUESTIONS_1_3.map((q, i) => (
            <div key={q}>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{q}</label>
              <textarea
                disabled={readOnly}
                defaultValue={qa[`q${i + 1}`] ?? ""}
                rows={3}
                onBlur={e => saveQuestion(`q${i + 1}`, e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Add your work experiences" open={Boolean(open.work)} onToggle={() => setOpen(o => ({ ...o, work: !o.work }))}>
        <div className="space-y-2">
          {experiences.map((row, ri) => (
            <div key={ri} className="grid gap-2 sm:grid-cols-2">
              <input
                disabled={readOnly}
                placeholder="Role / company"
                defaultValue={row[0] ?? ""}
                onBlur={e => {
                  const next = experiences.map(r => [...r]);
                  next[ri][0] = e.target.value;
                  saveExperiences(next);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              <input
                disabled={readOnly}
                placeholder="Enjoyment (Hell yeah / Perhaps yes / Nah never)"
                defaultValue={row[1] ?? ""}
                onBlur={e => {
                  const next = experiences.map(r => [...r]);
                  next[ri][1] = e.target.value;
                  saveExperiences(next);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Research niche activity" open={Boolean(open.market)} onToggle={() => setOpen(o => ({ ...o, market: !o.market }))}>
        <div className="space-y-3">
          {UNICOACH_QUESTIONS_4_6.map((q, i) => (
            <div key={q}>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{q}</label>
              <textarea
                disabled={readOnly}
                defaultValue={qa[`q${i + 4}`] ?? ""}
                rows={3}
                onBlur={e => saveQuestion(`q${i + 4}`, e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Generate your niche" open={Boolean(open.niche)} onToggle={() => setOpen(o => ({ ...o, niche: !o.niche }))}>
        {!readOnly ? (
          <button
            type="button"
            disabled={!canGenerate || generateMutation.isPending}
            onClick={() => void generateMutation.mutateAsync()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Sparkles size={16} />
            {generateMutation.isPending ? "Generating…" : "Generate niche"}
          </button>
        ) : null}
        {nicheAnalysis?.ideal_role ? (
          <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 p-3 dark:border-brand-900 dark:bg-brand-950/40">
            <p className="text-[10px] uppercase tracking-wide text-brand-600 dark:text-brand-400">Ideal role</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{nicheAnalysis.ideal_role}</p>
            {Array.isArray(nicheAnalysis.roles) && nicheAnalysis.roles.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {nicheAnalysis.roles.map((r, i) => (
                  <li key={i}>
                    <span className="font-medium">{r.role}</span>
                    {r.reason ? ` — ${r.reason}` : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Complete the sections above, then generate your niche.</p>
        )}
      </Section>
    </div>
  );
};
