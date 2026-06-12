"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { consumeInterviewLaunch } from "@/src/features/interview-prep/interview-launch";
import {
  analyzeVoiceInterview,
  deleteInterviewSession,
  fetchInterviewSessions,
  startInterviewSession,
} from "@/src/features/interview-prep/server-actions/interview-actions";
import type {
  InterviewAutoStart,
  InterviewPrepContext,
  InterviewPrepListItem,
  InterviewQuestion,
  InterviewRoundType,
  InterviewSessionMode,
} from "@/src/features/interview-prep/types";
import type { InterviewView } from "@/src/features/jobs/jobs-url";
import { Mic, Bot, Calendar, Clock, Trash2, Loader2 } from "lucide-react";
import InterviewActiveSession from "../interview-prep/InterviewActiveSession";
import InterviewAnalyzingView from "../interview-prep/InterviewAnalyzingView";
import InterviewLaunchOverlay from "../interview-prep/InterviewLaunchOverlay";
import InterviewReportView from "../interview-prep/InterviewReportView";
import InterviewSetupModal from "../interview-prep/InterviewSetupModal";
import VoiceInterviewSession from "../interview-prep/VoiceInterviewSession";

type View = InterviewView;

interface InterviewPrepProps {
  initialContext?: InterviewPrepContext | null;
  autoStart?: InterviewAutoStart | null;
  onAutoStartConsumed?: () => void;
  openSetupOnMount?: boolean;
  urlInterviewId?: string | null;
  urlView?: InterviewView | null;
  urlRound?: string | null;
  onUrlChange?: (
    updates: Partial<{
      interview_id: string | null;
      view: InterviewView | null;
      round: string | null;
      setup: string | null;
    }>
  ) => void;
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({
  initialContext,
  autoStart,
  onAutoStartConsumed,
  openSetupOnMount,
  urlInterviewId,
  urlView,
  urlRound,
  onUrlChange,
}) => {
  const launchPayload = useMemo(() => (typeof window !== "undefined" ? consumeInterviewLaunch() : null), []);

  const initialView: View = urlView ?? (openSetupOnMount ? "setup" : "dashboard");

  const [view, setView] = useState<View>(initialView);
  const [sessions, setSessions] = useState<InterviewPrepListItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [interviewId, setInterviewId] = useState<string | null>(urlInterviewId ?? launchPayload?.interviewId ?? null);
  const [roundType, setRoundType] = useState<InterviewRoundType>(() => {
    if (urlRound === "screening" || urlRound === "technical" || urlRound === "behavioral") {
      return urlRound;
    }
    if (launchPayload?.roundType === "screening" || launchPayload?.roundType === "technical" || launchPayload?.roundType === "behavioral") {
      return launchPayload.roundType;
    }
    return "technical";
  });
  const [questions, setQuestions] = useState<InterviewQuestion[]>(launchPayload?.questions ?? []);
  const launchContext = launchPayload?.context ?? initialContext;
  const [sessionMeta, setSessionMeta] = useState({
    company: launchContext?.company ?? "",
    role: launchContext?.role ?? "",
    jobDescription: launchContext?.jobDescription ?? "",
  });
  const [reportInterviewId, setReportInterviewId] = useState<string | null>(urlInterviewId ?? launchPayload?.interviewId ?? null);
  const [reportRoundType, setReportRoundType] = useState<string | undefined>(urlRound ?? launchPayload?.roundType ?? undefined);

  const navigate = useCallback(
    (patch: { view?: View; interviewId?: string | null; round?: string | null; setup?: string | null }) => {
      const nextView = patch.view ?? view;
      const nextId = patch.interviewId !== undefined ? patch.interviewId : (reportInterviewId ?? interviewId);
      const nextRound = patch.round !== undefined ? patch.round : reportRoundType;

      if (patch.view !== undefined) setView(patch.view);
      if (patch.interviewId !== undefined) {
        setInterviewId(patch.interviewId);
        setReportInterviewId(patch.interviewId);
      }
      if (patch.round !== undefined) setReportRoundType(patch.round ?? undefined);

      onUrlChange?.({
        view: nextView === "dashboard" ? null : nextView,
        interview_id: nextView === "report" ? nextId : nextView === "active" || nextView === "voice" ? nextId : null,
        round: nextView === "report" ? (nextRound ?? null) : null,
        setup: patch.setup !== undefined ? patch.setup : nextView === "setup" ? "1" : null,
      });
    },
    [view, reportInterviewId, interviewId, reportRoundType, onUrlChange]
  );

  useEffect(() => {
    if (!urlView) return;
    setView(urlView);
    if (urlView === "report" && urlInterviewId) {
      setReportInterviewId(urlInterviewId);
    }
    if (urlRound) setReportRoundType(urlRound);
  }, [urlView, urlInterviewId, urlRound]);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const data = await fetchInterviewSessions();
      setSessions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleStart = useCallback(
    async (payload: {
      company: string;
      role: string;
      jobDescription: string;
      roundType: InterviewRoundType;
      mode: InterviewSessionMode;
      applicationId?: string;
    }) => {
      setIsStarting(true);
      setError(null);
      setSessionMeta({
        company: payload.company,
        role: payload.role,
        jobDescription: payload.jobDescription,
      });
      setRoundType(payload.roundType);

      try {
        if (payload.mode === "live") {
          setInterviewId(null);
          navigate({ view: "voice", interviewId: null, round: payload.roundType, setup: null });
          return;
        }

        const result = await startInterviewSession({
          role: payload.role,
          company: payload.company,
          jobDescription: payload.jobDescription,
          roundType: payload.roundType,
          applicationId: payload.applicationId,
        });

        setInterviewId(result.id);
        setQuestions(result.questions);
        navigate({ view: "active", interviewId: result.id, round: payload.roundType, setup: null });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to start interview");
      } finally {
        setIsStarting(false);
      }
    },
    [navigate]
  );

  const autoStartHandledRef = useRef(false);

  useEffect(() => {
    if (launchPayload) {
      autoStartHandledRef.current = true;
      onAutoStartConsumed?.();
    }
  }, [launchPayload, onAutoStartConsumed]);

  useEffect(() => {
    if (!autoStart || !initialContext || autoStartHandledRef.current) return;

    const jobDescription =
      initialContext.jobDescription?.trim() || `${initialContext.role ?? ""} at ${initialContext.company ?? ""}`.trim();

    if (!initialContext.company?.trim() || !initialContext.role?.trim()) return;

    autoStartHandledRef.current = true;
    onAutoStartConsumed?.();
    void handleStart({
      company: initialContext.company,
      role: initialContext.role,
      jobDescription,
      roundType: autoStart.roundType,
      mode: autoStart.mode,
      applicationId: initialContext.applicationId,
    });
  }, [autoStart, initialContext, handleStart, onAutoStartConsumed]);

  const handleVoiceEnd = async (transcript: { role: "user" | "model"; text: string; timestamp?: number }[]) => {
    navigate({ view: "analyzing", setup: null });
    setIsAnalyzing(true);
    try {
      const result = await analyzeVoiceInterview({
        transcript,
        interviewId: interviewId ?? undefined,
        config: {
          role: sessionMeta.role,
          company: sessionMeta.company,
          jobDescription: sessionMeta.jobDescription,
          roundType,
          interviewId: interviewId ?? undefined,
        },
      });
      setReportInterviewId(result.interview_id);
      setReportRoundType(result.round_type);
      navigate({
        view: "report",
        interviewId: result.interview_id,
        round: result.round_type,
        setup: null,
      });
      await loadSessions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze interview");
      navigate({ view: "dashboard", interviewId: null, round: null, setup: null });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInterviewSession(id);
      setSessions(prev => prev.filter(s => s.interview_id !== id));
      if (reportInterviewId === id) {
        navigate({ view: "dashboard", interviewId: null, round: null, setup: null });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "—";
    }
  };

  const goDashboard = () => navigate({ view: "dashboard", interviewId: null, round: null, setup: null });

  const handleRetake = useCallback(
    async (opts: {
      interviewId: string;
      roundType: InterviewRoundType;
      mode: InterviewSessionMode;
      company: string;
      role: string;
      jobDescription: string;
      applicationId?: string;
    }) => {
      setIsStarting(true);
      setError(null);
      setSessionMeta({
        company: opts.company,
        role: opts.role,
        jobDescription: opts.jobDescription,
      });
      setRoundType(opts.roundType);

      try {
        if (opts.mode === "live") {
          setInterviewId(opts.interviewId);
          navigate({ view: "voice", interviewId: opts.interviewId, round: opts.roundType, setup: null });
          return;
        }

        const result = await startInterviewSession({
          role: opts.role,
          company: opts.company,
          jobDescription: opts.jobDescription,
          roundType: opts.roundType,
          interviewId: opts.interviewId,
          applicationId: opts.applicationId,
        });

        setInterviewId(result.id);
        setQuestions(result.questions);
        navigate({ view: "active", interviewId: result.id, round: opts.roundType, setup: null });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to start interview");
      } finally {
        setIsStarting(false);
      }
    },
    [navigate]
  );

  if (autoStart && isStarting && view === "dashboard") {
    return <InterviewLaunchOverlay />;
  }

  if (view === "setup") {
    return <InterviewSetupModal initialContext={initialContext} isStarting={isStarting} onClose={goDashboard} onStart={handleStart} />;
  }

  if (view === "active" && interviewId && questions.length === 0 && isStarting) {
    return <InterviewLaunchOverlay />;
  }

  if (view === "active" && interviewId && questions.length > 0) {
    return (
      <InterviewActiveSession
        interviewId={interviewId}
        roundType={roundType}
        company={sessionMeta.company}
        role={sessionMeta.role}
        questions={questions}
        onEnd={goDashboard}
        onComplete={id => {
          setReportRoundType(roundType);
          navigate({ view: "report", interviewId: id, round: roundType, setup: null });
          loadSessions();
        }}
      />
    );
  }

  if (view === "voice") {
    return (
      <VoiceInterviewSession
        config={{
          role: sessionMeta.role,
          company: sessionMeta.company,
          jobDescription: sessionMeta.jobDescription,
          roundType,
          interviewId: interviewId ?? undefined,
        }}
        onEnd={handleVoiceEnd}
        onCancel={goDashboard}
      />
    );
  }

  if (view === "analyzing") {
    return <InterviewAnalyzingView />;
  }

  if (view === "report" && reportInterviewId) {
    return (
      <InterviewReportView
        interviewId={reportInterviewId}
        roundType={reportRoundType}
        onBack={goDashboard}
        onRetake={handleRetake}
        isRetakeStarting={isStarting}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl animate-in p-8 font-sans fade-in duration-500">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
          <button type="button" className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="relative mb-10 overflow-hidden rounded-3xl border border-slate-800 bg-[#0B1121] p-10 text-white shadow-2xl">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-brand-600/20 blur-[100px]" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400">
            <Bot size={12} fill="currentColor" /> AI Interview Coach
          </div>
          <h2 className="mb-4 text-4xl font-medium tracking-tight">Ace Your Next Interview</h2>
          <p className="mb-8 text-lg font-light leading-relaxed text-slate-400">
            Practice screening, technical, or behavioral rounds tailored to your target company and job description. Choose guided questions
            or a live voice mock interview.
          </p>
          <button
            type="button"
            onClick={() => navigate({ view: "setup", setup: "1" })}
            className="flex items-center gap-2.5 rounded-xl bg-brand-600 px-8 py-3.5 font-medium text-white shadow-lg shadow-brand-600/20 transition-all hover:bg-brand-500 active:scale-95"
          >
            <Mic size={20} /> Start New Session
          </button>
        </div>
      </div>

      <h3 className="mb-6 text-xl font-medium tracking-tight text-slate-900 dark:text-white">Past Sessions</h3>

      {loadingSessions ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-500 dark:border-slate-700">
          No sessions yet. Start your first mock interview above.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sessions.map(session => (
            <div
              key={session.interview_id}
              role="button"
              tabIndex={0}
              onClick={() => {
                const round =
                  session.rounds?.length && !session.active_round
                    ? session.rounds[session.rounds.length - 1]
                    : (session.active_round ?? session.rounds?.[0]);
                navigate({
                  view: "report",
                  interviewId: session.interview_id,
                  round: round ?? null,
                  setup: null,
                });
              }}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  navigate({
                    view: "report",
                    interviewId: session.interview_id,
                    round: session.rounds?.[0] ?? null,
                    setup: null,
                  });
                }
              }}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50 text-lg font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                  {(session.company ?? "?")[0]}
                </div>
                <div>
                  <h4 className="mb-0.5 text-base font-medium text-slate-900 dark:text-white">{session.role ?? "Role"}</h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{session.company}</span>
                    {session.rounds?.length > 0 && (
                      <>
                        <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                        <span>{session.rounds.join(", ")}</span>
                      </>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {formatDate(session.created_at)}
                    </span>
                    {session.active_round && <span className="text-amber-600">In progress: {session.active_round}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {session.score != null && (
                  <div className="text-right">
                    <span className={`block text-xl font-medium ${session.score >= 80 ? "text-green-600" : "text-orange-500"}`}>
                      {Math.round(session.score)}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Score</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(session.interview_id);
                  }}
                  className="ml-2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  title="Delete Session"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAnalyzing && (
        <ModalPortalOverlay className="flex items-center justify-center bg-black/40">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </ModalPortalOverlay>
      )}
    </div>
  );
};

export default InterviewPrep;
