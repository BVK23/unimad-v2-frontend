"use client";

import { useState } from "react";
import ResumeDashboard from "@/components/ResumeDashboard";
import ResumeEditor from "@/components/ResumeEditor";
import type { ResumeData } from "@/types";

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
  ],
};

export default function ResumePageClient() {
  const [resumeView, setResumeView] = useState<"list" | "editor">("list");
  const [currentResume, setCurrentResume] = useState<ResumeData | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const handleEditResume = (resume: ResumeData) => {
    setCurrentResume(resume);
    setResumeView("editor");
  };

  const handleCreateResume = (_type: "scratch" | "jd" | "upload") => {
    const newResume: ResumeData = {
      ...NEW_RESUME_TEMPLATE,
      id: Date.now().toString(),
      title: "New Resume",
    };
    setCurrentResume(newResume);
    setResumeView("editor");
    setShowOnboardingModal(true);
  };

  const handleSaveResume = (data: ResumeData) => {
    console.log("Saving resume:", data);
    setResumeView("list");
    setCurrentResume(null);
  };

  const handleImproveWithAI = (text: string) => {
    window.dispatchEvent(
      new CustomEvent("open-unibot", {
        detail: {
          text,
          type: "resume" as const,
          topicTitle: "Resume · Content improvement",
        },
      })
    );
  };

  if (resumeView === "list") {
    return (
      <ResumeDashboard
        onEditResume={handleEditResume}
        onCreateResume={handleCreateResume}
      />
    );
  }

  if (currentResume) {
    return (
      <ResumeEditor
        initialData={currentResume}
        onBack={() => setResumeView("list")}
        onSave={handleSaveResume}
        onImprove={handleImproveWithAI}
        showTemplateModal={showTemplateModal}
        setShowTemplateModal={setShowTemplateModal}
        showExportModal={showExportModal}
        setShowExportModal={setShowExportModal}
      />
    );
  }

  return null;
}
