"use client";

import React, { useEffect, useState } from "react";
import { fetchInterviewDetail } from "@/src/features/interview-prep/server-actions/interview-actions";
import type {
  InterviewDetailResponse,
  InterviewQuestion,
  InterviewRoundData,
  InterviewRoundType,
  InterviewSessionMode,
} from "@/src/features/interview-prep/types";
import { ChevronRight, Loader2, Play, RotateCcw } from "lucide-react";
import InterviewRetakeModal, { type RetakeAction } from "./InterviewRetakeModal";

interface InterviewReportViewProps {
  interviewId: string;
  roundType?: string;
  onBack: () => void;
  onRetake?: (opts: {
    interviewId: string;
    roundType: InterviewRoundType;
    mode: InterviewSessionMode;
    company: string;
    role: string;
    jobDescription: string;
  }) => void;
  onResume?: (opts: {
    interviewId: string;
    roundType: InterviewRoundType;
    company: string;
    role: string;
    jobDescription: string;
    questions: InterviewQuestion[];
    initialQuestionIndex: number;
  }) => void;
  isRetakeStarting?: boolean;
}

const InterviewReportView: React.FC<InterviewReportViewProps> = ({
  interviewId,
  roundType,
  onBack,
  onRetake,
  onResume,
  isRetakeStarting = false,
}) => {
  const [detail, setDetail] = useState<InterviewDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRetakeModal, setShowRetakeModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchInterviewDetail(interviewId);
        if (!cancelled) setDetail(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load report");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [interviewId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{error ?? "Report not found"}</p>
        <button type="button" onClick={onBack} className="mt-4 text-blue-600 hover:underline">
          Back to dashboard
        </button>
      </div>
    );
  }

  const activeRoundKey =
    roundType ??
    detail.active_round ??
    detail.round_types.find(rt => detail.rounds_data[rt]?.status === "completed") ??
    detail.round_types[detail.round_types.length - 1];

  const roundData: InterviewRoundData | undefined = activeRoundKey ? detail.rounds_data[activeRoundKey] : undefined;
  const isInProgress = roundData?.status === "in_progress";
  const isCompleted = roundData?.status === "completed";
  const isBusy = isRetakeStarting;

  const overallScore = roundData?.overall_score ?? 0;
  const questions = roundData?.questions ?? [];
  const roundMode = roundData?.mode ?? "guided";
  const roundLabel = activeRoundKey ? `${activeRoundKey} round` : "this round";

  const handleRetakeConfirm = (action: RetakeAction, mode: InterviewSessionMode) => {
    if (!onRetake || !activeRoundKey) return;
    const jobDescription = detail.job_description?.trim() || `${detail.role ?? ""} at ${detail.company ?? ""}`.trim();

    onRetake({
      interviewId,
      roundType: activeRoundKey as InterviewRoundType,
      mode,
      company: detail.company ?? "",
      role: detail.role ?? "",
      jobDescription,
    });
    setShowRetakeModal(false);
  };

  const handleResume = () => {
    if (!onResume || !activeRoundKey || !roundData) return;
    const jobDescription = detail.job_description?.trim() || `${detail.role ?? ""} at ${detail.company ?? ""}`.trim();
    const resumeQuestions = questions.map(q => ({ id: q.id, question: q.question }));
    const firstUnansweredIndex = questions.findIndex(q => !q.answer?.trim());
    const initialQuestionIndex = firstUnansweredIndex >= 0 ? firstUnansweredIndex : Math.max(0, questions.length - 1);

    onResume({
      interviewId,
      roundType: activeRoundKey as InterviewRoundType,
      company: detail.company ?? "",
      role: detail.role ?? "",
      jobDescription,
      questions: resumeQuestions,
      initialQuestionIndex,
    });
  };

  return (
    <div className="mx-auto max-w-5xl animate-in p-8 font-sans fade-in">
      {showRetakeModal && activeRoundKey && (
        <InterviewRetakeModal
          roundLabel={roundLabel}
          roundMode={roundMode}
          isLoading={isRetakeStarting}
          onClose={() => setShowRetakeModal(false)}
          onConfirm={handleRetakeConfirm}
        />
      )}

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <button type="button" onClick={onBack} className="rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronRight className="rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Interview Report</h2>
          <p className="text-sm text-slate-500">
            {detail.role} at {detail.company}
            {activeRoundKey ? ` • ${activeRoundKey} round` : ""}
          </p>
        </div>
        {onResume && activeRoundKey && isInProgress && (
          <button
            type="button"
            onClick={handleResume}
            disabled={isBusy}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isRetakeStarting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Resume interview
          </button>
        )}
        {onRetake && activeRoundKey && isInProgress && (
          <button
            type="button"
            onClick={() => setShowRetakeModal(true)}
            disabled={isBusy}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isRetakeStarting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
            Start over
          </button>
        )}
        {onRetake && activeRoundKey && isCompleted && (
          <button
            type="button"
            onClick={() => setShowRetakeModal(true)}
            disabled={isBusy}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isRetakeStarting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
            Practice again
          </button>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-[#1a1a1a]">
          <span className="mb-2 block text-5xl font-medium text-blue-600">{overallScore}</span>
          <span className="text-sm font-medium uppercase tracking-wider text-slate-500">Overall Score</span>
          <p className="mt-2 text-xs font-light text-slate-400">Out of 100</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-[#1a1a1a] md:col-span-2">
          <p className="text-left leading-relaxed text-slate-600 dark:text-slate-300">
            {roundData?.overall_feedback ??
              (roundData?.status === "in_progress" ? "This round is still in progress." : "Complete a session to see AI feedback here.")}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-[#1a1a1a]">
        <h3 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">Question Breakdown</h3>
        <div className="space-y-4">
          {questions.map(q => (
            <div key={q.id} className="rounded-xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-2 flex justify-between gap-4">
                <h5 className="font-medium text-slate-800 dark:text-slate-200">{q.question}</h5>
                {q.score != null && <span className="shrink-0 text-sm font-medium text-blue-600">{q.score}/10</span>}
              </div>
              {q.answer && (
                <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-500">Your answer: </span>
                  {q.answer}
                </p>
              )}
              {q.feedback && <p className="text-sm text-slate-500">{q.feedback}</p>}
              {q.improvement_tip && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Tip: {q.improvement_tip}</p>}
            </div>
          ))}
          {questions.length === 0 && (
            <p className="text-slate-500">
              {roundData?.status === "in_progress"
                ? "This round is still in progress. Complete the session to see feedback."
                : "No question breakdown available for this round."}
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs font-light text-slate-400">
        Unimad AI Interview can make mistakes. Use this feedback for practice only.
      </p>
    </div>
  );
};

export default InterviewReportView;
