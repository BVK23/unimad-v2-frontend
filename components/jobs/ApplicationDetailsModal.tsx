"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { applicationHasAnyLinkedAsset, parseApplicationAssets } from "@/features/application-tracker/application-assets";
import type { Application, ApplicationStatus, UpdateApplicationInput } from "@/features/application-tracker/types";
import { MODAL_OVERLAY_Z_CLASS } from "@/lib/ui/modal-overlay";
import { formatRelativeTimeFromNow } from "@/utils/format-relative-time";
import { X, FileText, ExternalLink, Pencil, ChevronDown, CheckCircle2 } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offered", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

const statusColors: Record<ApplicationStatus, string> = {
  draft: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  applied: "bg-slate-500 text-white",
  interviewing: "bg-blue-500 text-white",
  offered: "bg-green-500 text-white",
  rejected: "bg-red-500 text-white",
};

interface ApplicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "view" | "edit";
  setMode: (m: "view" | "edit") => void;
  application: Application | null;
  onUpdate: (applicationId: string, data: UpdateApplicationInput) => Promise<void>;
  onStatusChange: (applicationId: string, status: ApplicationStatus) => Promise<void>;
  onPrepare: (application: Application) => void;
}

const ApplicationDetailsModal: React.FC<ApplicationDetailsModalProps> = ({
  isOpen,
  onClose,
  mode,
  setMode,
  application,
  onUpdate,
  onStatusChange,
  onPrepare,
}) => {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("draft");
  const [appliedDate, setAppliedDate] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (application) {
      setRole(application.role);
      setCompany(application.company);
      setJobDescription(application.job_description ?? "");
      setStatus(application.status);
      setAppliedDate(application.applied_date ?? "");
      setInterviewDate(application.interview_date ?? "");
    }
  }, [application]);

  if (!isOpen || !application) return null;

  const hasPreparedApplication = applicationHasAnyLinkedAsset(parseApplicationAssets(application.assets));
  const isManualEntry = !application.job_id;
  const currentStatusLabel = STATUS_OPTIONS.find(o => o.value === application.status)?.label ?? application.status;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(application.application_id, {
        role,
        company,
        job_description: jobDescription,
        status,
        applied_date: appliedDate || null,
        interview_date: interviewDate || null,
      });
      setMode("view");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusSelect = async (next: ApplicationStatus) => {
    if (next === application.status) {
      setIsStatusDropdownOpen(false);
      return;
    }
    setStatusUpdating(true);
    try {
      await onStatusChange(application.application_id, next);
      setStatus(next);
      setIsStatusDropdownOpen(false);
    } finally {
      setStatusUpdating(false);
    }
  };

  const dateLabel = application.applied_date
    ? application.applied_date
    : formatRelativeTimeFromNow(application.posted_at ?? application.created_at, "");
  const hasLocationOrDate = Boolean(application.location?.trim() || (dateLabel && dateLabel !== ""));
  const applyUrl = application.apply_url;

  if (mode === "edit") {
    if (typeof document === "undefined") return null;

    return createPortal(
      <div
        className={`fixed inset-0 ${MODAL_OVERLAY_Z_CLASS} flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200`}
      >
        <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#1a1a1a]">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Edit application</h2>
            <button
              type="button"
              onClick={() => setMode("view")}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Role</label>
                <input
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Company</label>
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Job description</label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                      status === opt.value ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Applied date</label>
                <input
                  type="date"
                  value={appliedDate}
                  onChange={e => setAppliedDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Interview date</label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={e => setInterviewDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 p-6 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMode("view")}
              className="rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${MODAL_OVERLAY_Z_CLASS} flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200`}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#1a1a1a] animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex gap-4">
            <CompanyLogo logoUrl={application.company_logo_url} company={application.company} size="md" className="shadow-sm" />
            <div>
              <h2 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-white">{application.role}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">{application.company}</span>
                {hasLocationOrDate && (
                  <>
                    {application.location?.trim() && (
                      <>
                        <span>•</span>
                        <span>{application.location}</span>
                      </>
                    )}
                    {dateLabel && (
                      <>
                        <span>•</span>
                        <span>{dateLabel}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative z-50">
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-opacity disabled:opacity-60 ${statusColors[application.status]}`}
              >
                {currentStatusLabel} <ChevronDown size={14} />
              </button>
              {isStatusDropdownOpen && (
                <>
                  <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
                    {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleStatusSelect(opt.value)}
                        className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                          application.status === opt.value
                            ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} aria-hidden />
                </>
              )}
            </div>
            {isManualEntry && (
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
                title="Edit application"
              >
                <Pencil size={20} />
              </button>
            )}
            <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-slate-200 dark:hover:bg-slate-800">
              <X size={24} className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto p-8">
          <section>
            <h3 className="mb-3 text-lg font-medium text-slate-900 dark:text-white">About the Role</h3>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-slate-300">{application.job_description || "—"}</p>
          </section>

          {application.requirements && application.requirements.length > 0 && (
            <section>
              <h3 className="mb-3 text-lg font-medium text-slate-900 dark:text-white">Requirements</h3>
              <ul className="space-y-2">
                {application.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-500" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-[#1a1a1a]">
          <button
            onClick={() => onPrepare(application)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 font-medium text-slate-900 shadow-sm transition-all active:scale-95 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            <FileText size={18} className="text-brand-500" /> {hasPreparedApplication ? "Continue Application" : "Prepare Application"}
          </button>
          <button
            type="button"
            onClick={() => applyUrl && window.open(applyUrl, "_blank")}
            disabled={!applyUrl}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-medium text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            Apply Now <ExternalLink size={18} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ApplicationDetailsModal;
