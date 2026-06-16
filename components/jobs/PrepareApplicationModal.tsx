"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ApplicationAssetDownloadMenu } from "@/components/application-assets/ApplicationAssetDownloadMenu";
import { DocumentSaveStatusBar } from "@/components/application-assets/DocumentSaveStatusBar";
import InterviewLaunchOverlay from "@/components/interview-prep/InterviewLaunchOverlay";
import { runApplicationAssetDraftGeneration } from "@/features/application-assets/api/runApplicationAssetDraftGeneration";
import { checkApplicationAssetAvailability } from "@/features/application-assets/server-actions/application-asset-actions";
import { getLinkedAssetId } from "@/features/application-tracker/application-assets";
import { useDocumentAutosave } from "@/hooks/useDocumentAutosave";
import { setPrepareReturnSession } from "@/lib/jobs/prepare-application-return";
import { buildResumePrepareHref, type PrepareNavigateTarget } from "@/lib/jobs/prepare-application-url";
import { MODAL_OVERLAY_Z_CLASS } from "@/lib/ui/modal-overlay";
import { fetchColdEmailById, updateColdEmail } from "@/src/features/cold-email/server-actions/cold-email-actions";
import { fetchCoverLetterById, updateCoverLetter } from "@/src/features/cover-letter/server-actions/cover-letter-actions";
import { storeInterviewLaunch } from "@/src/features/interview-prep/interview-launch";
import { startInterviewSession } from "@/src/features/interview-prep/server-actions/interview-actions";
import type { StartInterviewFromJobPayload } from "@/src/features/interview-prep/types";
import { usePrepareApplicationContext } from "@/src/features/jobs/hooks/usePrepareApplicationContext";
import { generateResume } from "@/src/features/resume/server-actions/resume-actions";
import { downloadResumePdf } from "@/src/features/resume/utils/downloadResumePdf";
import type { ResumeData } from "@/types";
import { exportApplicationAssetAsDocx, exportApplicationAssetAsPdf } from "@/utils/export-application-asset-file";
import { htmlToPlainText } from "@/utils/html-to-text";
import { sanitizeUserFacingError } from "@/utils/message-from-failed-response";
import { normalizeContentToHtml } from "@/utils/normalize-content-to-html";
import { X, FileText, Mail, Briefcase, Wand2, Copy, Download, UserSquare2, ChevronRight, Mic2, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Job, ContentGeneratorType, GeneratorContext } from "../../types/jobs";
import PrepareInterviewPanel from "./PrepareInterviewPanel";
import PrepareApplicationResumePreview from "./prepare/PrepareApplicationResumePreview";
import PrepareAssetGenerationLoading from "./prepare/PrepareAssetGenerationLoading";
import PrepareTextAssetEditor from "./prepare/PrepareTextAssetEditor";

export type PrepareModalSource = "tracker" | "discovery";

export type PrepareTabId = ContentGeneratorType | "interview";

type GeneratableTab = "resume" | "cover-letter" | "cold-email" | "vpd";

type AssetStatus = "idle" | "loading" | "ready" | "error";

interface TabAssetState {
  status: AssetStatus;
  content: string;
  assetId: string | null;
  error: string | null;
}

const INITIAL_TAB_STATE: TabAssetState = {
  status: "idle",
  content: "",
  assetId: null,
  error: null,
};

interface PrepareApplicationModalProps {
  job: Job;
  /** tracker = opened from an existing application; discovery = job board / new job */
  source?: PrepareModalSource;
  onClose: () => void;
  initialTab?: PrepareTabId;
  onNavigateToStudio?: (context: GeneratorContext) => void;
  onStartInterviewPrep?: (payload: StartInterviewFromJobPayload) => void;
}

const PREPARE_TABS: { id: PrepareTabId; label: string; icon: React.ElementType }[] = [
  { id: "resume", label: "Resume", icon: UserSquare2 },
  { id: "cover-letter", label: "Cover Letter", icon: FileText },
  { id: "cold-email", label: "Cold Email", icon: Mail },
  // VPD tab hidden until prepare-application VPD flow is ready
  // { id: "vpd", label: "Value Prop Doc", icon: Briefcase },
  { id: "interview", label: "Interview Prep", icon: Mic2 },
];

