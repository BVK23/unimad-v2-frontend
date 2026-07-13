import React, { useEffect, useMemo, useRef, useState } from "react";
import JobUrlImportLoading from "@/components/jobs/JobUrlImportLoading";
import { ResumeCardSkeletonStyles, ResumeCardsLoadingSkeletons } from "@/components/resume/ResumeCardSkeleton";
import ResumeDashboardCard from "@/components/resume/ResumeDashboardCard";
import ResumeFlowErrorAlert from "@/components/resume/ResumeFlowErrorAlert";
import ResumeGenerationOverlay from "@/components/resume/ResumeGenerationOverlay";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { OnboardingGateTooltip } from "@/components/ui/OnboardingGateTooltip";
import { FINISH_ONBOARDING_CTA } from "@/constants/onboarding-tooltips";
import { importJobFromUrl } from "@/features/jobs/server-actions/jobs-actions";
import { useOnboardingGate } from "@/features/onboarding/context/OnboardingGateContext";
import { ONBOARDING_ROUTE } from "@/features/onboarding/featureGates";
import { mapBackendResumeToFrontend } from "@/features/resume/api/mappers";
import { resumesListQueryKey, useResumesList } from "@/features/resume/hooks/useResumesList";
import { useUpdateResume } from "@/features/resume/hooks/useUpdateResume";
import {
  duplicateResume,
  deleteResume,
  extractResumePreview,
  generateResume,
  setBaseResume,
} from "@/features/resume/server-actions/resume-actions";
import { downloadResumePdf } from "@/features/resume/utils/downloadResumePdf";
import { RESUME_FLOW_ERROR_CODES, resumeFlowErrorMessage, type ResumeFlowError } from "@/features/resume/utils/resume-flow-errors";
import { copyResumePublicLink, isResumePublished } from "@/features/resume/utils/resumePublish";
import { buildResumeVersionMetadata } from "@/features/resume/utils/resumeVersionGroups";
import { ResumeData } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, FilePlus, Upload, FileType, X, ArrowLeft, Loader2, AlertCircle, Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type JdEntryMode = "url" | "manual";

const MAX_RESUME_UPLOAD_BYTES = 5 * 1024 * 1024;

const isResumePdfFile = (file: File): boolean => {
  const mime = file.type.trim().toLowerCase();
  if (mime === "application/pdf" || mime === "application/x-pdf") return true;
  return file.name.trim().toLowerCase().endsWith(".pdf");
};

interface ResumeDashboardProps {
  onEditResume: (resume: ResumeData) => void;
  onCreateResume: (type: "scratch" | "jd" | "upload", resumeId?: string) => void | Promise<void>;
}

