"use client";

import ResumePDF from "@/components/ResumePDF";
import { mapBackendResumeToFrontend } from "@/features/resume/api/mappers";
import { fetchResumeContent, recordResumeDownload } from "@/features/resume/server-actions/resume-actions";
import type { ResumeData } from "@/types";
import { pdf } from "@react-pdf/renderer";

async function resolveResumeForDownload(resume: ResumeData): Promise<ResumeData> {
  try {
    const response = await fetchResumeContent(resume.id);
    if (response.resumeData && typeof response.resumeData === "object") {
      return mapBackendResumeToFrontend(response.resumeData as Record<string, unknown>);
    }
  } catch {
    // Fall back to list payload when a refetch fails (offline, etc.).
  }
  return resume;
}

export async function downloadResumePdf(resume: ResumeData): Promise<void> {
  const data = await resolveResumeForDownload(resume);
  const blob = await pdf(<ResumePDF data={data} />).toBlob();
  const baseName = (data.profile.fullName ?? data.title ?? "Resume").replace(/\s+/g, "_");
  const fileName = `${baseName}_Resume.pdf`;
  const url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }

  if (resume.id) {
    void recordResumeDownload(resume.id).catch(() => {});
  }
}
