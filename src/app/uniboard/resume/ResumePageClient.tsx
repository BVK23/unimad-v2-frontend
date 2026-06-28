"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import ResumeDashboard from "@/components/ResumeDashboard";
import ResumeEditor from "@/components/ResumeEditor";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { RESUME_OPEN_FULL_IMPROVE_EVENT } from "@/features/resume/api/resume-full-improve-presets";
import { useResume, resumeByIdQueryKey } from "@/features/resume/hooks/useResume";
import { useResumeUrlActions, useResumeUrlState } from "@/features/resume/hooks/useResumeUrlState";
import { resumesListQueryKey } from "@/features/resume/hooks/useResumesList";
import { getPrepareReturnSession } from "@/lib/jobs/prepare-application-return";
import { parseResumePrepareSearchParams } from "@/lib/jobs/prepare-application-url";
import type { ResumeData } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

const NEW_RESUME_TEMPLATE: ResumeData = {
  id: "",
  title: "Untitled Resume",
  lastModified: new Date(),
  templateId: "modern",
  profile: {
    fullName: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    summary: "",
    title: "",
    linkedin: "",
    github: "",
    portfolio: "",
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  customSections: [],
  sectionOrder: [
    { id: "profile" },
    { id: "experience" },
    { id: "education" },
    { id: "skills" },
    { id: "projects" },
    { id: "certifications" },
  ],
};

const getFriendlyResumeLoadError = (err: unknown) => {
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  if (message.includes("not found") || message.includes("no resume matches")) {
    return "Unable to find resume.";
  }
  return "Unable to load resume right now. Please try again.";
};

type ResumePageClientProps = {
  initialResumeId?: string;
  initialIsNewDraft?: boolean;
};

function ResumeEditorById({
  resumeId,
  onBack,
  onImprove,
  showTemplateModal,
  setShowTemplateModal,
  onFirstSaveId,
}: {
  resumeId: string;
  onBack: () => void;
  onImprove: (text: string) => void;
  showTemplateModal: boolean;
  setShowTemplateModal: (open: boolean) => void;
  onFirstSaveId?: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const resumeQuery = useResume(resumeId);

  const listItem = queryClient.getQueryData<ResumeData[]>(resumesListQueryKey)?.find(resume => String(resume.id) === String(resumeId));

  const editorData: ResumeData | null = resumeQuery.data
    ? { ...resumeQuery.data, id: resumeId }
    : listItem
      ? { ...listItem, id: resumeId }
      : null;

  const isLoading = !editorData && !resumeQuery.isError && (resumeQuery.isLoading || resumeQuery.isFetching);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center" aria-busy="true" aria-label="Loading resume">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-brand-600" />
          <span className="text-sm text-slate-600">Loading your resume…</span>
        </div>
      </div>
    );
  }

  if (!editorData) return null;

  return (
    <ResumeEditor
      resumeId={resumeId}
      initialData={editorData}
      onBack={onBack}
      onSave={data => {
        if (data.id && data.id !== resumeId) {
          onFirstSaveId?.(String(data.id));
        }
      }}
      onImprove={onImprove}
      showTemplateModal={showTemplateModal}
      setShowTemplateModal={setShowTemplateModal}
    />
  );
}

