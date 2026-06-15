"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useApplications } from "@/features/application-tracker/hooks/useApplications";
import { jobHasPreparedApplication } from "@/features/application-tracker/job-application-lookup";
import { useOnboardingGate } from "@/features/onboarding/context/OnboardingGateContext";
import { MODAL_OVERLAY_Z_CLASS } from "@/lib/ui/modal-overlay";
import type { StartInterviewFromJobPayload } from "@/src/features/interview-prep/types";
import { X, ExternalLink, FileText, CheckCircle2, DollarSign, ChevronDown } from "lucide-react";
import Image from "next/image";
import { Job, ApplicationStatus, GeneratorContext } from "../../types/jobs";
import PrepareApplicationModal from "./PrepareApplicationModal";

interface JobDetailsModalProps {
  job: Job;
  onClose: () => void;
  onApply?: (job: Job) => void;
  onToggleSave?: (e: React.MouseEvent, jobId: string) => void;
  isSaved?: boolean;
  onStatusChange?: (jobId: string, status: ApplicationStatus) => void;
  onNavigateToStudio?: (context: GeneratorContext) => void;
  onStartInterviewPrep?: (payload: StartInterviewFromJobPayload) => void;
}

const statusColors: Record<ApplicationStatus, string> = {
  draft: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  applied: "bg-slate-500 text-white",
  interviewing: "bg-brand-500 text-white",
  offer: "bg-green-500 text-white",
  rejected: "bg-red-500 text-white",
};

const statusLabels: Record<ApplicationStatus, string> = {
  draft: "Draft",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  onClose,
  onApply,
  onToggleSave,
  isSaved,
  onStatusChange,
  onNavigateToStudio,
  onStartInterviewPrep,
}) => {
  const { profileSetupRequired, promptProfileSetup } = useOnboardingGate();
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [showPrepareModal, setShowPrepareModal] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { data: applications = [] } = useApplications();
  const hasPreparedApplication = jobHasPreparedApplication(applications, job.id);

  const isValidUrl = (url: string | undefined) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const showFallback = !isValidUrl(job.logo) || logoError;

  if (showPrepareModal) {
    return (
      <PrepareApplicationModal
        job={job}
        source="discovery"
        onClose={() => setShowPrepareModal(false)}
        onNavigateToStudio={onNavigateToStudio}
        onStartInterviewPrep={onStartInterviewPrep}
      />
    );
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${MODAL_OVERLAY_Z_CLASS} flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200`}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {!showFallback ? (
                <Image
                  src={job.logo as string}
                  alt={job.company}
                  fill
                  sizes="64px"
                  className="object-contain p-2"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-500 via-purple-500 to-pink-500">
                  <span className="text-3xl font-bold text-white">{job.company?.charAt(0)?.toUpperCase() || "?"}</span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">{job.role}</h2>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">{job.company}</span>
                <span>•</span>
                <span className="flex items-center gap-1">{job.location}</span>
                <span>•</span>
                <span className="flex items-center gap-1">{job.postedDate}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onToggleSave && (
              <button
                onClick={e => onToggleSave(e, job.id)}
                className={`
                                    px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2
                                    ${
                                      isSaved
                                        ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800"
                                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    }
                                `}
              >
                {isSaved ? "Saved" : "Save Job"}
              </button>
            )}
            {job.applicationStatus && onStatusChange && (
              <div className="relative z-50">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-opacity ${statusColors[job.applicationStatus]}`}
                >
                  {statusLabels[job.applicationStatus]} <ChevronDown size={14} />
                </button>
                {isStatusDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
                    {(Object.keys(statusLabels) as ApplicationStatus[]).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          onStatusChange(job.id, status);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                          job.applicationStatus === status
                            ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {statusLabels[status]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors ml-2">
              <X size={24} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {/* Job match % — restore when backend match scoring is available
            {job.matchScore >= 90 && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full flex items-center gap-1">
                {job.matchScore}% Match
              </span>
            )}
            */}
            {job.isSponsoring && (
              <span
                title="This job explicitly mentions visa sponsorship"
                className="cursor-help rounded-full border border-yellow-300 bg-gradient-to-b from-amber-200 to-yellow-400 px-3 py-1 text-xs font-semibold text-yellow-900 shadow-sm transition-all hover:brightness-105"
              >
                Visa Sponsorship
              </span>
            )}
            {job.salaryRange && (
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full flex items-center gap-1">
                <DollarSign size={12} /> {job.salaryRange}
              </span>
            )}
          </div>

          <section>
            <h3 className="font-medium text-lg text-slate-900 dark:text-white mb-3">About the Role</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {job.description || "No description available."}
            </p>
          </section>

          {job.requirements && job.requirements.length > 0 && (
            <section>
              <h3 className="font-medium text-lg text-slate-900 dark:text-white mb-3">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
          <button
            onClick={() => {
              if (profileSetupRequired) {
                promptProfileSetup();
                return;
              }
              setShowPrepareModal(true);
            }}
            title={profileSetupRequired ? "Finish onboarding fully to prepare applications" : undefined}
            className={`flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 ${
              profileSetupRequired ? "cursor-not-allowed opacity-60" : "hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            <FileText size={18} className="text-brand-500" /> {hasPreparedApplication ? "Continue Application" : "Prepare Application"}
          </button>
          <button
            onClick={() => onApply && onApply(job)}
            className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            Apply Now <ExternalLink size={18} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default JobDetailsModal;
