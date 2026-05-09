"use client";

import React, { useState, useEffect } from "react";
import type { ApplicationStatus, CreateApplicationInput } from "@/features/application-tracker/types";
import { X, Plus } from "lucide-react";

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: CreateApplicationInput) => void;
  /** Status is set by the column under which the user clicked Add – not shown in the form */
  initialStatus?: ApplicationStatus;
}

const AddApplicationModal: React.FC<AddApplicationModalProps> = ({ isOpen, onClose, onAdd, initialStatus = "draft" }) => {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [appliedDate, setAppliedDate] = useState<string>("");
  const [interviewDate, setInterviewDate] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetState = () => {
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

  const handleSubmit = (e: React.FormEvent) => {
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Add Application</h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Data Analyst"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Job description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste or type the job description here..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
              {errors.job_description && <p className="text-xs text-red-500 mt-1">{errors.job_description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Applied date</label>
                <input
                  type="date"
                  value={appliedDate}
                  onChange={e => setAppliedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Interview date</label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={e => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex justify-center pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddApplicationModal;
