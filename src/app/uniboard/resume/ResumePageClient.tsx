"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import ResumeDashboard from "@/components/ResumeDashboard";
import ResumeEditor from "@/components/ResumeEditor";
import { useResume, resumeByIdQueryKey } from "@/features/resume/hooks/useResume";
import { resumesListQueryKey } from "@/features/resume/hooks/useResumesList";
import { getResumeContentSignature } from "@/features/resume/utils/getResumeContentSignature";
import type { ResumeData } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
};

/** Reads URL search params without suspending the resume list/editor shell. */
function ResumeUrlSync({ onUrlIdChange }: { onUrlIdChange: (id: string | undefined) => void }) {
  const searchParams = useSearchParams();
  const urlId = searchParams.get("id")?.trim() || undefined;

  useEffect(() => {
    onUrlIdChange(urlId);
  }, [urlId, onUrlIdChange]);

  return null;
}

function ResumePageContent({ initialResumeId }: ResumePageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [urlId, setUrlId] = useState<string | undefined>(initialResumeId);
  const resumeQuery = useResume(urlId);

  const [resumeView, setResumeView] = useState<"list" | "editor">("list");
  const [currentResume, setCurrentResume] = useState<ResumeData | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [resumeLoadError, setResumeLoadError] = useState<string | null>(null);

  const handleUrlIdFromBrowser = useCallback((nextId: string | undefined) => {
    if (!nextId) {
      const fromWindow = new URLSearchParams(window.location.search).get("id")?.trim() || undefined;
      if (fromWindow) {
        setUrlId(fromWindow);
        return;
      }
    }
    setUrlId(nextId);
  }, []);

  const updateResumeUrl = useCallback(
    (id?: string) => {
      setUrlId(id);
      const params = new URLSearchParams(window.location.search);
      if (id) {
        params.set("id", id);
      } else {
        params.delete("id");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  // No ?id=: show list and clear URL-driven state, but keep local-only editor (new resume, not saved yet)
  /* eslint-disable react-hooks/set-state-in-effect -- URL-driven view sync; list vs editor follows search params */
  useEffect(() => {
    if (urlId) return;

    const isLocalOnlyEditor = resumeView === "editor" && currentResume !== null && !String(currentResume.id || "").trim();
    const isActiveEditor = resumeView === "editor" && currentResume !== null;

    if (isLocalOnlyEditor || isActiveEditor) return;

    setResumeView("list");
    setCurrentResume(null);
  }, [urlId, resumeView, currentResume]);

  // URL ?id= resolved successfully → open editor from cache or network
  useEffect(() => {
    if (!urlId || !resumeQuery.isSuccess || !resumeQuery.data) return;

    const nextResume: ResumeData = {
      ...resumeQuery.data,
      id: urlId,
    };

    setCurrentResume(prev => {
      if (!prev) return nextResume;
      if (prev.id !== nextResume.id) return nextResume;
      if (getResumeContentSignature(prev) === getResumeContentSignature(nextResume)) return prev;
      return nextResume;
    });
    setResumeView("editor");
    setResumeLoadError(null);
  }, [urlId, resumeQuery.isSuccess, resumeQuery.data, resumeQuery.dataUpdatedAt]);

  // URL ?id= failed → message + strip bad id from URL
  useEffect(() => {
    if (!urlId || !resumeQuery.isError || !resumeQuery.error) return;

    setResumeLoadError(getFriendlyResumeLoadError(resumeQuery.error));
    updateResumeUrl();
  }, [urlId, resumeQuery.isError, resumeQuery.error, updateResumeUrl]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleEditResume = (resume: ResumeData) => {
    if (resume.id) {
      queryClient.setQueryData(resumeByIdQueryKey(String(resume.id)), resume);
    }
    setCurrentResume(resume);
    setResumeView("editor");
    if (resume.id) {
      updateResumeUrl(String(resume.id));
    }
  };

  const handleCreateResume = async (type: "scratch" | "jd" | "upload", resumeId?: string) => {
    if ((type === "jd" || type === "upload") && resumeId) {
      setResumeLoadError(null);
      await queryClient.refetchQueries({ queryKey: resumesListQueryKey, exact: true });
      updateResumeUrl(String(resumeId));
      return;
    }
    const newResume: ResumeData = {
      ...NEW_RESUME_TEMPLATE,
      id: "",
      title: "New Resume",
    };
    setCurrentResume(newResume);
    setResumeView("editor");
    setShowOnboardingModal(true);
  };

  /** Keeps editor open; only syncs parent state when resume identity changes (e.g., first create). */
  const handleSaveResume = (data: ResumeData) => {
    const currentResumeId = currentResume?.id ?? "";
    const nextResumeId = data.id ?? "";
    const isExistingResumeSave = currentResumeId !== "" && currentResumeId === nextResumeId;

    if (!isExistingResumeSave) {
      setCurrentResume(data);
    }

    if (data.id && urlId !== String(data.id)) {
      updateResumeUrl(String(data.id));
    }
  };

  const handleImproveWithAI = (text: string) => {
    window.dispatchEvent(
      new CustomEvent("open-unibot", {
        detail: { type: "improve", text, requestKey: Date.now() },
      })
    );
  };

  const urlIdLoading = Boolean(urlId && resumeView === "list" && !resumeQuery.isSuccess && !resumeQuery.isError);

  const showListLoader = urlIdLoading;

  const urlSync = (
    <Suspense fallback={null}>
      <ResumeUrlSync onUrlIdChange={handleUrlIdFromBrowser} />
    </Suspense>
  );

  if (resumeView === "list") {
    return (
      <div className="relative flex flex-col h-full">
        {urlSync}
        {showListLoader && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50/90"
            aria-busy="true"
            aria-label="Loading resume"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-brand-600" />
              <span className="text-sm text-slate-600">Loading your resume…</span>
            </div>
          </div>
        )}
        <ResumeDashboard onEditResume={handleEditResume} onCreateResume={handleCreateResume} />
        {resumeLoadError && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
          </div>
        )}
      </div>
    );
  }

  if (currentResume) {
    return (
      <>
        {urlSync}
        <ResumeEditor
          resumeId={currentResume.id}
          initialData={currentResume}
          onBack={() => {
            void queryClient.refetchQueries({ queryKey: resumesListQueryKey, exact: true });
            setResumeView("list");
            setCurrentResume(null);
            updateResumeUrl();
          }}
          onSave={handleSaveResume}
          onImprove={handleImproveWithAI}
          showTemplateModal={showTemplateModal}
          setShowTemplateModal={setShowTemplateModal}
        />
      </>
    );
  }

  return resumeLoadError ? (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
    </div>
  ) : null;
}

export default function ResumePageClient({ initialResumeId }: ResumePageClientProps) {
  return <ResumePageContent initialResumeId={initialResumeId} />;
}
