"use client";

import React from "react";
import type { InterviewRoundType, InterviewSessionMode } from "@/src/features/interview-prep/types";
import { AlertTriangle, Loader2, Mic2, X } from "lucide-react";

export type RetakeAction = "replace" | "continue";

interface InterviewRetakeModalProps {
  roundLabel: string;
  roundMode: "guided" | "voice";
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (action: RetakeAction, mode: InterviewSessionMode) => void;
}

const InterviewRetakeModal: React.FC<InterviewRetakeModalProps> = ({ roundLabel, roundMode, isLoading = false, onClose, onConfirm }) => {
  const isVoice = roundMode === "voice";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#1a1a1a]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Practice again?</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Your previous <span className="font-medium text-slate-800 dark:text-slate-200">{roundLabel}</span> round answers, scores, and
          feedback will be archived. You&apos;ll start a fresh session for this round.
        </p>

        {isVoice ? (
          <p className="mb-6 text-xs text-slate-500">
            Live voice mocks don&apos;t resume mid-conversation — a new session gives you a clean practice run.
          </p>
        ) : (
          <p className="mb-6 text-xs text-slate-500">
            Prefer more practice without losing history? Use &quot;Add more questions&quot; to continue on the same interview with new
            questions.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onConfirm("replace", isVoice ? "live" : "questions")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Mic2 size={16} />}
            Start fresh round
          </button>

          {!isVoice && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onConfirm("continue", "questions")}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Add more questions
            </button>
          )}

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="w-full rounded-xl px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewRetakeModal;