function ResumePageContent({ initialResumeId, initialIsNewDraft = false }: ResumePageClientProps) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const improveDispatchedRef = useRef(false);
  const { resumeId, isNewDraft } = useResumeUrlState({
    resumeId: initialResumeId,
    isNewDraft: initialIsNewDraft,
  });
  const { openResume, openNewDraft, openLanding } = useResumeUrlActions(pathname);
  const resumeQuery = useResume(resumeId);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [resumeLoadError, setResumeLoadError] = useState<string | null>(null);

  const showLanding = !resumeId && !isNewDraft;
  const showNewDraftEditor = isNewDraft && !resumeId;
  const showExistingEditor = Boolean(resumeId);

  /* eslint-disable react-hooks/set-state-in-effect -- clear bad ?id= and surface error on list */
  useEffect(() => {
    if (!resumeId || !resumeQuery.isError || !resumeQuery.error) return;
    setResumeLoadError(getFriendlyResumeLoadError(resumeQuery.error));
    openLanding();
  }, [resumeId, resumeQuery.isError, resumeQuery.error, openLanding]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const parsed = parseResumePrepareSearchParams(searchParams);
    if (!parsed.improve || !parsed.resumeId) {
      improveDispatchedRef.current = false;
      return;
    }
    if (improveDispatchedRef.current) return;
    improveDispatchedRef.current = true;

    const stored = getPrepareReturnSession();
    window.dispatchEvent(
      new CustomEvent(RESUME_OPEN_FULL_IMPROVE_EVENT, {
        detail: {
          resumeId: parsed.resumeId,
          role: stored?.role ?? "",
          company: stored?.company ?? "",
          fromPrepareApplication: true,
        },
      })
    );
  }, [searchParams, resumeId]);

  const handleEditResume = (resume: ResumeData) => {
    if (!resume.id) return;
    queryClient.setQueryData(resumeByIdQueryKey(String(resume.id)), resume);
    setResumeLoadError(null);
    openResume(String(resume.id));
  };

  const openResumeById = async (nextResumeId: string) => {
    setResumeLoadError(null);
    const list = queryClient.getQueryData<ResumeData[]>(resumesListQueryKey);
    const cached = list?.find(r => String(r.id) === String(nextResumeId));
    if (cached) {
      queryClient.setQueryData(resumeByIdQueryKey(String(nextResumeId)), cached);
    }
    openResume(nextResumeId);
  };

  const handleCreateResume = async (type: "scratch" | "jd" | "upload", createdResumeId?: string) => {
    if ((type === "jd" || type === "upload") && createdResumeId) {
      await queryClient.refetchQueries({ queryKey: resumesListQueryKey, exact: true });
      await openResumeById(String(createdResumeId));
      return;
    }
    setResumeLoadError(null);
    openNewDraft();
  };

  const handleBackToLanding = () => {
    void queryClient.refetchQueries({ queryKey: resumesListQueryKey, exact: true });
    openLanding();
  };

  const handleImproveWithAI = (text: string) => {
    window.dispatchEvent(
      new CustomEvent("open-unibot", {
        detail: { type: "improve", text, requestKey: Date.now() },
      })
    );
  };

  const resumeLoadErrorModal = resumeLoadError ? (
    <ModalPortalOverlay
      className="flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-labelledby="resume-load-error-title"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
        <h2 id="resume-load-error-title" className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Unable to open resume
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{resumeLoadError}</p>
        <button
          type="button"
          onClick={() => setResumeLoadError(null)}
          className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Got it
        </button>
      </div>
    </ModalPortalOverlay>
  ) : null;

  let content: ReactNode = null;

  if (showLanding) {
    content = (
      <div className="relative flex flex-col h-full">
        <ResumeDashboard onEditResume={handleEditResume} onCreateResume={handleCreateResume} />
        {resumeLoadErrorModal}
      </div>
    );
  } else if (showNewDraftEditor) {
    content = (
      <ResumeEditor
        resumeId=""
        initialData={{ ...NEW_RESUME_TEMPLATE, id: "", title: "New Resume" }}
        onBack={handleBackToLanding}
        onSave={data => {
          if (data.id) {
            queryClient.setQueryData(resumeByIdQueryKey(String(data.id)), data);
            openResume(String(data.id));
          }
        }}
        onImprove={handleImproveWithAI}
        showTemplateModal={showTemplateModal}
        setShowTemplateModal={setShowTemplateModal}
      />
    );
  } else if (showExistingEditor && resumeId) {
    content = (
      <ResumeEditorById
        resumeId={resumeId}
        onBack={handleBackToLanding}
        onImprove={handleImproveWithAI}
        showTemplateModal={showTemplateModal}
        setShowTemplateModal={setShowTemplateModal}
        onFirstSaveId={openResume}
      />
    );
  }

  return content;
}

export default function ResumePageClient({ initialResumeId, initialIsNewDraft }: ResumePageClientProps) {
  return <ResumePageContent initialResumeId={initialResumeId} initialIsNewDraft={initialIsNewDraft} />;
}
