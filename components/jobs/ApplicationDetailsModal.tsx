"use client";

import React, { useState, useEffect } from "react";
import type { Application, ApplicationStatus, UpdateApplicationInput } from "@/features/application-tracker/types";
import { X, FileText, ExternalLink, Pencil } from "lucide-react";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offered", label: "Offered" },
  { value: "rejected", label: "Rejected" },
];

interface ApplicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "view" | "edit";
  setMode: (m: "view" | "edit") => void;
  application: Application | null;
  onUpdate: (applicationId: string, data: UpdateApplicationInput) => Promise<void>;
  onPrepare: (application: Application) => void;
}

const ApplicationDetailsModal: React.FC<ApplicationDetailsModalProps> = ({
  isOpen,
  onClose,
  mode,
  setMode,
  application,
  onUpdate,
  onPrepare,
}) => {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("draft");
  const [appliedDate, setAppliedDate] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [saving, setSaving] = useState(false);

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

  const hasLocationOrDate = Boolean(application.location || application.applied_date);
  const applyUrl = application.apply_url;

  if (mode === "edit") {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Edit application</h2>
            <button
              type="button"
              onClick={() => setMode("view")}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Role</label>
                <input
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Company</label>
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Job description</label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      status === opt.value ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Applied date</label>
                <input
                  type="date"
                  value={appliedDate}
                  onChange={e => setAppliedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Interview date</label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={e => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMode("view")}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header – Role, Company, Location, Application date (hide when no data) */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-3 shadow-sm overflow-hidden">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">{application.company?.charAt(0)?.toUpperCase() || "?"}</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">{application.role}</h2>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="font-medium text-slate-700 dark:text-slate-300">{application.company}</span>
                {hasLocationOrDate && (
                  <>
                    <span>•</span>
                    {application.location && <span className="flex items-center gap-1">{application.location}</span>}
                    {application.location && application.applied_date && <span>•</span>}
                    {application.applied_date && <span>{application.applied_date}</span>}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
              title="Edit"
            >
              <Pencil size={20} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={24} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content – tags (commented out), About the Role, Requirements (commented out) */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Match %, Visa, Salary – commented out for now, restore when backend supports */}
          {/* {matchScore >= 90 && (
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                {matchScore}% Match
              </span>
              {isSponsoring && (
                <span className="px-3 py-1 bg-gradient-to-b from-amber-200 to-yellow-400 text-yellow-900 text-xs font-semibold rounded-full border border-yellow-300">
                  Visa Sponsorship
                </span>
              )}
              {salaryRange && (
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full">
                  {salaryRange}
                </span>
              )}
            </div>
          )} */}

          <section>
            <h3 className="font-medium text-lg text-slate-900 dark:text-white mb-3">About the Role</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{application.job_description || "—"}</p>
          </section>

          {/* Requirements – commented out for future use when we have structured requirements */}
          {/* <section>
            <h3 className="font-medium text-lg text-slate-900 dark:text-white mb-3">Requirements</h3>
            <ul className="space-y-2">
              {(application.requirements || []).map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </section> */}
        </div>

        {/* Footer – Prepare Application + Apply Now (disabled when no apply link) */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1a1a1a] flex items-center gap-4">
          <button
            onClick={() => onPrepare(application)}
            className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
          >
            <FileText size={18} className="text-blue-500" /> Prepare Application
          </button>
          <button
            onClick={() => applyUrl && window.open(applyUrl, "_blank")}
            disabled={!applyUrl}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:shadow-none"
          >
            Apply Now <ExternalLink size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailsModal;
