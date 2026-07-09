"use client";

import React, { useState } from "react";
import { OnboardingGateTooltip } from "@/components/ui/OnboardingGateTooltip";
import { FINISH_ONBOARDING_CTA } from "@/constants/onboarding-tooltips";
import type { InterviewRoundType, InterviewSessionMode } from "@/src/features/interview-prep/types";
import type { Job } from "@/types/jobs";
import { Mic2, ChevronRight, Loader2, AlertCircle, MessageSquare, Radio } from "lucide-react";

const ROUNDS: { id: InterviewRoundType; label: string; description: string }[] = [
  { id: "screening", label: "Screening", description: "Intro, motivation, and fit" },
  { id: "technical", label: "Technical", description: "Skills, problem-solving, depth" },
  { id: "behavioral", label: "Behavioral", description: "STAR stories and soft skills" },
];

interface PrepareInterviewPanelProps {
  job: Job;
  isStarting?: boolean;
  onStart: (payload: { roundType: InterviewRoundType; mode: InterviewSessionMode }) => void;
  /** When true, start CTA is disabled (e.g. onboarding incomplete). */
  generateDisabled?: boolean;
}

const PrepareInterviewPanel: React.FC<PrepareInterviewPanelProps> = ({ job, isStarting = false, onStart, generateDisabled = false }) => {
  const [roundType, setRoundType] = useState<InterviewRoundType>("technical");
  const [mode, setMode] = useState<InterviewSessionMode>("questions");
  const startBlocked = isStarting || generateDisabled;

  return (
    <div className="flex h-full flex-col overflow-y-auto font-sans">
      <div className="mb-6">
        <h3 className="text-lg font-medium tracking-tight text-slate-900 dark:text-white">Practice for this role</h3>
        <p className="mt-1 text-sm font-light text-slate-500 dark:text-slate-400">
          Mock interview using this application&apos;s company, role, and job description.
        </p>
      </div>

      {!job.description?.trim() && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>No job description on this application — we&apos;ll use the role and company. Add a JD for better questions.</span>
        </div>
      )}

      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">Interview round</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ROUNDS.map(r => (
            <button
              key={r.id}
              type="button"
              disabled={startBlocked}
              onClick={() => setRoundType(r.id)}
              className={`rounded-xl border px-3 py-3 text-left transition-all ${
                roundType === r.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
              } disabled:opacity-50`}
            >
              <span className="block text-sm font-semibold text-slate-900 dark:text-white">{r.label}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{r.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">Session type</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={startBlocked}
            onClick={() => setMode("live")}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
              mode === "live" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-slate-700"
            } disabled:opacity-50`}
          >
            <Radio size={18} className="mt-0.5 shrink-0 text-blue-600" />
            <div>
              <span className="block text-sm font-semibold text-slate-900 dark:text-white">Live voice mock</span>
              <span className="mt-0.5 block text-xs text-slate-500">Conversational AI interviewer</span>
            </div>
          </button>
          <button
            type="button"
            disabled={startBlocked}
            onClick={() => setMode("questions")}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
              mode === "questions" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-slate-700"
            } disabled:opacity-50`}
          >
            <MessageSquare size={18} className="mt-0.5 shrink-0 text-blue-600" />
            <div>
              <span className="block text-sm font-semibold text-slate-900 dark:text-white">Guided questions</span>
              <span className="mt-0.5 block text-xs text-slate-500">AI questions with spoken answers</span>
            </div>
          </button>
        </div>
      </div>

      <OnboardingGateTooltip
        enabled={generateDisabled}
        messageKey="interview_prep"
        ctaLabel={FINISH_ONBOARDING_CTA}
        className="block w-full"
      >
        <button
          type="button"
          disabled={startBlocked}
          onClick={() => onStart({ roundType, mode })}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-medium text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isStarting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Starting…
            </>
          ) : (
            <>
              <Mic2 size={18} /> Start {ROUNDS.find(r => r.id === roundType)?.label} interview
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </OnboardingGateTooltip>

      <p className="mt-4 flex items-start gap-2 text-xs font-light leading-relaxed text-slate-400">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        Unimad AI Interview can make mistakes. Feedback is for practice only.
      </p>
    </div>
  );
};

export default PrepareInterviewPanel;
