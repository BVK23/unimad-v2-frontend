"use client";

import React, { useEffect, useState } from "react";
import JobUrlImportLoading from "@/components/jobs/JobUrlImportLoading";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { OnboardingGateTooltip } from "@/components/ui/OnboardingGateTooltip";
import { FINISH_ONBOARDING_CTA } from "@/constants/onboarding-tooltips";
import { importJobFromUrl } from "@/features/jobs/server-actions/jobs-actions";
import { useOnboardingGate } from "@/features/onboarding/context/OnboardingGateContext";
import type { InterviewPrepContext, InterviewRoundType, InterviewSessionMode } from "@/src/features/interview-prep/types";
import { useQueryClient } from "@tanstack/react-query";
import { X, Globe, ChevronRight, Loader2, Link as LinkIcon, FileText } from "lucide-react";

type SetupMode = "url" | "manual";

const ROUNDS: { id: InterviewRoundType; label: string; description: string }[] = [
  { id: "screening", label: "Screening", description: "Intro, motivation, and fit" },
  { id: "technical", label: "Technical", description: "Skills, problem-solving, depth" },
  { id: "behavioral", label: "Behavioral", description: "STAR stories and soft skills" },
];

interface InterviewSetupModalProps {
  initialContext?: InterviewPrepContext | null;
  isStarting?: boolean;
  onClose: () => void;
  onStart: (payload: {
    company: string;
    role: string;
    jobDescription: string;
    roundType: InterviewRoundType;
    mode: InterviewSessionMode;
    applicationId?: string;
  }) => void;
}