const ResumeDashboard: React.FC<ResumeDashboardProps> = ({ onEditResume, onCreateResume }) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { featureGates } = useOnboardingGate();
  const { mutateAsync: updateResumeMutation } = useUpdateResume();
  const { data: resumesList = [], isLoading, isError, error } = useResumesList();
  const resumes = Array.isArray(resumesList) ? resumesList : [];

  const [createModalState, setCreateModalState] = useState<"closed" | "menu" | "jd" | "upload">("closed");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeMenuAnchor, setActiveMenuAnchor] = useState<HTMLElement | null>(null);
  const [copiedLinkResumeId, setCopiedLinkResumeId] = useState<string | null>(null);
  const copiedLinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteResume, setPendingDeleteResume] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [pendingRenameResume, setPendingRenameResume] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [settingBaseId, setSettingBaseId] = useState<string | null>(null);
  const [baseStatusMessage, setBaseStatusMessage] = useState<string | null>(null);
  const [baseStatusType, setBaseStatusType] = useState<"success" | "error" | null>(null);

  // Form States
  const [jdMode, setJdMode] = useState<JdEntryMode>("url");
  const [jobUrl, setJobUrl] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [jdCompany, setJdCompany] = useState("");
  const [jdRole, setJdRole] = useState("");
  const [jdText, setJdText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jdError, setJdError] = useState<ResumeFlowError | null>(null);
  const [duplicateResumeId, setDuplicateResumeId] = useState<string | null>(null);
  const [isUploadingFromFile, setIsUploadingFromFile] = useState(false);
  const [uploadError, setUploadError] = useState<ResumeFlowError | null>(null);
  const [isUploadDragOver, setIsUploadDragOver] = useState(false);
  const [newlyDuplicatedResumeId, setNewlyDuplicatedResumeId] = useState<string | null>(null);
  const [duplicateToastMessage, setDuplicateToastMessage] = useState<string | null>(null);
  const isCreateFlowBusy = isGenerating || isUploadingFromFile || isImporting;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const duplicateToastTimeoutRef = useRef<number | null>(null);

  const resumeVersionMetadata = useMemo(() => buildResumeVersionMetadata(resumes), [resumes]);
  const sortedResumes = useMemo(() => [...resumes].sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()), [resumes]);
  const hasBaseResume = useMemo(() => resumes.some(resume => resume.isBase), [resumes]);

  const handleSetCardRef = (id: string, element: HTMLDivElement | null) => {
    if (element) {
      cardRefs.current.set(id, element);
      return;
    }
    cardRefs.current.delete(id);
  };

  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>, resumeId: string) => {
    e.stopPropagation();
    if (activeMenuId === resumeId) {
      closeActionsMenu();
      return;
    }
    setActiveMenuAnchor(e.currentTarget);
    setActiveMenuId(resumeId);
  };

  const closeActionsMenu = () => {
    setActiveMenuId(null);
    setActiveMenuAnchor(null);
  };

  const resetJdState = () => {
    setJdMode("url");
    setJobUrl("");
    setImportError(null);
    setIsImporting(false);
    setJdCompany("");
    setJdRole("");
    setJdText("");
    setJdError(null);
    setDuplicateResumeId(null);
  };

  const openTargetedResumeFlow = () => {
    if (!featureGates.resume_jd_create) {
      router.push(ONBOARDING_ROUTE);
      return;
    }
    resetJdState();
    setCreateModalState("jd");
  };

  const closeCreateModal = () => {
    if (isCreateFlowBusy) return;
    setCreateModalState("closed");
    resetJdState();
    resetUploadState();
  };

  const navigateToGeneratedResume = async (resumeId: string) => {
    setCreateModalState("closed");
    resetJdState();
    await onCreateResume("jd", resumeId);
  };

  const runTargetedResumeGeneration = async (params: { company: string; role: string; jd: string; applicationId?: string }) => {
    setJdError(null);
    setDuplicateResumeId(null);
    setIsGenerating(true);
    try {
      const result = await generateResume({
        company: params.company,
        role: params.role,
        jd: params.jd,
        ...(params.applicationId ? { application_id: params.applicationId } : {}),
      });
      if (!result.ok) {
        if (result.code === RESUME_FLOW_ERROR_CODES.RESUME_DUPLICATE) {
          setJdError({ code: result.code, message: result.message });
          setDuplicateResumeId(result.duplicate?.resume_id ?? null);
          return;
        }
        setJdError({ code: result.code, message: result.message });
        return;
      }
      if (!result.id) {
        setJdError({
          code: RESUME_FLOW_ERROR_CODES.RESUME_GENERATE_NO_ID,
          message: resumeFlowErrorMessage(RESUME_FLOW_ERROR_CODES.RESUME_GENERATE_NO_ID),
        });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["resumes"] });
      await navigateToGeneratedResume(String(result.id));
    } catch {
      setJdError({
        code: RESUME_FLOW_ERROR_CODES.RESUME_GENERATE_FAILED,
        message: resumeFlowErrorMessage(RESUME_FLOW_ERROR_CODES.RESUME_GENERATE_FAILED),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, resume: ResumeData) => {
    e.stopPropagation();
    closeActionsMenu();
    setDuplicatingId(resume.id);
    try {
      const result = await duplicateResume(resume.id);
      if ("error" in result) {
        alert(result.error ?? "Failed to duplicate resume");
        return;
      }

      // Seed the list cache directly from the create response. This is the
      // authoritative committed row, so the new card renders instantly without a
      // follow-up GET that could return a stale list (read-after-write race
      // behind cloud proxies). We intentionally do NOT force a refetch here — the
      // list self-heals on the next natural refetch once the backend is
      // consistent, which is never inside the race window.
      const createdResume = result.resume ? mapBackendResumeToFrontend(result.resume) : null;

      if (createdResume) {
        queryClient.setQueryData<ResumeData[]>(resumesListQueryKey, previous =>
          previous ? [createdResume, ...previous.filter(item => item.id !== createdResume.id)] : [createdResume]
        );
      } else {
        // Backward-compat: older backend that returns only `{ id }`.
        await queryClient.refetchQueries({ queryKey: resumesListQueryKey, exact: true });
      }

      setNewlyDuplicatedResumeId(result.id);

      const duplicatedTitle =
        createdResume?.title ??
        queryClient.getQueryData<ResumeData[]>(resumesListQueryKey)?.find(item => item.id === result.id)?.title ??
        "Resume";
      setDuplicateToastMessage(`Duplicated as "${duplicatedTitle}"`);
    } finally {
      setDuplicatingId(null);
    }
  };

  useEffect(() => {
    if (!duplicateToastMessage) {
      return;
    }

    if (duplicateToastTimeoutRef.current) {
      window.clearTimeout(duplicateToastTimeoutRef.current);
    }

    duplicateToastTimeoutRef.current = window.setTimeout(() => {
      setDuplicateToastMessage(null);
    }, 2400);

    return () => {
      if (duplicateToastTimeoutRef.current) {
        window.clearTimeout(duplicateToastTimeoutRef.current);
      }
    };
  }, [duplicateToastMessage]);

  useEffect(() => {
    if (!newlyDuplicatedResumeId) {
      return;
    }

    const highlightTimeout = window.setTimeout(() => {
      setNewlyDuplicatedResumeId(null);
    }, 2500);

    const cardElement = cardRefs.current.get(newlyDuplicatedResumeId);
    const scrollContainer = scrollContainerRef.current;

    if (cardElement && scrollContainer) {
      const cardRect = cardElement.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const isFullyVisible = cardRect.top >= containerRect.top && cardRect.bottom <= containerRect.bottom;

      if (!isFullyVisible) {
        cardElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    return () => {
      window.clearTimeout(highlightTimeout);
    };
  }, [newlyDuplicatedResumeId, resumes]);

  const resetUploadState = () => {
    setUploadFile(null);
    setUploadError(null);
    setIsUploadDragOver(false);
    setIsUploadingFromFile(false);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  const applyUploadResumeFile = (file: File | null | undefined) => {
    if (!file) return;

    if (file.size > MAX_RESUME_UPLOAD_BYTES) {
      setUploadError({
        code: RESUME_FLOW_ERROR_CODES.RESUME_UPLOAD_TOO_LARGE,
        message: resumeFlowErrorMessage(RESUME_FLOW_ERROR_CODES.RESUME_UPLOAD_TOO_LARGE),
      });
      setUploadFile(null);
      return;
    }

    if (!isResumePdfFile(file)) {
      setUploadError({
        code: RESUME_FLOW_ERROR_CODES.RESUME_UPLOAD_INVALID_TYPE,
        message: resumeFlowErrorMessage(RESUME_FLOW_ERROR_CODES.RESUME_UPLOAD_INVALID_TYPE),
      });
      setUploadFile(null);
      return;
    }

    setUploadError(null);
    setUploadFile(file);
  };

  const handleUploadFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    applyUploadResumeFile(event.target.files?.[0]);
  };

  const handleUploadDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsUploadDragOver(false);
    if (isUploadingFromFile) return;
    applyUploadResumeFile(event.dataTransfer.files?.[0]);
  };

  const handleUploadExtract = async () => {
    if (!uploadFile) {
      uploadInputRef.current?.click();
      return;
    }
    setUploadError(null);
    setIsUploadingFromFile(true);
    try {
      const formData = new FormData();
      formData.append("resume", uploadFile);
      const preview = await extractResumePreview(formData);

      if (!preview.ok) {
        setUploadError({ code: preview.code, message: preview.message });
        return;
      }

      const rawExtracted = preview.extracted_data;
      const resumeData =
        rawExtracted && typeof rawExtracted === "object" && "data" in rawExtracted
          ? (rawExtracted as { data?: Record<string, unknown> }).data
          : (rawExtracted as Record<string, unknown> | undefined);

      if (!resumeData || !Object.keys(resumeData).length) {
        setUploadError({
          code: RESUME_FLOW_ERROR_CODES.RESUME_EXTRACT_NO_SECTIONS,
          message: resumeFlowErrorMessage(RESUME_FLOW_ERROR_CODES.RESUME_EXTRACT_NO_SECTIONS),
        });
        return;
      }

      const result = await generateResume({ resumeData });
      if (!result.ok) {
        setUploadError({ code: result.code, message: result.message });
        return;
      }
      if (!result.id) {
        setUploadError({
          code: RESUME_FLOW_ERROR_CODES.RESUME_GENERATE_NO_ID,
          message: resumeFlowErrorMessage(RESUME_FLOW_ERROR_CODES.RESUME_GENERATE_NO_ID),
        });
        return;
      }

      if (!hasBaseResume) {
        const baseResult = await setBaseResume(String(result.id)).catch(() => null);
        if (baseResult === null) {
          setUploadError({
            code: RESUME_FLOW_ERROR_CODES.RESUME_GENERATE_FAILED,
            message: "Your resume was created, but we couldn't set it as your base resume. Open it from the list below.",
          });
          resetUploadState();
          setCreateModalState("closed");
          await onCreateResume("upload", String(result.id));
          return;
        }
      }

      resetUploadState();
      setCreateModalState("closed");
      await onCreateResume("upload", String(result.id));
    } catch {
      setUploadError({
        code: RESUME_FLOW_ERROR_CODES.RESUME_EXTRACT_FAILED,
        message: resumeFlowErrorMessage(RESUME_FLOW_ERROR_CODES.RESUME_EXTRACT_FAILED),
      });
    } finally {
      setIsUploadingFromFile(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    closeActionsMenu();
    const resumeToDelete = resumes.find(resume => resume.id === id);
    if (!resumeToDelete) return;
    setPendingDeleteResume({ id, title: resumeToDelete.title });
  };

  const handleRename = (e: React.MouseEvent, resume: ResumeData) => {
    e.stopPropagation();
    closeActionsMenu();
    setRenameError(null);
    setRenameInput(resume.title);
    setPendingRenameResume({ id: resume.id, title: resume.title });
  };

  const handleConfirmRename = async () => {
    if (!pendingRenameResume) return;
    const trimmed = renameInput.trim();
    if (!trimmed) {
      setRenameError("Enter a resume name.");
      return;
    }
    if (trimmed === pendingRenameResume.title.trim()) {
      setPendingRenameResume(null);
      setRenameError(null);
      return;
    }

    const resumeToRename = resumes.find(resume => resume.id === pendingRenameResume.id);
    if (!resumeToRename) {
      setRenameError("Resume not found. Refresh and try again.");
      return;
    }

    setRenamingId(pendingRenameResume.id);
    setRenameError(null);
    try {
      await updateResumeMutation({
        resumeId: pendingRenameResume.id,
        data: { ...resumeToRename, title: trimmed, lastModified: new Date() },
      });
      setPendingRenameResume(null);
      setBaseStatusType("success");
      setBaseStatusMessage("Resume renamed");
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : "Failed to rename resume");
    } finally {
      setRenamingId(null);
    }
  };

  const handleConfirmDeleteResume = async () => {
    if (!pendingDeleteResume) return;
    setDeletingId(pendingDeleteResume.id);
    try {
      await deleteResume(pendingDeleteResume.id);
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setPendingDeleteResume(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete resume");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent, resume: ResumeData) => {
    e.stopPropagation();
    if (!isResumePublished(resume)) return;
    const copied = await copyResumePublicLink(resume);
    if (!copied) {
      setBaseStatusType("error");
      setBaseStatusMessage("Could not copy link to clipboard");
      return;
    }
    closeActionsMenu();
    setCopiedLinkResumeId(resume.id);
    if (copiedLinkTimeoutRef.current) clearTimeout(copiedLinkTimeoutRef.current);
    copiedLinkTimeoutRef.current = setTimeout(() => {
      setCopiedLinkResumeId(current => (current === resume.id ? null : current));
      copiedLinkTimeoutRef.current = null;
    }, 3000);
  };

  const handleSetBaseResume = async (e: React.MouseEvent, resume: ResumeData) => {
    e.stopPropagation();
    if (resume.isBase) return;
    setBaseStatusMessage(null);
    setBaseStatusType(null);
    closeActionsMenu();
    setSettingBaseId(resume.id);
    try {
      await setBaseResume(resume.id);
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setBaseStatusType("success");
      setBaseStatusMessage("Base resume updated");
    } catch (err) {
      setBaseStatusType("error");
      setBaseStatusMessage(err instanceof Error ? err.message : "Failed to set base resume");
    } finally {
      setSettingBaseId(null);
    }
  };

  const handleDownload = async (e: React.MouseEvent, resume: ResumeData) => {
    e.stopPropagation();
    closeActionsMenu();
    setDownloadingId(resume.id);
    try {
      await downloadResumePdf(resume);
      if (!featureGates.niche_complete) {
        router.push(ONBOARDING_ROUTE);
      }
    } catch (err) {
      setBaseStatusType("error");
      setBaseStatusMessage(err instanceof Error ? err.message : "Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCreateTargetedResume = async () => {
    const company = jdCompany.trim();
    const role = jdRole.trim();
    const jd = jdText.trim();
    if (!company || !role || jd.length < 10) {
      setJdError({
        code: RESUME_FLOW_ERROR_CODES.RESUME_JD_INCOMPLETE,
        message: resumeFlowErrorMessage(RESUME_FLOW_ERROR_CODES.RESUME_JD_INCOMPLETE),
      });
      return;
    }
    await runTargetedResumeGeneration({ company, role, jd });
  };

  const handleImportAndCreateTargetedResume = async () => {
    const trimmed = jobUrl.trim();
    if (!trimmed) {
      setImportError("Paste a job posting URL to continue.");
      return;
    }
    setIsImporting(true);
    setImportError(null);
    setJdError(null);
    setDuplicateResumeId(null);
    try {
      const result = await importJobFromUrl(trimmed);
      if (!result.success) {
        setImportError(result.error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      const app = result.application;
      const jd = app.job_description?.trim() || `${app.role} at ${app.company}`;
      setIsImporting(false);
      await runTargetedResumeGeneration({
        company: app.company,
        role: app.role,
        jd,
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
    <div
      ref={scrollContainerRef}
      className="scrollbar-on-hover relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-slate-50 p-8"
      onClick={() => closeActionsMenu()}
    >
      <div className="mx-auto w-full max-w-6xl min-w-0">
        <div className="mb-8">
          <h1 className="text-2xl font-normal text-slate-900">Resumes</h1>
          <p className="text-slate-500 mt-1">Manage and tailor your resumes for different opportunities.</p>
        </div>

        {isError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800">
            <AlertCircle size={20} className="shrink-0" />
            <span>{error instanceof Error ? error.message : "Failed to load resumes"}</span>
          </div>
        )}

        {baseStatusMessage && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm border ${
              baseStatusType === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <AlertCircle size={18} className="shrink-0" />
            <span className="flex-1">{baseStatusMessage}</span>
            <button
              type="button"
              onClick={() => {
                setBaseStatusMessage(null);
                setBaseStatusType(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid w-full min-w-0 grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Create New Card (Visual Shortcut) */}
          <button
            onClick={e => {
              e.stopPropagation();
              setCreateModalState("menu");
            }}
            className="group flex w-full min-w-0 flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-xl hover:border-brand-400 hover:bg-brand-50/50 transition-all cursor-pointer bg-white"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600 mb-3 transition-colors">
              <Plus size={24} />
            </div>
            <span className="font-medium text-slate-600 group-hover:text-brand-600">New Resume</span>
          </button>

          {isLoading && <ResumeCardsLoadingSkeletons />}

          {/* Resume Cards */}
          {!isLoading &&
            sortedResumes.map(resume => (
              <ResumeDashboardCard
                key={resume.id}
                resume={resume}
                versionMetadata={resumeVersionMetadata.get(resume.id)}
                activeMenuId={activeMenuId}
                menuAnchorEl={activeMenuId === resume.id ? activeMenuAnchor : null}
                duplicatingId={duplicatingId}
                deletingId={deletingId}
                settingBaseId={settingBaseId}
                newlyDuplicatedResumeId={newlyDuplicatedResumeId}
                setCardRef={handleSetCardRef}
                onEditResume={onEditResume}
                onRename={handleRename}
                onToggleMenu={handleToggleMenu}
                onCloseMenu={closeActionsMenu}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onSetBaseResume={handleSetBaseResume}
                onCopyLink={handleCopyLink}
                onDownload={handleDownload}
                copiedLinkResumeId={copiedLinkResumeId}
                downloadingId={downloadingId}
              />
            ))}
        </div>
        {isLoading ? <ResumeCardSkeletonStyles /> : null}
      </div>

      {/* Create Modal */}
      {createModalState !== "closed" && (
        <ModalPortalOverlay
          className="flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative my-auto flex max-h-[min(90dvh,calc(100vh-2rem))] w-full max-w-2xl min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#1a1a1a]">
            <div className="shrink-0 border-b border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-[#1a1a1a]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {createModalState !== "menu" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isCreateFlowBusy) return;
                        if (createModalState === "jd") {
                          resetJdState();
                        }
                        if (createModalState === "upload") {
                          resetUploadState();
                        }
                        setCreateModalState("menu");
                      }}
                      disabled={isCreateFlowBusy}
                      className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <h2 className="truncate text-xl font-normal text-slate-900 dark:text-white">
                    {createModalState === "menu" && "Create New Resume"}
                    {createModalState === "jd" && "Target Job Description"}
                    {createModalState === "upload" && "Upload Existing Resume"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isCreateFlowBusy}
                  className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <X size={20} />
                </button>
              </div>

              {createModalState === "jd" && (
                <div className="mt-5 flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setJdMode("url")}
                    disabled={isCreateFlowBusy}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                      jdMode === "url"
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    <LinkIcon size={16} /> From job URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setJdMode("manual")}
                    disabled={isCreateFlowBusy}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                      jdMode === "manual"
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    <FileText size={16} /> Enter manually
                  </button>
                </div>
              )}
            </div>

            <div
              className={`scrollbar-on-hover relative min-h-0 flex-1 p-6 sm:p-8 ${
                isGenerating || isUploadingFromFile ? "overflow-hidden" : "overflow-y-auto"
              }`}
            >
              {(isGenerating || isUploadingFromFile) && <ResumeGenerationOverlay variant={isUploadingFromFile ? "upload" : "jd"} />}
              {/* 1. MAIN MENU */}
              {createModalState === "menu" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => {
                      setCreateModalState("closed");
                      onCreateResume("scratch");
                    }}
                    className="flex flex-col items-center text-center p-6 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all group"
                  >
                    <div className="w-14 h-14 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FilePlus size={24} />
                    </div>
                    <h3 className="font-medium text-slate-900 mb-2">Start from Scratch</h3>
                    <p className="text-xs text-slate-500">Build your resume step-by-step with our smart editor.</p>
                  </button>

                  <OnboardingGateTooltip
                    enabled={!featureGates.resume_jd_create}
                    messageKey="resume_jd"
                    kind="profile_setup"
                    className="block w-full"
                  >
                    <button
                      onClick={openTargetedResumeFlow}
                      disabled={!featureGates.resume_jd_create}
                      className={`flex w-full flex-col items-center text-center p-6 rounded-xl border border-slate-200 transition-all group ${
                        featureGates.resume_jd_create ? "hover:border-brand-500 hover:bg-brand-50/50" : "cursor-not-allowed opacity-50"
                      }`}
                    >
                      <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileType size={24} />
                      </div>
                      <h3 className="font-medium text-slate-900 mb-2">Target Job Description</h3>
                      <p className="text-xs text-slate-500">Paste a JD and let AI tailor a resume for you.</p>
                    </button>
                  </OnboardingGateTooltip>

                  <button
                    onClick={() => {
                      resetUploadState();
                      setCreateModalState("upload");
                    }}
                    className="flex flex-col items-center text-center p-6 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all group"
                  >
                    <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload size={24} />
                    </div>
                    <h3 className="font-medium text-slate-900 mb-2">Upload Resume</h3>
                    <p className="text-xs text-slate-500">Upload a PDF to extract content and create a new resume.</p>
                  </button>
                </div>
              )}

              {/* 2. TARGET JD FORM */}
              {createModalState === "jd" && (
                <div className="mx-auto max-w-lg space-y-4">
                  {(jdError || importError) && (
                    <div className="space-y-2">
                      {jdError ? (
                        <ResumeFlowErrorAlert message={jdError.message} code={jdError.code} />
                      ) : (
                        <ResumeFlowErrorAlert message={importError ?? ""} />
                      )}
                      {duplicateResumeId && (
                        <button
                          type="button"
                          onClick={() => void navigateToGeneratedResume(duplicateResumeId)}
                          className="w-full rounded-lg py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                        >
                          Open existing resume
                        </button>
                      )}
                    </div>
                  )}

                  {jdMode === "url" ? (
                    <div className="relative min-h-[12rem]">
                      <div
                        className={`space-y-4 transition-opacity ${isImporting ? "pointer-events-none opacity-0" : "opacity-100"}`}
                        aria-hidden={isImporting}
                      >
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Paste a public job posting link. We&apos;ll extract the role, company, and description, add it to your tracker,
                          then generate a tailored resume.
                        </p>
                        <div className="relative">
                          <LinkIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="url"
                            value={jobUrl}
                            onChange={e => {
                              setJobUrl(e.target.value);
                              setImportError(null);
                            }}
                            placeholder="https://www.linkedin.com/jobs/view/..."
                            disabled={isCreateFlowBusy}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                        {showLinkedInHint && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Use the public URL (<span className="font-medium">linkedin.com/jobs/view/...</span>), not a feed link.
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleImportAndCreateTargetedResume()}
                          disabled={!jobUrl.trim() || isCreateFlowBusy}
                          className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Extract & create resume
                        </button>
                      </div>
                      {isImporting && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/95 dark:bg-slate-900/95">
                          <JobUrlImportLoading compact />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Add role, company, and job description when you don&apos;t have a posting link.
                      </p>
                      <div>
                        <label htmlFor="jd-company" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Company Name
                        </label>
                        <input
                          id="jd-company"
                          value={jdCompany}
                          onChange={e => setJdCompany(e.target.value)}
                          placeholder="e.g. Google, Airbnb"
                          disabled={isCreateFlowBusy}
                          className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="jd-role" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Job Role / Title
                        </label>
                        <input
                          id="jd-role"
                          value={jdRole}
                          onChange={e => setJdRole(e.target.value)}
                          placeholder="e.g. Senior Frontend Developer"
                          disabled={isCreateFlowBusy}
                          className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="jd-text" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Job Description
                        </label>
                        <textarea
                          id="jd-text"
                          value={jdText}
                          onChange={e => setJdText(e.target.value)}
                          placeholder="Paste or type the job description here..."
                          rows={6}
                          disabled={isCreateFlowBusy}
                          className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={!jdCompany.trim() || !jdRole.trim() || jdText.trim().length < 10 || isCreateFlowBusy}
                        onClick={() => void handleCreateTargetedResume()}
                        className="mt-2 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Create Targeted Resume
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* 3. UPLOAD FORM */}
              {createModalState === "upload" && (
                <div className="mx-auto max-w-lg space-y-6">
                  {uploadError && <ResumeFlowErrorAlert message={uploadError.message} code={uploadError.code} />}

                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Upload a PDF to extract your experience, education, skills, and projects into a new resume.
                      {!hasBaseResume && (
                        <> This resume will be your base resume used for personalising Unibot behaviour throughout the app.</>
                      )}
                    </p>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Upload your existing resume (PDF)
                    </label>
                    <label
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group block ${
                        isUploadDragOver
                          ? "border-brand-500 bg-brand-50/40 dark:bg-brand-500/10"
                          : "border-slate-300 hover:border-brand-400 bg-slate-50 hover:bg-brand-50/30 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-brand-500/60 dark:hover:bg-brand-500/5"
                      }`}
                      onDragOver={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!isUploadingFromFile) setIsUploadDragOver(true);
                      }}
                      onDragLeave={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        setIsUploadDragOver(false);
                      }}
                      onDrop={handleUploadDrop}
                    >
                      <div className="w-16 h-16 bg-white dark:bg-slate-800 shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform text-brand-500">
                        <Upload size={28} />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Click to upload</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">or drag and drop your resume file here</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-medium">PDF only · Max 5MB</p>
                      <input
                        ref={uploadInputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={handleUploadFileChange}
                      />
                    </label>

                    {uploadFile && (
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-brand-500" />
                          <span className="truncate max-w-[220px]">{uploadFile.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadFile(null);
                            if (uploadInputRef.current) {
                              uploadInputRef.current.value = "";
                            }
                          }}
                          className="text-xs text-slate-500 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleUploadExtract()}
                      disabled={isUploadingFromFile}
                      className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {uploadFile ? "Extract & Create Resume" : "Select PDF & Extract"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-slate-50 p-4 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
              Unimad AI helps you beat the ATS and get hired faster.
            </div>
          </div>
        </ModalPortalOverlay>
      )}

      {pendingRenameResume && (
        <ModalPortalOverlay
          className="flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={e => {
            e.stopPropagation();
            if (renamingId) return;
            setPendingRenameResume(null);
            setRenameError(null);
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-labelledby="rename-resume-title"
            aria-modal="true"
          >
            <div className="p-6 border-b border-slate-100">
              <h3 id="rename-resume-title" className="text-lg font-medium text-slate-900">
                Rename resume
              </h3>
              <p className="text-sm text-slate-500 mt-1">Update how this resume appears on your dashboard.</p>
              <label className="block mt-4">
                <span className="sr-only">Resume name</span>
                <input
                  type="text"
                  value={renameInput}
                  onChange={e => {
                    setRenameInput(e.target.value);
                    if (renameError) setRenameError(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleConfirmRename();
                    }
                    if (e.key === "Escape" && !renamingId) {
                      setPendingRenameResume(null);
                      setRenameError(null);
                    }
                  }}
                  autoFocus
                  disabled={Boolean(renamingId)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
                  placeholder="Untitled Resume"
                />
              </label>
              {renameError ? <p className="mt-2 text-sm text-red-600">{renameError}</p> : null}
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPendingRenameResume(null);
                  setRenameError(null);
                }}
                disabled={Boolean(renamingId)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmRename()}
                disabled={Boolean(renamingId)}
                className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {renamingId ? <Loader2 size={14} className="animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        </ModalPortalOverlay>
      )}

      {pendingDeleteResume && (
        <ModalPortalOverlay
          className="flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={e => {
            e.stopPropagation();
            if (deletingId) return;
            setPendingDeleteResume(null);
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-full bg-red-50 text-red-500">
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900">Delete resume?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  You are deleting <span className="font-medium text-slate-700">{pendingDeleteResume.title}</span>. This action cannot be
                  undone.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteResume(null)}
                disabled={Boolean(deletingId)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteResume}
                disabled={Boolean(deletingId)}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deletingId ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete Resume
              </button>
            </div>
          </div>
        </ModalPortalOverlay>
      )}

      {duplicateToastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-white/10">
            {duplicateToastMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeDashboard;
