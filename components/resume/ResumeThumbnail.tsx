"use client";

import React from "react";
import { getTemplate } from "@/components/resume/templates";
import type { ResumeData } from "@/types";
import { FileText, Layers, Star } from "lucide-react";

interface ResumeThumbnailProps {
  resume: ResumeData;
  /** Scale passed to template preview (dashboard uses 0.26). */
  previewScale?: number;
  className?: string;
  heightClass?: string;
  versionBadgeLabel?: string | null;
}

const ResumeThumbnail = React.memo(
  ({ resume, previewScale = 0.26, className = "", heightClass = "h-40", versionBadgeLabel = null }: ResumeThumbnailProps) => {
    const templateRenderer = getTemplate(resume.templateId);

    const versionBadge = versionBadgeLabel ? (
      <div className="pointer-events-none absolute left-3 top-3 z-[35] inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm backdrop-blur-sm">
        <Layers size={10} aria-hidden />
        {versionBadgeLabel}
      </div>
    ) : null;

    if (!templateRenderer) {
      return (
        <div className={`${heightClass} relative flex items-center justify-center overflow-hidden rounded-t-xl bg-slate-100 ${className}`}>
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <FileText size={18} />
            <span className="text-xs font-medium">Preview unavailable</span>
          </div>
          {versionBadge}
          {resume.isBase && (
            <div className="pointer-events-none absolute right-3 top-3 z-[35] inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-600 shadow-sm backdrop-blur-sm">
              <Star size={10} fill="currentColor" aria-hidden /> Base Resume
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`${heightClass} relative overflow-hidden rounded-t-xl bg-slate-100 ${className}`}>
        <div className="pointer-events-none absolute inset-0 z-0 flex min-w-0 select-none justify-center">
          <div className="origin-top" style={{ transform: "translateY(6px)" }}>
            {templateRenderer.renderPreview(resume, { previewScale, isModal: false })}
          </div>
        </div>
        {versionBadge}
        {resume.isBase && (
          <div className="pointer-events-none absolute right-3 top-3 z-[35] inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-600 shadow-sm backdrop-blur-sm">
            <Star size={10} fill="currentColor" aria-hidden /> Base Resume
          </div>
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.resume.id === next.resume.id &&
    prev.resume.templateId === next.resume.templateId &&
    prev.resume.lastModified.getTime() === next.resume.lastModified.getTime() &&
    prev.resume.isBase === next.resume.isBase &&
    prev.resume.publishedAt === next.resume.publishedAt &&
    prev.previewScale === next.previewScale &&
    prev.versionBadgeLabel === next.versionBadgeLabel
);

ResumeThumbnail.displayName = "ResumeThumbnail";

export default ResumeThumbnail;