const InterviewSetupModal: React.FC<InterviewSetupModalProps> = ({ initialContext, isStarting = false, onClose, onStart }) => {
  const queryClient = useQueryClient();
  const { featureGates } = useOnboardingGate();
  const interviewGated = !featureGates.jobs_prepare_application;
  const [setupMode, setSetupMode] = useState<SetupMode>(initialContext?.applicationId ? "manual" : "url");
  const [jobUrl, setJobUrl] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [company, setCompany] = useState(initialContext?.company ?? "");
  const [role, setRole] = useState(initialContext?.role ?? "");
  const [jobDescription, setJobDescription] = useState(initialContext?.jobDescription ?? "");
  const [resolvedApplicationId, setResolvedApplicationId] = useState<string | undefined>(initialContext?.applicationId);
  const [roundType, setRoundType] = useState<InterviewRoundType>("technical");
  const [mode, setMode] = useState<InterviewSessionMode>("questions");

  useEffect(() => {
    if (initialContext) {
      setCompany(initialContext.company ?? "");
      setRole(initialContext.role ?? "");
      setJobDescription(initialContext.jobDescription ?? "");
      setResolvedApplicationId(initialContext.applicationId);
      if (initialContext.applicationId) setSetupMode("manual");
    }
  }, [initialContext]);

  const canStartManual = company.trim() && role.trim() && jobDescription.trim();
  const canStartUrl = jobUrl.trim().length > 0;
  const busy = isStarting || isImporting;

  const handleImportAndStart = async () => {
    const trimmed = jobUrl.trim();
    if (!trimmed) {
      setImportError("Paste a job posting URL to continue.");
      return;
    }
    setIsImporting(true);
    setImportError(null);
    try {
      const result = await importJobFromUrl(trimmed);
      if (!result.success) {
        setImportError(result.error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      const app = result.application;
      const jd = app.job_description?.trim() || `${app.role} at ${app.company}`;
      setCompany(app.company);
      setRole(app.role);
      setJobDescription(jd);
      setResolvedApplicationId(app.application_id);
      onStart({
        company: app.company,
        role: app.role,
        jobDescription: jd,
        roundType,
        mode,
        applicationId: app.application_id,
      });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not import this job URL.");
    } finally {
      setIsImporting(false);
    }
  };

  const showLinkedInHint = /linkedin\.com/i.test(jobUrl);

  return (
    <ModalPortalOverlay className="flex animate-in items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm fade-in duration-200">
      <div className="my-auto flex max-h-[min(90dvh,calc(100vh-2rem))] w-full max-w-2xl min-h-0 animate-in flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl duration-200 zoom-in-95 dark:border-slate-800 dark:bg-[#1a1a1a]">
        <div className="shrink-0 border-b border-slate-100 px-8 pb-6 pt-8 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-medium text-slate-900 dark:text-white">Setup Interview</h3>
              <p className="mt-1 text-slate-500">Import a job URL or enter details manually, then pick your round.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>

          {!initialContext?.applicationId && (
            <div className="mt-6 flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
              <button
                type="button"
                disabled={busy}
                onClick={() => setSetupMode("url")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
                  setupMode === "url" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400" : "text-slate-500"
                }`}
              >
                <LinkIcon size={16} /> Job URL
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setSetupMode("manual")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
                  setupMode === "manual" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400" : "text-slate-500"
                }`}
              >
                <FileText size={16} /> Manual entry
              </button>
            </div>
          )}
        </div>

        <div className="scrollbar-on-hover min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {isImporting ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
              <JobUrlImportLoading compact />
            </div>
          ) : setupMode === "url" && !initialContext?.applicationId ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Job posting URL</label>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={e => {
                    setJobUrl(e.target.value);
                    setImportError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
                  placeholder="https://…"
                />
                {showLinkedInHint && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">LinkedIn URLs may take longer to process.</p>
                )}
                {importError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{importError}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Target Company</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400">
                    <Globe size={18} />
                  </span>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    disabled={busy}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
                    placeholder="e.g. Google, Airbnb, Stripe"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
                  placeholder="e.g. Senior Product Designer"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  disabled={busy}
                  className="h-32 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Paste the JD here for tailored questions..."
                />
              </div>
            </div>
          )}

          {!isImporting && (
            <>
              <div className="mt-6">
                <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">Interview Round</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {ROUNDS.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      disabled={busy}
                      onClick={() => setRoundType(r.id)}
                      className={`rounded-xl border px-4 py-3 text-left transition-all ${
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

              <div className="mt-6">
                <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">Session Style</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setMode("questions")}
                    className={`rounded-xl border px-4 py-3 text-left transition-all ${
                      mode === "questions" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-slate-700"
                    } disabled:opacity-50`}
                  >
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">Guided questions</span>
                    <span className="mt-0.5 block text-xs text-slate-500">AI questions with live speech-to-text answers</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setMode("live")}
                    className={`rounded-xl border px-4 py-3 text-left transition-all ${
                      mode === "live" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-slate-700"
                    } disabled:opacity-50`}
                  >
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">Live voice mock</span>
                    <span className="mt-0.5 block text-xs text-slate-500">Conversational AI interviewer (Gemini Live)</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 gap-4 border-t border-slate-100 px-8 py-6 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-3.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Cancel
          </button>
          {setupMode === "url" && !initialContext?.applicationId && !isImporting ? (
            <OnboardingGateTooltip enabled={interviewGated} messageKey="interview_prep" className="block flex-1">
              <button
                type="button"
                disabled={!canStartUrl || busy || interviewGated}
                onClick={() => void handleImportAndStart()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Importing…
                  </>
                ) : (
                  <>
                    Import & start {ROUNDS.find(r => r.id === roundType)?.label} round <ChevronRight size={18} />
                  </>
                )}
              </button>
            </OnboardingGateTooltip>
          ) : (
            <OnboardingGateTooltip enabled={interviewGated} messageKey="interview_prep" className="block flex-1">
              <button
                type="button"
                disabled={!canStartManual || busy || isImporting || interviewGated}
                onClick={() =>
                  onStart({
                    company: company.trim(),
                    role: role.trim(),
                    jobDescription: jobDescription.trim(),
                    roundType,
                    mode,
                    applicationId: resolvedApplicationId,
                  })
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStarting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Preparing...
                  </>
                ) : (
                  <>
                    Start {ROUNDS.find(r => r.id === roundType)?.label} Round <ChevronRight size={18} />
                  </>
                )}
              </button>
            </OnboardingGateTooltip>
          )}
        </div>
      </div>
    </ModalPortalOverlay>
  );
};

export default InterviewSetupModal;
