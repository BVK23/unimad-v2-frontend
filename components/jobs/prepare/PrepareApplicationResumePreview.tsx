"use client";

import React, { useEffect, useRef, useState } from "react";
import { SCALED_A4_PREVIEW_HEIGHT_PX, SCALED_A4_PREVIEW_WIDTH_PX } from "@/components/resume/shared/ScaledA4PreviewShell";
import { getTemplate } from "@/components/resume/templates";
import { useResume } from "@/features/resume/hooks/useResume";
import { useResumesList } from "@/features/resume/hooks/useResumesList";
import type { ResumeData } from "@/types";
import { Loader2, Pencil } from "lucide-react";
import Link from "next/link";

const PREVIEW_PADDING_PX = 24;
const MAX_SCALE = 0.92;

interface PrepareApplicationResumePreviewProps {
  resumeId: string;
  editHref?: string | null;
  onEditResume?: () => void;
}

/**
 * Full-width resume preview for the Prepare Application modal.
 * Scales the A4 template to fit the available panel width (not the small dashboard thumbnail).
 */
const PrepareApplicationResumePreview: React.FC<PrepareApplicationResumePreviewProps> = ({ resumeId, editHref, onEditResume }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.55);
  const { data: resumesList = [] } = useResumesList();
  const resumeQuery = useResume(resumeId);

  const listMeta = resumesList.find(r => r.id === resumeId);
  const resume: ResumeData | undefined = resumeQuery.data ?? listMeta;
  const templateRenderer = resume ? getTemplate(resume.templateId) : null;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      const next = Math.min(MAX_SCALE, (width - PREVIEW_PADDING_PX) / SCALED_A4_PREVIEW_WIDTH_PX);
      setPreviewScale(Math.max(0.35, next));
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scaledWidth = SCALED_A4_PREVIEW_WIDTH_PX * previewScale;
  const scaledHeight = SCALED_A4_PREVIEW_HEIGHT_PX * previewScale;

  return (
    <div
      ref={containerRef}
      className="group/resume-preview scrollbar-on-hover relative flex h-full min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50"
    >
      {resumeQuery.isLoading && !resume ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : !resume || !templateRenderer ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Preview unavailable</div>
      ) : (
        <div className="relative flex w-full justify-center py-4 pb-16">
          <div
            className="relative shrink-0 overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-slate-200/80 dark:ring-slate-700"
            style={{ width: scaledWidth, minHeight: scaledHeight }}
          >
            <div
              className="box-border shrink-0 origin-top-left"
              style={{
                width: SCALED_A4_PREVIEW_WIDTH_PX,
                minHeight: SCALED_A4_PREVIEW_HEIGHT_PX,
                transform: `scale(${previewScale})`,
              }}
            >
              {templateRenderer.renderPreview(resume, { previewScale: 1, isModal: false })}
            </div>
          </div>

          {editHref ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center opacity-0 transition-opacity duration-200 group-hover/resume-preview:opacity-100">
              <Link
                href={editHref}
                onClick={() => onEditResume?.()}
                className="pointer-events-auto inline-flex translate-y-3 items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-700 group-hover/resume-preview:translate-y-0"
              >
                <Pencil size={15} />
                Edit Resume
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default PrepareApplicationResumePreview;
