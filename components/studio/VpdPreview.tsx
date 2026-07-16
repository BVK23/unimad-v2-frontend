import React, { useState } from "react";
import { resolvePortfolioBlockType } from "@/features/portfolio/utils/normalizePortfolioBlockType";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { PortfolioItem } from "../../types";
import BlockRenderer from "../BlockRenderer";
import PortfolioImage from "../portfolio/PortfolioImage";
import VpdExportActions from "./VpdExportActions";

interface VpdPreviewProps {
  project: PortfolioItem;
  onOpenEditor?: () => void;
  variant?: "panel" | "compact";
  slug?: string | null;
  onSlugChange?: (slug: string) => void;
  onBeforePublish?: () => Promise<void>;
}

const isPageCardBlock = (item: PortfolioItem): boolean => {
  const type = resolvePortfolioBlockType(item);
  return type === "page-card" || type === "project";
};

const spanToClass = (span?: number): string => {
  const value = Math.max(1, Math.min(12, Number(span) || 12));
  if (value >= 12) return "col-span-12";
  if (value >= 8) return "col-span-12 md:col-span-8";
  if (value >= 6) return "col-span-12 md:col-span-6";
  return "col-span-12 md:col-span-4";
};

const VpdPreview: React.FC<VpdPreviewProps> = ({
  project,
  onOpenEditor,
  variant = "panel",
  slug = null,
  onSlugChange,
  onBeforePublish,
}) => {
  const [pageStack, setPageStack] = useState<PortfolioItem[]>([]);

  const isPanel = variant === "panel";
  const activeItem = pageStack.length > 0 ? pageStack[pageStack.length - 1] : project;
  const isNested = pageStack.length > 0;

  const blocks = activeItem.detailedBlocks ?? [];
  const coverUrl = typeof activeItem.content === "string" ? activeItem.content.trim() : "";
  const hasCover = Boolean(coverUrl);
  const hasContent = blocks.length > 0 || Boolean(activeItem.title?.trim()) || hasCover;

  const handleSelectProject = (item: PortfolioItem) => setPageStack(prev => [...prev, item]);

  const handleBack = () => setPageStack(prev => prev.slice(0, -1));

  return (
    <div className={isPanel ? "flex h-full min-h-0 flex-col" : "mt-5 border-t border-slate-100 pt-5 dark:border-slate-800"}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {isNested ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back to previous page"
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <ChevronLeft size={14} />
              Back
            </button>
          ) : (
            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Preview</h3>
          )}
        </div>
        <VpdExportActions project={project} slug={slug} onSlugChange={onSlugChange} onBeforePublish={onBeforePublish} />
      </div>

      <div
        className={`group/vpd-preview relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/50 ${
          isPanel ? "flex min-h-0 flex-1 flex-col" : "max-h-[320px]"
        }`}
      >
        <div className={`relative min-h-0 ${isPanel ? "flex flex-1 flex-col" : ""} ${hasContent ? "" : "min-h-[160px]"}`}>
          {onOpenEditor ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/vpd-preview:opacity-100">
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
            <div className={`overflow-y-auto p-4 scrollbar-on-hover ${isPanel ? "min-h-0 flex-1" : "max-h-[280px]"}`}>
              {!hasCover && activeItem.title ? (
                <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{activeItem.title}</h4>
              ) : null}
              <div className="grid grid-cols-12 gap-3">
                {hasCover ? (
                  <div className="col-span-12">
                    <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800">
                      <div className="relative aspect-[16/7] w-full bg-slate-100 dark:bg-slate-900">
                        <PortfolioImage
                          src={coverUrl}
                          alt={activeItem.title || "VPD cover"}
                          fill
                          sizes="(max-width: 768px) 100vw, 640px"
                          className="object-cover"
                        />
                        {activeItem.title ? (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent px-3 pb-3 pt-8">
                            <p className="line-clamp-2 text-sm font-semibold leading-tight text-white">{activeItem.title}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
                {blocks.map(block => {
                  const interactive = isPageCardBlock(block);
                  return (
                    <div key={block.id} className={spanToClass(block.span)}>
                      <div
                        className={`rounded-lg border border-slate-200/80 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 ${
                          interactive ? "" : "pointer-events-none"
                        }`}
                      >
                        <BlockRenderer
                          item={block}
                          isEditMode={false}
                          onUpdate={() => {}}
                          onSelectProject={interactive ? handleSelectProject : undefined}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="pointer-events-none flex min-h-[160px] flex-col items-center justify-center px-4 py-8 text-center">
              <p className="text-xs text-slate-400">Generate a draft or pick a template to see a preview here.</p>
            </div>
          )}
        </div>
        {onOpenEditor ? (
          <div className="shrink-0 border-t border-slate-200/80 bg-white/90 px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-900/90">
            <button
              type="button"
              onClick={onOpenEditor}
              className="text-[10px] font-medium text-slate-500 transition-colors hover:text-brand-600 dark:hover:text-brand-400"
            >
              Open full editor
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default VpdPreview;
