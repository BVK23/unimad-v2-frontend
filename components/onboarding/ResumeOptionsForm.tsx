"use client";

import React, { useRef, useState } from "react";
import { useOnboardingStore } from "@/features/onboarding/store/useOnboardingStore";
import { useOnboardingUIStore } from "@/features/onboarding/store/useOnboardingUIStore";
import type { OnboardingProfileSummary } from "@/features/onboarding/utils/profileSummary";
import { extractResume } from "@/lib/actions/onboardingActions";
import { AlertTriangle, FileText, Trash2, UploadCloud, X } from "lucide-react";
import FormShell from "./shared/FormShell";
import Heading from "./shared/Heading";
import PrimaryButton from "./shared/PrimaryButton";
import { useShowToast } from "./shared/Toast";

type ResumeOptionsFormProps = {
  profileSummary: OnboardingProfileSummary;
  onManualEntry: () => void;
  /** Called with extracted section step names (e.g. educations, skills) from resume upload. */
  onUploadComplete: (extractedSections: string[]) => void;
};

const MAX_BYTES = 25 * 1024 * 1024;

const validateFile = (file: File | null | undefined): string | null => {
  if (!file) return "Invalid file input.";
  if (file.size > MAX_BYTES) return "File size must be less than 25MB";
  if (file.type !== "application/pdf") return "Only PDF files are allowed";
  return null;
};

const hasAnySavedProfile = (summary: OnboardingProfileSummary) =>
  summary.hasEducation || summary.hasExperience || summary.hasProjects || summary.hasSkills;

export default function ResumeOptionsForm({ profileSummary, onManualEntry, onUploadComplete }: ResumeOptionsFormProps) {
  const setLoading = useOnboardingUIStore(s => s.setLoadingMessage);
  const setUserOnboardingData = useOnboardingStore(s => s.setUserOnboardingData);
  const toast = useShowToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const savedProfileExists = hasAnySavedProfile(profileSummary);

  const setIfValid = (next: File | undefined | null) => {
    const message = validateFile(next ?? null);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    if (next) setFile(next);
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = e => {
    e.preventDefault();
    setIsDragging(false);
    setIfValid(e.dataTransfer.files?.[0]);
  };

  const runUpload = async () => {
    if (!file) return;
    try {
      setLoading("Extracting data from your resume…");
      const formData = new FormData();
      formData.append("resume", file);
      const response = await extractResume(formData);

      if (response?.status === "success" && response?.extracted_data) {
        const extracted = response.extracted_data;
        setUserOnboardingData({
          skills: extracted.skills ?? [],
          educations: extracted.educations ?? [],
          experiences: extracted.experiences ?? [],
          projects: extracted.projects ?? [],
        });
        toast.success(response.message ?? "Extraction successful");
      } else {
        toast.error(response?.message ?? "Extraction failed");
      }

      setIsOpen(false);
      setShowOverwriteConfirm(false);
      setFile(null);
      onUploadComplete(Array.isArray(response?.extracted_sections) ? response.extracted_sections : []);
    } catch (err) {
      console.error("Error extracting resume", err);
      toast.error("Resume extraction failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    if (savedProfileExists && !showOverwriteConfirm) {
      setShowOverwriteConfirm(true);
      return;
    }
    await runUpload();
  };

  return (
    <FormShell width="wide">
      <Heading subtitle="Simply upload your resume or answer a few questions.">Personalise your experience</Heading>

      {savedProfileExists ? (
        <div className="mt-4 w-full rounded-[12px] border border-[#D6E4FF] bg-[#F0F6FE] px-4 py-3 text-sm text-[#4A5568]">
          <p className="font-medium text-[#0C0F1A]">You already have profile details saved</p>
          <ul className="mt-2 space-y-1">
            {profileSummary.hasEducation ? <li>Education ({profileSummary.educationCount})</li> : null}
            {profileSummary.hasExperience ? <li>Experience ({profileSummary.experienceCount})</li> : null}
            {profileSummary.hasProjects ? <li>Projects ({profileSummary.projectCount})</li> : null}
            {profileSummary.hasSkills ? <li>Skills ({profileSummary.skillCount})</li> : null}
          </ul>
          <p className="mt-2">
            <span className="font-medium text-[#0C0F1A]">Answer a few questions</span> lets you review and edit what you have saved.
            <span className="font-medium text-[#0C0F1A]"> Uploading a new resume</span> will replace education, experience, projects, and
            skills.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row gap-3 items-center justify-center mt-3">
        <PrimaryButton onClick={() => setIsOpen(true)}>Upload Resume</PrimaryButton>
        <span className="text-[#8896A8] text-sm">or</span>
        <PrimaryButton variant="secondary" onClick={onManualEntry}>
          Answer a few questions
        </PrimaryButton>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(12,15,26,0.45)] backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Upload resume"
        >
          <div className="relative w-full max-w-md rounded-[14px] bg-white border border-[rgba(12,15,26,0.07)] shadow-[0_8px_32px_rgba(52,109,224,0.18)] p-6">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowOverwriteConfirm(false);
              }}
              aria-label="Close upload"
              className="absolute top-3 right-3 text-[#4A5568] hover:text-rose-500 p-1 rounded-md"
            >
              <X size={18} />
            </button>

            <h2 className="text-center text-[#346DE0] text-lg font-semibold mb-3">Upload Resume</h2>
            <div className="h-px w-full bg-[rgba(12,15,26,0.07)] mb-4" />

            {showOverwriteConfirm ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <p>
                    Uploading will replace your saved education, experience, projects, and skills with data extracted from this PDF. This
                    cannot be undone from this screen.
                  </p>
                </div>
                <div className="flex gap-3">
                  <PrimaryButton variant="secondary" fullWidth onClick={() => setShowOverwriteConfirm(false)}>
                    Cancel
                  </PrimaryButton>
                  <PrimaryButton fullWidth onClick={() => void runUpload()}>
                    Replace and upload
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {savedProfileExists ? (
                  <p className="text-xs text-[#4A5568] text-center">You have existing profile details. Uploading will overwrite them.</p>
                ) : null}

                {file ? (
                  <div className="relative bg-[#F8F9FB] rounded-[12px] p-6 flex flex-col items-center gap-2">
                    <FileText size={56} className="text-rose-500" />
                    <span className="text-sm text-[#4A5568] max-w-[220px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      aria-label="Remove file"
                      className="absolute top-2 right-2 bg-rose-500 text-white rounded-md p-1 hover:bg-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragEnter={e => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={e => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsDragging(false);
                      }
                    }}
                    onDragOver={e => e.preventDefault()}
                    className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-[12px] py-10 text-xs cursor-pointer transition-colors ${
                      isDragging
                        ? "border-[#346DE0] text-[#346DE0] bg-[#F0F6FE]"
                        : "border-[rgba(12,15,26,0.15)] text-[#8896A8] hover:border-[#346DE0] hover:text-[#346DE0]"
                    }`}
                  >
                    <UploadCloud size={28} className="mb-1" />
                    <span>Drag and drop here</span>
                    <span>or</span>
                    <span>Browse</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      style={{ display: "none" }}
                      onChange={e => setIfValid(e.target.files?.[0])}
                    />
                  </div>
                )}

                {error ? <span className="text-xs text-rose-600 text-center">{error}</span> : null}

                <PrimaryButton onClick={() => void handleSubmit()} disabled={!file} fullWidth>
                  Upload
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </FormShell>
  );
}
