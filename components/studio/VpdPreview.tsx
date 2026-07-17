"use client";

import React, { useEffect, useRef, useState } from "react";
import ResumePublishedBeacon from "@/components/resume/ResumePublishedBeacon";
import { buildVpdPublicUrl } from "@/features/vpd/utils/vpdPublish";
import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { PortfolioItem } from "../../types";
import ProjectDetailView from "../ProjectDetailView";

/** Matches published / editor canvas (`max-w-5xl`). */
const VPD_PREVIEW_BASE_WIDTH_PX = 1024;
/** Tight inset so the page fills the frame as the panel grows. */
const PREVIEW_PADDING_PX = 16;
const MIN_FIT_SCALE = 0.4;

interface VpdPreviewProps {
  project: PortfolioItem;
  onOpenEditor?: () => void;
  variant?: "panel" | "compact";
  /** When set, landing shows published beacon (no Publish control here). */
  slug?: string | null;
  publishedAt?: string | null;
}

/**
 * Landing-panel preview: same canvas as edit/preview/published, fit-scaled to the
 * panel width (grows with the preview area) and vertically scrollable.
 */
const VpdPreview: React.FC<VpdPreviewProps> = ({ project, onOpenEditor, variant = "panel", slug = null, publishedAt = null }) => {
  const isPanel = variant === "panel";
  const isPublished = Boolean(slug?.trim());
  const shellRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.75);
  const [pageHeight, setPageHeight] = useState(0);
  const [copyHint, setCopyHint] = useState(false);

  const hasContent =
    (project.detailedBlocks?.length ?? 0) > 0 ||
    Boolean(project.title?.trim()) ||
    Boolean(typeof project.content === "string" && project.content.trim()) ||
    Boolean(typeof project.iconUrl === "string" && project.iconUrl.trim());

  useEffect(() => {
    const viewport = shellRef.current;
    const page = pageRef.current;
    if (!viewport || !page || !hasContent) return;

    const update = () => {
      const width = viewport.clientWidth;
      if (width <= 0) return;
      const nextFit = Math.min(1, (width - PREVIEW_PADDING_PX * 2) / VPD_PREVIEW_BASE_WIDTH_PX);
      const nextFitClamped = Math.max(MIN_FIT_SCALE, nextFit);
      const nextHeight = page.scrollHeight || page.offsetHeight;
      setFitScale(prev => (Math.abs(prev - nextFitClamped) < 0.001 ? prev : nextFitClamped));
      setPageHeight(prev => (prev === nextHeight ? prev : nextHeight));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(viewport);
    ro.observe(page);
    return () => ro.disconnect();
  }, [project, hasContent, project.detailedBlocks?.length, project.title, project.content, project.iconUrl]);

  const handleShareLink = async () => {
    const trimmed = slug?.trim();
    if (!trimmed) return;
    const url = buildVpdPublicUrl(trimmed);
    try {
      await navigator.clipboard.writeText(url);
      setCopyHint(true);
      window.setTimeout(() => setCopyHint(false), 2000);
    } catch {
      // Clipboard may be blocked; ignore quietly on landing.
    }
  };

  const scaledWidth = VPD_PREVIEW_BASE_WIDTH_PX * fitScale;
  const scaledHeight = pageHeight > 0 ? pageHeight * fitScale : undefined;

  return (
    <div className={isPanel ? "flex h-full min-h-0 flex-col" : "mt-5 border-t border-slate-100 pt-5 dark:border-slate-800"}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Preview</h3>
        {isPublished ? (
          <div className="inline-flex flex-wrap items-center justify-end gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
              <ResumePublishedBeacon label="VPD published" publishedAt={publishedAt} />
              Published
            </span>
            <button
              type="button"
              onClick={() => void handleShareLink()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <LinkIcon size={14} />
              {copyHint ? "Copied" : "Share link"}
            </button>
          </div>
        ) : null}
      </div>

      <div
        className={`group/vpd-preview relative overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950 ${
          isPanel ? "flex min-h-0 flex-1 flex-col" : "max-h-[360px]"
        }`}
      >
        <div className={`relative min-h-0 ${isPanel ? "flex min-h-0 flex-1 flex-col" : ""} ${hasContent ? "" : "min-h-[160px]"}`}>
          {onOpenEditor ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/vpd-preview:opacity-100">
              <button
                type="button"
                onClick={onOpenEditor}
                aria-label="Open VPD editor"
                className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-600 shadow-lg dark:bg-slate-900 dark:text-brand-400"
              >
                Open editor
                <ExternalLink size={14} />
              </button>
            </div>
          ) : null}

          {hasContent ? (
            <div
              ref={shellRef}
              className={`scrollbar-on-hover min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] ${
                isPanel ? "flex-1" : "max-h-[300px]"
              }`}
              aria-label="Scroll VPD preview"
            >
              <div
                className="flex w-full justify-center py-3"
                style={{ paddingLeft: PREVIEW_PADDING_PX / 2, paddingRight: PREVIEW_PADDING_PX / 2 }}
              >
                <div
                  className="relative shrink-0 overflow-hidden"
                  style={scaledHeight ? { width: scaledWidth, height: scaledHeight } : { width: scaledWidth }}
                >
                  <div
                    ref={pageRef}
                    className="origin-top-left bg-white dark:bg-slate-950"
                    style={{
                      width: VPD_PREVIEW_BASE_WIDTH_PX,
                      transform: `scale(${fitScale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <ProjectDetailView
                      project={project}
                      onBack={() => {}}
                      onUpdateProject={() => {}}
                      allowedBlockTypes={["text", "media", "link-box", "page-card", "table"]}
                      gridColumns={12}
                      maxWidthClassName="max-w-5xl"
                      coverLayout="banner"
                      hideToolbar
                      hideEditModeToggle
                      isEditMode={false}
                      isReadOnly
                      isNestedDetailView={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="pointer-events-none flex min-h-[160px] flex-col items-center justify-center px-4 py-8 text-center">
              <p className="text-xs text-slate-400">Generate a draft or pick a template to see a preview here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VpdPreview;
