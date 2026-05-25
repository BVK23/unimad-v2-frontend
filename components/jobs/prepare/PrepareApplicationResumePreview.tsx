"use client";

import React, { useEffect, useRef, useState } from "react";
import { SCALED_A4_PREVIEW_HEIGHT_PX, SCALED_A4_PREVIEW_WIDTH_PX } from "@/components/resume/shared/ScaledA4PreviewShell";
import { getTemplate } from "@/components/resume/templates";
import { useResume } from "@/features/resume/hooks/useResume";
import { useResumesList } from "@/features/resume/hooks/useResumesList";
import type { ResumeData } from "@/types";
import { Loader2 } from "lucide-react";

const PREVIEW_PADDING_PX = 24;
const MAX_SCALE = 0.92;

interface PrepareApplicationResumePreviewProps {
  resumeId: string;
}

/**
 * Full-width resume preview for the Prepare Application modal.
 * Scales the A4 template to fit the available panel width (not the small dashboard thumbnail).
 */
const PrepareApplicationResumePreview: React.FC<PrepareApplicationResumePreviewProps> = ({ resumeId }) => {
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
      className="scrollbar-on-hover flex h-full min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50"
    >
      {resumeQuery.isLoading && !resume ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : !resume || !templateRenderer ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Preview unavailable</div>
      ) : (
        <div className="flex w-full justify-center py-4">
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
        </div>
      )}
    </div>
  );
};

export default PrepareApplicationResumePreview;
