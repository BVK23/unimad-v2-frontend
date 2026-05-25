"use client";

import React, { useState } from "react";
import { updateApplication } from "@/features/application-tracker/server-actions/application-actions";
import type { ApplicationStatus, CreateApplicationInput } from "@/features/application-tracker/types";
import { importJobFromUrl } from "@/features/jobs/server-actions/jobs-actions";
import { useQueryClient } from "@tanstack/react-query";
import { X, Plus, Link as LinkIcon, FileText } from "lucide-react";
import JobUrlImportLoading from "./JobUrlImportLoading";

type AddMode = "url" | "manual";

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: CreateApplicationInput) => void;
  /** Status is set by the column under which the user clicked Add */
  initialStatus?: ApplicationStatus;
}

const AddApplicationModal: React.FC<AddApplicationModalProps> = ({ isOpen, onClose, onAdd, initialStatus = "draft" }) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AddMode>("url");
  const [jobUrl, setJobUrl] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [appliedDate, setAppliedDate] = useState<string>("");
  const [interviewDate, setInterviewDate] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetState = () => {
    setMode("url");
    setJobUrl("");
    setImportError(null);
    setIsImporting(false);
    setRole("");
    setCompany("");
    setJobDescription("");
    setAppliedDate("");
    setInterviewDate("");
    setErrors({});
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleImportFromUrl = async () => {
    const trimmed = jobUrl.trim();
    if (!trimmed) {
      setImportError("Paste a job posting URL to continue.");
      return;
    }
    setIsImporting(true);
    setImportError(null);
    try {
      const result = await importJobFromUrl(trimmed);
      const appId = result.application?.application_id;
      if (appId && initialStatus !== "draft") {
        await updateApplication(appId, {
          role: result.application.role,
          company: result.application.company,
          job_description: result.application.job_description ?? "",
          status: initialStatus,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      handleClose();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not import this job URL.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!role.trim()) err.role = "Role is required";
    if (!company.trim()) err.company = "Company is required";
    if (!jobDescription.trim() || jobDescription.trim().length < 10) {
      err.job_description = "Job description is required (at least 10 characters)";
    }
    setErrors(err);
    if (Object.keys(err).length > 0) return;

    onAdd({
      role: role.trim(),
      company: company.trim(),
      job_description: jobDescription.trim(),
      status: initialStatus,
      applied_date: appliedDate || null,
      interview_date: interviewDate || null,
    });
    resetState();
  };

  if (!isOpen) return null;

  const showLinkedInHint = /linkedin\.com/i.test(jobUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#1a1a1a]">
        <div className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Add Application</h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={isImporting}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-5 flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMode("url")}
              disabled={isImporting}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                mode === "url"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <LinkIcon size={16} /> From job URL
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              disabled={isImporting}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                mode === "manual"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <FileText size={16} /> Enter manually
            </button>
          </div>

          {mode === "url" ? (
            <div className="relative min-h-[12rem]">
              <div
                className={`space-y-4 transition-opacity ${isImporting ? "pointer-events-none opacity-0" : "opacity-100"}`}
                aria-hidden={isImporting}
              >
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Paste a public job posting link. We&apos;ll extract the role, company, and description for your tracker.
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
                    disabled={isImporting}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                {showLinkedInHint && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Use the public URL (<span className="font-medium">linkedin.com/jobs/view/...</span>), not a feed link.
                  </p>
                )}
                {importError && <p className="text-xs text-red-600 dark:text-red-400">{importError}</p>}
                <button
                  type="button"
                  onClick={handleImportFromUrl}
                  disabled={!jobUrl.trim() || isImporting}
                  className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Import and add
                </button>
              </div>
              {isImporting && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/95 dark:bg-slate-900/95">
                  <JobUrlImportLoading compact />
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Add role, company, and job description yourself when you don&apos;t have a posting link.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Data Analyst"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Google"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  {errors.company && <p className="mt-1 text-xs text-red-500">{errors.company}</p>}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Job description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste or type the job description here..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                {errors.job_description && <p className="mt-1 text-xs text-red-500">{errors.job_description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Applied date</label>
                  <input
                    type="date"
                    value={appliedDate}
                    onChange={e => setAppliedDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Interview date</label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={e => setInterviewDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-center border-t border-slate-200 pt-6 dark:border-slate-700">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-brand-700"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddApplicationModal;