const PrepareApplicationModal: React.FC<PrepareApplicationModalProps> = ({
  job,
  source = "discovery",
  onClose,
  initialTab = "resume",
  onNavigateToStudio,
  onStartInterviewPrep,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PrepareTabId>(initialTab);
  const [tabStates, setTabStates] = useState<Record<GeneratableTab, TabAssetState>>({
    resume: { ...INITIAL_TAB_STATE },
    "cover-letter": { ...INITIAL_TAB_STATE },
    "cold-email": { ...INITIAL_TAB_STATE },
    vpd: { ...INITIAL_TAB_STATE },
  });
  const [ensuringApp, setEnsuringApp] = useState(false);
  const [ensureError, setEnsureError] = useState<string | null>(null);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [interviewLaunchError, setInterviewLaunchError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const applicationIdRef = useRef<string | null>(null);
  const activeTextContentRef = useRef("");

  const {
    applicationId,
    linkedResumeId,
    linkedCoverLetterId,
    linkedColdEmailId,
    syncApplicationAssets,
    resolveApplicationId,
    invalidateResumeCaches,
    resetResolved,
  } = usePrepareApplicationContext(job);

  const isInterviewTab = activeTab === "interview";
  const activeAsset = !isInterviewTab ? tabStates[activeTab as GeneratableTab] : null;

  const setTabState = (tab: GeneratableTab, patch: Partial<TabAssetState>) => {
    setTabStates(prev => ({ ...prev, [tab]: { ...prev[tab], ...patch } }));
  };

  useEffect(() => {
    if (applicationId) applicationIdRef.current = applicationId;
  }, [applicationId]);

  /** Hydrate tabs from application.assets in React Query (linked resume, cover letter, etc.). */
  useEffect(() => {
    const hydrate = (tab: GeneratableTab, assetId: string | null) => {
      if (!assetId) return;
      setTabStates(prev => {
        if (prev[tab].status === "loading") return prev;
        if (prev[tab].assetId === assetId && prev[tab].status === "ready") return prev;
        return {
          ...prev,
          [tab]: {
            status: "ready",
            assetId,
            content: prev[tab].content,
            error: null,
          },
        };
      });
    };

    hydrate("resume", linkedResumeId);
    hydrate("cover-letter", linkedCoverLetterId);
    hydrate("cold-email", linkedColdEmailId);
  }, [linkedResumeId, linkedCoverLetterId, linkedColdEmailId]);

  const tabHasLinkedAsset = (tab: GeneratableTab) => {
    const state = tabStates[tab];
    if (state.status === "ready" && state.assetId) return true;
    if (tab === "resume") return !!linkedResumeId;
    if (tab === "cover-letter") return !!linkedCoverLetterId;
    if (tab === "cold-email") return !!linkedColdEmailId;
    return false;
  };

  const applySyncedAsset = useCallback(
    async (tab: GeneratableTab, fallbackId?: string) => {
      if (tab === "vpd") return;

      const { assets } = await syncApplicationAssets();
      const syncedId = getLinkedAssetId(assets, tab) ?? fallbackId ?? null;
      if (!syncedId) return;

      if (tab === "resume") {
        await invalidateResumeCaches(syncedId);
        setTabState(tab, { status: "ready", assetId: syncedId, error: null });
        return;
      }

      if (tab === "cover-letter") {
        const asset = await fetchCoverLetterById(syncedId);
        setTabState(tab, {
          status: "ready",
          assetId: syncedId,
          content: asset?.content ?? "",
          error: null,
        });
        return;
      }

      if (tab === "cold-email") {
        const asset = await fetchColdEmailById(syncedId);
        setTabState(tab, {
          status: "ready",
          assetId: syncedId,
          content: asset?.content ?? "",
          error: null,
        });
      }
    },
    [syncApplicationAssets, invalidateResumeCaches]
  );

  const runEnsureApplication = useCallback(async (): Promise<string> => {
    if (applicationIdRef.current) return applicationIdRef.current;
    setEnsuringApp(true);
    setEnsureError(null);
    try {
      const id = await resolveApplicationId();
      applicationIdRef.current = id;
      return id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save application";
      setEnsureError(msg);
      throw e;
    } finally {
      setEnsuringApp(false);
    }
  }, [resolveApplicationId]);

  const handleGenerate = async (tab: GeneratableTab = activeTab as GeneratableTab) => {
    if (tab === "vpd") {
      setTabState("vpd", { status: "loading", error: null });
      window.setTimeout(() => {
        setTabState("vpd", {
          status: "ready",
          content: `**Value Proposition for ${job.role}**\n\n1. Strategic Alignment: My experience aligns with ${job.company}'s mission.\n\n2. Key Achievements: I successfully delivered measurable outcomes in similar roles.\n\n3. Next Steps: I'd welcome the chance to discuss how I can contribute to your team.`,
          assetId: null,
          error: null,
        });
      }, 1200);
      return;
    }

    setTabState(tab, { status: "loading", error: null });

    try {
      const applicationIdResolved = await runEnsureApplication();
      const jd = job.description?.trim() || `${job.role} at ${job.company}`;
      const baseParams = {
        role: job.role,
        company: job.company,
        job_description: jd,
        application_id: applicationIdResolved,
      };

      if (tab === "resume") {
        const result = await generateResume({
          application_id: applicationIdResolved,
          company: job.company,
          role: job.role,
          jd,
        });

        if ("error" in result) {
          const existingId = result.error.resume_id;
          if (existingId) {
            await applySyncedAsset(tab, String(existingId));
            return;
          }
          throw new Error(result.error.message ?? "Resume already exists for this application");
        }

        await applySyncedAsset(tab, result.id);
        return;
      }

      if (tab === "cover-letter" || tab === "cold-email") {
        const assetType = tab === "cover-letter" ? "coverletter" : "coldemail";
        const contactName = tab === "cold-email" ? "Hiring Manager" : undefined;
        const availability = await checkApplicationAssetAvailability({
          type: assetType,
          ...baseParams,
          ...(tab === "cold-email" ? { hirname: contactName } : {}),
        });
        if ("error_code" in availability) {
          throw new Error(
            tab === "cover-letter"
              ? "Plus membership required to generate cover letters"
              : "Plus membership required to generate cold emails"
          );
        }
        if ("error" in availability) {
          await applySyncedAsset(tab, String(availability.error.data.existing_asset_id));
          return;
        }

        const genResult = await runApplicationAssetDraftGeneration({
          assetType,
          role: job.role,
          company: job.company,
          jobDescription: jd,
          contactName,
          applicationId: applicationIdResolved,
        });

        const assetId = genResult.assetId;
        if (!assetId) {
          await applySyncedAsset(tab);
          return;
        }

        setTabState(tab, {
          status: "ready",
          assetId,
          content: genResult.draft,
          error: null,
        });
        await syncApplicationAssets();
      }
    } catch (e) {
      setTabState(tab, {
        status: "error",
        error: sanitizeUserFacingError(e instanceof Error ? e.message : "Generation failed", "Generation failed. Please try again."),
      });
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, job.id]);

  const handleCopy = () => {
    const raw = activeAsset?.content ?? "";
    if (!raw) return;
    const text = htmlToPlainText(normalizeContentToHtml(raw));
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    const raw = activeAsset?.content ?? "";
    if (!raw.trim()) return;
    if (activeTab !== "cover-letter" && activeTab !== "cold-email") return;

    void (async () => {
      setIsDownloading(true);
      try {
        await exportApplicationAssetAsPdf(raw, activeTab, job.company, job.role);
      } finally {
        setIsDownloading(false);
      }
    })();
  };

  const handleDownloadVpdText = () => {
    const text = activeAsset?.content ?? "";
    if (!text) return;
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `vpd-${job.company.replace(/\s+/g, "-").toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadDocx = () => {
    const raw = activeAsset?.content ?? "";
    if (!raw.trim()) return;
    if (activeTab !== "cover-letter" && activeTab !== "cold-email") return;

    void (async () => {
      setIsDownloading(true);
      try {
        await exportApplicationAssetAsDocx(raw, activeTab, job.company, job.role);
      } finally {
        setIsDownloading(false);
      }
    })();
  };

  const handleStartInterview = async (payload: {
    roundType: StartInterviewFromJobPayload["roundType"];
    mode: StartInterviewFromJobPayload["mode"];
  }) => {
    setIsStartingInterview(true);
    setInterviewLaunchError(null);
    setEnsureError(null);
    try {
      const appId = await runEnsureApplication();
      const jobDescription = job.description?.trim() || `${job.role} at ${job.company}`;
      const context = {
        company: job.company,
        role: job.role,
        jobDescription,
        applicationId: appId,
      };

      if (payload.mode === "live") {
        storeInterviewLaunch({
          context,
          roundType: payload.roundType,
          mode: payload.mode,
        });
        router.replace(`/uniboard/jobs?tab=interview&view=voice&round=${encodeURIComponent(payload.roundType)}`);
        onClose();
        return;
      }

      const result = await startInterviewSession({
        role: job.role,
        company: job.company,
        jobDescription,
        roundType: payload.roundType,
        applicationId: appId,
      });

      storeInterviewLaunch({
        context,
        roundType: payload.roundType,
        mode: payload.mode,
        interviewId: result.id,
        questions: result.questions,
      });
      router.replace(
        `/uniboard/jobs?tab=interview&view=active&interview_id=${encodeURIComponent(result.id)}&round=${encodeURIComponent(payload.roundType)}`
      );
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not start interview";
      setInterviewLaunchError(message);
      setEnsureError(message);
    } finally {
      setIsStartingInterview(false);
    }
  };

  const handleReferralCallout = () => {
    onNavigateToStudio?.({
      type: "referral",
      jobId: job.id,
      company: job.company,
      role: job.role,
      description: job.description,
    });
    onClose();
  };

  const prepareNavigate: PrepareNavigateTarget = source === "tracker" ? "tracker" : "jobs";

  const handleImproveWithUnibot = (assetId: string, type: "cover-letter" | "cold-email") => {
    if (!onNavigateToStudio) return;
    setPrepareReturnSession({
      jobId: job.id,
      tab: type,
      company: job.company,
      role: job.role,
      navigate: prepareNavigate,
    });
    onNavigateToStudio({
      type,
      assetId,
      jobId: job.id,
      fromPrepareApplication: true,
      navigate: prepareNavigate,
      openImproveMode: true,
      recipientName: type === "cold-email" ? "Hiring Manager" : undefined,
    });
    onClose();
  };

  const activeTextAssetId =
    activeTab === "cover-letter" || activeTab === "cold-email"
      ? (tabStates[activeTab].assetId ?? (activeTab === "cover-letter" ? linkedCoverLetterId : linkedColdEmailId))
      : null;

  const showTextAssetActions =
    !isInterviewTab &&
    (activeTab === "cover-letter" || activeTab === "cold-email") &&
    Boolean(activeTextAssetId) &&
    activeAsset?.status !== "loading" &&
    activeAsset?.status !== "error";

  const persistContentEdit = useCallback(async () => {
    if (!activeAsset?.assetId || activeTab === "resume" || activeTab === "vpd" || activeTab === "interview") return;
    const tab = activeTab as "cover-letter" | "cold-email";
    const content = activeTextContentRef.current;
    if (tab === "cover-letter") {
      await updateCoverLetter({ id: activeAsset.assetId, content });
    } else {
      await updateColdEmail({ id: activeAsset.assetId, content });
    }
  }, [activeAsset?.assetId, activeTab]);

  const {
    hasPendingUnsavedChanges: textAssetHasPendingUnsavedChanges,
    isSaving: textAssetIsSaving,
    savedConfirmationVisible: textAssetSavedConfirmationVisible,
    markDirty: markTextAssetDirty,
    runSave: runTextAssetSave,
    reset: resetTextAssetSaveStatus,
  } = useDocumentAutosave({
    enabled: showTextAssetActions,
    onSave: persistContentEdit,
  });

  useEffect(() => {
    activeTextContentRef.current = activeAsset?.content ?? "";
    resetTextAssetSaveStatus();
  }, [activeAsset?.assetId, activeTab, resetTextAssetSaveStatus]);

  const handleContentChange = (value: string, options?: { hydrate?: boolean }) => {
    if (isInterviewTab || activeTab === "resume" || activeTab === "vpd") return;
    const tab = activeTab as "cover-letter" | "cold-email";
    activeTextContentRef.current = value;
    setTabState(tab, { content: value });
    if (!options?.hydrate) {
      markTextAssetDirty();
    }
  };

  const activeResumeId = activeTab === "resume" ? (tabStates.resume.assetId ?? linkedResumeId) : null;

  const handleDownloadResume = () => {
    const resumeId = tabStates.resume.assetId ?? linkedResumeId;
    if (!resumeId) return;

    void (async () => {
      setIsDownloading(true);
      try {
        await downloadResumePdf({ id: resumeId } as ResumeData);
      } catch (e) {
        window.alert(
          sanitizeUserFacingError(e instanceof Error ? e.message : "Failed to download PDF", "Failed to download PDF. Please try again.")
        );
      } finally {
        setIsDownloading(false);
      }
    })();
  };

  const resumeEditHref = activeResumeId && prepareNavigate ? buildResumePrepareHref(activeResumeId, job.id, prepareNavigate) : null;

  const handleClose = () => {
    resetResolved();
    onClose();
  };

  const renderMainPanel = () => {
    if (isInterviewTab) {
      return <PrepareInterviewPanel job={job} isStarting={isStartingInterview || ensuringApp} onStart={handleStartInterview} />;
    }

    const state = tabStates[activeTab as GeneratableTab];
    const tabLabel = PREPARE_TABS.find(t => t.id === activeTab)?.label ?? "asset";
    const resumeId = state.assetId ?? linkedResumeId;

    if (ensuringApp) {
      return <PrepareAssetGenerationLoading kind="ensuring-app" />;
    }

    if (state.status === "loading") {
      const loadingKind =
        activeTab === "resume" || activeTab === "cover-letter" || activeTab === "cold-email" || activeTab === "vpd"
          ? activeTab
          : "cover-letter";
      return <PrepareAssetGenerationLoading kind={loadingKind} />;
    }

    if (state.status === "error") {
      return (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{state.error ?? ensureError ?? "Something went wrong"}</p>
          <button
            type="button"
            onClick={() => void handleGenerate(activeTab as GeneratableTab)}
            className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Try again
          </button>
        </div>
      );
    }

    if (activeTab === "resume" && resumeId) {
      return <PrepareApplicationResumePreview resumeId={resumeId} editHref={resumeEditHref} />;
    }

    if (
      (activeTab === "cover-letter" || activeTab === "cold-email") &&
      (state.assetId || (activeTab === "cover-letter" ? linkedCoverLetterId : linkedColdEmailId))
    ) {
      const assetId = state.assetId ?? (activeTab === "cover-letter" ? linkedCoverLetterId : linkedColdEmailId)!;
      return (
        <PrepareTextAssetEditor
          kind={activeTab}
          assetId={assetId}
          content={state.content}
          onContentChange={handleContentChange}
          onSave={() => void runTextAssetSave()}
        />
      );
    }

    if (state.status === "ready" && activeTab === "vpd") {
      return (
        <div className="scrollbar-on-hover relative flex-1 overflow-y-auto">
          <textarea
            value={state.content}
            onChange={e => setTabState("vpd", { content: e.target.value })}
            className="h-full min-h-[320px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-6 font-mono text-sm leading-relaxed text-slate-800 outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            spellCheck={false}
          />
        </div>
      );
    }

    return (
      <div className="mx-auto flex max-w-sm flex-1 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
        <Wand2 size={48} className="mb-4 text-brand-500 opacity-20" />
        <h3 className="mb-2 font-medium text-slate-900 dark:text-white">Ready to Generate?</h3>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          {applicationId
            ? `Create or refresh a tailored ${tabLabel.toLowerCase()} for this application.`
            : `We'll save this job to your tracker, then create a tailored ${tabLabel.toLowerCase()} from your profile and the job description.`}
        </p>
        {ensureError && <p className="mb-4 text-xs text-red-500">{ensureError}</p>}
        <button
          type="button"
          onClick={() => void handleGenerate(activeTab as GeneratableTab)}
          disabled={ensuringApp}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-50"
        >
          <Wand2 size={16} fill="currentColor" />
          Generate Draft
        </button>
      </div>
    );
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${MODAL_OVERLAY_Z_CLASS} flex animate-in items-center justify-center bg-black/50 p-4 backdrop-blur-sm fade-in duration-200`}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prepare-application-title"
        className="relative flex h-[600px] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        {isStartingInterview && (
          <InterviewLaunchOverlay
            error={interviewLaunchError}
            onDismissError={() => {
              setInterviewLaunchError(null);
              setIsStartingInterview(false);
            }}
          />
        )}
        <div className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6">
            <h2 id="prepare-application-title" className="mb-3 text-xs font-medium text-slate-400">
              Prepare Application
            </h2>
            <h3 className="mb-1 line-clamp-1 text-lg font-medium text-slate-900 dark:text-white">{job.role}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{job.company}</p>
            {source === "discovery" && applicationId && (
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Saved to tracker
              </p>
            )}
          </div>

          <div className="shrink-0 space-y-1">
            {PREPARE_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const tabKey = tab.id as GeneratableTab | "interview";
              const isLoading = tabKey !== "interview" && tabStates[tabKey as GeneratableTab]?.status === "loading";
              const hasAsset = tabKey !== "interview" && tabHasLinkedAsset(tabKey as GeneratableTab);

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white text-brand-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-brand-400 dark:ring-slate-700"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Icon size={16} className="shrink-0 opacity-70" />
                  <span className="flex-1">{tab.label}</span>
                  {isLoading && <Loader2 size={14} className="shrink-0 animate-spin text-brand-500" />}
                  {!isLoading && hasAsset && <Check size={14} className="shrink-0 text-emerald-500" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleReferralCallout}
            disabled={!onNavigateToStudio}
            className="mt-auto flex shrink-0 flex-col rounded-2xl border border-brand-900/40 bg-gradient-to-br from-[#001433] via-[#002654] to-[#003366] p-4 text-left transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div>
              <p className="text-sm font-semibold text-white">Referral request</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/75">
                Ask for a warm intro and craft a referral message in Content Lab.
              </p>
            </div>
            <span className="mt-3 flex items-center gap-1.5 text-sm font-medium text-white">
              Open Content Lab
              <ChevronRight size={14} className="shrink-0 opacity-90" />
            </span>
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-slate-900">
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-6 dark:border-slate-800">
            <h2 className="flex min-w-0 items-center gap-2 truncate font-medium text-slate-900 dark:text-white">
              {isInterviewTab ? (
                <>
                  <Mic2 size={16} className="text-brand-500" /> Interview Prep
                  {(isStartingInterview || ensuringApp) && <Loader2 size={14} className="animate-spin text-brand-500" />}
                </>
              ) : (
                <>
                  <Wand2 size={16} className="text-brand-500" /> Generate {PREPARE_TABS.find(t => t.id === activeTab)?.label}
                  {activeAsset?.status === "loading" && <Loader2 size={14} className="animate-spin text-brand-500" />}
                </>
              )}
            </h2>
            <div className="flex shrink-0 items-center gap-2">
              {activeTab === "resume" && activeResumeId && tabStates.resume.status === "ready" && (
                <button
                  type="button"
                  onClick={handleDownloadResume}
                  disabled={isDownloading}
                  title="Download PDF"
                  aria-label="Download resume PDF"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {isDownloading ? "Preparing…" : "Download"}
                </button>
              )}
              {showTextAssetActions && (
                <DocumentSaveStatusBar
                  variant="modal"
                  hasPendingUnsavedChanges={textAssetHasPendingUnsavedChanges}
                  isSaving={textAssetIsSaving}
                  savedConfirmationVisible={textAssetSavedConfirmationVisible}
                  onSaveNow={() => void runTextAssetSave()}
                  visible={textAssetHasPendingUnsavedChanges || textAssetIsSaving || textAssetSavedConfirmationVisible}
                />
              )}
              {showTextAssetActions && (
                <>
                  <button
                    type="button"
                    onClick={handleCopy}
                    title={copied ? "Copied" : "Copy"}
                    aria-label={copied ? "Copied" : "Copy to clipboard"}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Copy size={14} />
                  </button>
                  {activeTab === "cover-letter" ? (
                    <ApplicationAssetDownloadMenu
                      isBusy={isDownloading}
                      onDownloadPdf={handleDownloadPdf}
                      onDownloadDocx={handleDownloadDocx}
                    />
                  ) : null}
                  {/* Cold email is copy-only in prepare modal; restore download menu here if needed later. */}
                  {/* {activeTab === "cold-email" ? (
                    <ApplicationAssetDownloadMenu
                      isBusy={isDownloading}
                      onDownloadPdf={handleDownloadPdf}
                      onDownloadDocx={handleDownloadDocx}
                    />
                  ) : null} */}
                </>
              )}
              {!isInterviewTab && activeAsset?.status === "ready" && activeTab === "vpd" && (
                <>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Copy size={12} /> {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadVpdText}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Download size={12} /> Download
                  </button>
                </>
              )}
              <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-800" />
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div
            className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
              (activeTab === "resume" && activeResumeId) ||
              ((activeTab === "cover-letter" || activeTab === "cold-email") && activeTextAssetId)
                ? "p-4"
                : "p-8"
            }`}
          >
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">{renderMainPanel()}</div>
          </div>

          {!isInterviewTab && showTextAssetActions && activeTextAssetId && onNavigateToStudio && (
            <div className="flex shrink-0 justify-end border-t border-slate-100 px-6 py-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleImproveWithUnibot(activeTextAssetId, activeTab === "cold-email" ? "cold-email" : "cover-letter")}
                className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-300 dark:hover:bg-brand-900/60"
              >
                <Wand2 size={16} /> Improve with Unibot
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PrepareApplicationModal;
