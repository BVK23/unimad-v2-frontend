import React from "react";
import { X, Sparkles, Mic2 } from "lucide-react";
import { Job } from "../../types/jobs";

interface InterviewingStageModalProps {
  job: Job;
  onClose: () => void;
  onBuildVpd: () => void;
  onStartInterviewPrep: () => void;
}

const InterviewingStageModal: React.FC<InterviewingStageModalProps> = ({ job, onClose, onBuildVpd, onStartInterviewPrep }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    onClick={onClose}
    role="presentation"
  >
    <div
      className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#1a1a1a]"
      onClick={e => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="interviewing-stage-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Interview stage</p>
          <h2 id="interviewing-stage-title" className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
            {job.role} at {job.company}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        A strong <span className="font-semibold text-slate-900 dark:text-white">Value Proposition Document (VPD)</span> increases your
        chances of cracking the interview by helping you articulate impact clearly.
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onBuildVpd}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-[0.99]"
        >
          <Sparkles size={16} />
          Build your VPD
        </button>
        <button
          type="button"
          onClick={onStartInterviewPrep}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-600 dark:hover:bg-blue-950/40"
        >
          <Mic2 size={16} />
          Start interview prep
        </button>
        <button
          type="button"
          onClick={onClose}
          className="py-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Maybe later
        </button>
      </div>
    </div>
  </div>
);

export default InterviewingStageModal;
