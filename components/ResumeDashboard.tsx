import React, { useState } from "react";
import ResumeThumbnail from "@/components/resume/ResumeThumbnail";
import { useResumesList } from "@/features/resume/hooks/useResumesList";
import {
  duplicateResume,
  deleteResume,
  generateResume,
  setBaseResume,
  extractResumeToBaseResume,
} from "@/features/resume/server-actions/resume-actions";
import { ResumeData } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  Clock,
  MoreVertical,
  FilePlus,
  Upload,
  FileType,
  X,
  Edit,
  Copy,
  Trash2,
  Download,
  Link,
  ExternalLink,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface ResumeDashboardProps {
  onEditResume: (resume: ResumeData) => void;
  onCreateResume: (type: "scratch" | "jd" | "upload", resumeId?: string) => void;
}

const ResumeDashboard: React.FC<ResumeDashboardProps> = ({ onEditResume, onCreateResume }) => {
  const queryClient = useQueryClient();
  const { data: resumesList = [], isLoading, isError, error } = useResumesList();
  const resumes = Array.isArray(resumesList) ? resumesList : [];

  const [createModalState, setCreateModalState] = useState<"closed" | "menu" | "jd" | "upload">("closed");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteResume, setPendingDeleteResume] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [settingBaseId, setSettingBaseId] = useState<string | null>(null);
  const [baseStatusMessage, setBaseStatusMessage] = useState<string | null>(null);
  const [baseStatusType, setBaseStatusType] = useState<"success" | "error" | null>(null);

  // Form States
  const [jdCompany, setJdCompany] = useState("");
  const [jdRole, setJdRole] = useState("");
  const [jdText, setJdText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jdError, setJdError] = useState<string | null>(null);
  const [duplicateResumeId, setDuplicateResumeId] = useState<string | null>(null);
  const [isUploadingFromFile, setIsUploadingFromFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDuplicate = async (e: React.MouseEvent, resume: ResumeData) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setDuplicatingId(resume.id);
    try {
      const result = await duplicateResume(resume.id);
      if ("error" in result) {
        alert(result.error ?? "Failed to duplicate resume");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    } finally {
      setDuplicatingId(null);
    }
  };

  const resetUploadState = () => {
    setUploadFile(null);
    setUploadError(null);
    setIsUploadingFromFile(false);
  };

  const handleUploadFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError("File is too large. Please upload a PDF up to 5MB.");
      setUploadFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are supported right now.");
      setUploadFile(null);
      return;
    }

    setUploadError(null);
    setUploadFile(file);
  };

  const handleUploadExtract = async () => {
    if (!uploadFile) {
      return;
    }
    setUploadError(null);
    setIsUploadingFromFile(true);
    try {
      const formData = new FormData();
      formData.append("resume", uploadFile);
      const result = await extractResumeToBaseResume(formData);

      const resumeId = result.resume_id;
      if (!resumeId) {
        setUploadError(result.message ?? "No resume was returned. Please try again.");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      resetUploadState();
      setCreateModalState("closed");
      onCreateResume("upload", resumeId);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to process your resume. Please try again.");
    } finally {
      setIsUploadingFromFile(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(null);
    const resumeToDelete = resumes.find(resume => resume.id === id);
    if (!resumeToDelete) return;
    setPendingDeleteResume({ id, title: resumeToDelete.title });
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

  const handleCopyLink = (e: React.MouseEvent, resume: ResumeData) => {
    e.stopPropagation();
    const identifier = resume.slug ?? resume.id;
    navigator.clipboard.writeText(`https://unimad.dev/resume/${identifier}`);
    alert("Link copied to clipboard!");
    setActiveMenuId(null);
  };

  const handleSetBaseResume = async (e: React.MouseEvent, resume: ResumeData) => {
    e.stopPropagation();
    if (resume.isBase) return;
    setBaseStatusMessage(null);
    setBaseStatusType(null);
    setActiveMenuId(null);
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

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert("Downloading PDF...");
    setActiveMenuId(null);
  };

  const handleCreateTargetedResume = async () => {
    setJdError(null);
    setIsGenerating(true);
    try {
      const result = await generateResume({
        company: jdCompany.trim(),
        role: jdRole.trim(),
        jd: jdText.trim(),
      });
      if ("error" in result) {
        setJdError(result.error.message ?? "A resume for this application already exists.");
        setDuplicateResumeId(result.error.resume_id ?? null);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setCreateModalState("closed");
      setJdCompany("");
      setJdRole("");
      setJdText("");
      setJdError(null);
      setDuplicateResumeId(null);
      onCreateResume("jd", result.id);
    } catch (err) {
      setJdError(err instanceof Error ? err.message : "Failed to generate resume. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 h-full overflow-y-auto p-8 relative scrollbar-on-hover" onClick={() => setActiveMenuId(null)}>
      <div className="max-w-6xl mx-auto">
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

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Create New Card (Visual Shortcut) */}
          <button
            onClick={e => {
              e.stopPropagation();
              setCreateModalState("menu");
            }}
            className="group flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-xl hover:border-brand-400 hover:bg-brand-50/50 transition-all cursor-pointer bg-white"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600 mb-3 transition-colors">
              <Plus size={24} />
            </div>
            <span className="font-medium text-slate-600 group-hover:text-brand-600">New Resume</span>
          </button>

          {isLoading && (
            <div className="flex items-center justify-center h-64 col-span-2 text-slate-500">
              <Loader2 size={28} className="animate-spin" />
            </div>
          )}

          {/* Resume Cards */}
          {!isLoading &&
            resumes.map(resume => (
              <div
                key={resume.id}
                onClick={() => onEditResume(resume)}
                className={`
                        bg-white rounded-xl shadow-sm hover:shadow-md border cursor-pointer transition-all hover:-translate-y-1 group relative
                        ${activeMenuId === resume.id ? "z-30 ring-2 ring-brand-100" : "z-0"}
                        ${resume.isBase ? "border-brand-300 ring-1 ring-brand-100" : "border-slate-200"}
                    `}
              >
                {/* Preview (base badge renders inside ResumeThumbnail above scaled preview + hover layers) */}
                <ResumeThumbnail resume={resume} />

                {/* Info */}
                <div className="p-4 rounded-b-xl relative">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-medium text-slate-900 mb-1 truncate">{resume.title}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Clock size={12} />
                        <span>Edited {resume.lastModified.toLocaleDateString("en-US")}</span>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        className={`p-1 rounded transition-colors ${activeMenuId === resume.id ? "bg-slate-100 text-slate-900" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                        onClick={e => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === resume.id ? null : resume.id);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === resume.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onEditResume(resume);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors"
                          >
                            <Edit size={14} /> Edit
                          </button>
                          {!resume.isBase && (
                            <button
                              onClick={e => handleSetBaseResume(e, resume)}
                              disabled={settingBaseId === resume.id}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {settingBaseId === resume.id ? <Loader2 size={14} className="animate-spin" /> : null}{" "}
                              {settingBaseId === resume.id ? "Setting…" : "Set as Base Resume"}
                            </button>
                          )}
                          <button
                            onClick={e => handleDuplicate(e, resume)}
                            disabled={duplicatingId === resume.id}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {duplicatingId === resume.id ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />} Duplicate
                          </button>
                          <button
                            onClick={e => handleCopyLink(e, resume)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors"
                          >
                            <Link size={14} /> Copy Link
                          </button>
                          <button
                            onClick={handleDownload}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors"
                          >
                            <Download size={14} /> Download
                          </button>
                          <div className="h-px bg-slate-100 my-1 mx-2"></div>
                          <button
                            onClick={e => handleDelete(e, resume.id)}
                            disabled={deletingId === resume.id}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === resume.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Create Modal */}
      {createModalState !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 relative">
              <div className="flex items-center gap-3">
                {createModalState !== "menu" && (
                  <button
                    onClick={() => setCreateModalState("menu")}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <h2 className="text-xl font-normal text-slate-900">
                  {createModalState === "menu" && "Create New Resume"}
                  {createModalState === "jd" && "Target Job Description"}
                  {createModalState === "upload" && "Upload Existing Resume"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setCreateModalState("closed");
                  setJdError(null);
                  setDuplicateResumeId(null);
                  resetUploadState();
                }}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-8 max-h-[60vh] overflow-y-auto">
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

                  <button
                    onClick={() => {
                      setJdError(null);
                      setDuplicateResumeId(null);
                      setCreateModalState("jd");
                    }}
                    className="flex flex-col items-center text-center p-6 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all group"
                  >
                    <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileType size={24} />
                    </div>
                    <h3 className="font-medium text-slate-900 mb-2">Target Job Description</h3>
                    <p className="text-xs text-slate-500">Paste a JD and let AI tailor a resume for you.</p>
                  </button>

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
                    <p className="text-xs text-slate-500">Upload a PDF to extract into your base resume and edit.</p>
                  </button>
                </div>
              )}

              {/* 2. TARGET JD FORM */}
              {createModalState === "jd" && (
                <div className="space-y-4 max-w-lg mx-auto relative">
                  {isGenerating && (
                    <div
                      className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg"
                      aria-busy="true"
                      aria-label="Generating resume"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-brand-600" />
                        <span className="text-sm text-slate-600">Generating your tailored resume…</span>
                      </div>
                    </div>
                  )}
                  {jdError && (
                    <div className="space-y-2">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{jdError}</span>
                      </div>
                      {duplicateResumeId && (
                        <button
                          type="button"
                          onClick={() => {
                            setCreateModalState("closed");
                            setJdError(null);
                            setDuplicateResumeId(null);
                            setJdCompany("");
                            setJdRole("");
                            setJdText("");
                            onCreateResume("jd", duplicateResumeId);
                          }}
                          className="w-full py-2 text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                        >
                          Open existing resume
                        </button>
                      )}
                    </div>
                  )}
                  <div>
                    <label htmlFor="jd-company" className="block text-sm font-medium text-slate-700 mb-1">
                      Company Name
                    </label>
                    <input
                      id="jd-company"
                      value={jdCompany}
                      onChange={e => setJdCompany(e.target.value)}
                      placeholder="e.g. Google, Airbnb"
                      disabled={isGenerating}
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label htmlFor="jd-role" className="block text-sm font-medium text-slate-700 mb-1">
                      Job Role / Title
                    </label>
                    <input
                      id="jd-role"
                      value={jdRole}
                      onChange={e => setJdRole(e.target.value)}
                      placeholder="e.g. Senior Frontend Developer"
                      disabled={isGenerating}
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label htmlFor="jd-text" className="block text-sm font-medium text-slate-700 mb-1">
                      Job Description or URL
                    </label>
                    <textarea
                      id="jd-text"
                      value={jdText}
                      onChange={e => setJdText(e.target.value)}
                      placeholder="Paste the job description or hiring page link here..."
                      rows={6}
                      disabled={isGenerating}
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <button
                    disabled={!jdCompany.trim() || !jdRole.trim() || !jdText.trim() || isGenerating}
                    onClick={handleCreateTargetedResume}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Generating…
                      </>
                    ) : (
                      "Create Targeted Resume"
                    )}
                  </button>
                </div>
              )}

              {/* 3. UPLOAD FORM (base resume PDF extraction) */}
              {createModalState === "upload" && (
                <div className="max-w-lg mx-auto space-y-6">
                  {uploadError && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Upload a PDF to extract content into your base resume. We will create or update your base resume and open it in the
                      editor.
                    </p>
                    <label className="block text-sm font-medium text-slate-700">Upload your existing resume (PDF)</label>
                    <label className="border-2 border-dashed border-slate-300 hover:border-brand-400 bg-slate-50 hover:bg-brand-50/30 rounded-xl p-8 text-center transition-all cursor-pointer group block">
                      <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform text-brand-500">
                        <Upload size={28} />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-1">Click to upload</h3>
                      <p className="text-sm text-slate-500 mb-1">or drag and drop your resume file here</p>
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">PDF only · Max 5MB</p>
                      <input type="file" accept=".pdf" className="hidden" onChange={handleUploadFileChange} />
                    </label>

                    {uploadFile && (
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-brand-500" />
                          <span className="truncate max-w-[220px]">{uploadFile.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadFile(null);
                          }}
                          className="text-xs text-slate-500 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    <button
                      onClick={handleUploadExtract}
                      disabled={!uploadFile || isUploadingFromFile}
                      className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isUploadingFromFile ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Extracting into base resume…
                        </>
                      ) : (
                        "Extract & Open Base Resume"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 text-center text-xs text-slate-400 border-t border-slate-100">
              Unimad AI helps you beat the ATS and get hired faster.
            </div>
          </div>
        </div>
      )}

      {pendingDeleteResume && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
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
        </div>
      )}
    </div>
  );
};

export default ResumeDashboard;
