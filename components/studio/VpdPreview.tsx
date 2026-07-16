import React from "react";
import { ExternalLink } from "lucide-react";
import { PortfolioItem } from "../../types";
import BlockRenderer from "../BlockRenderer";
import VpdExportActions from "./VpdExportActions";

interface VpdPreviewProps {
  project: PortfolioItem;
  onOpenEditor?: () => void;
  variant?: "panel" | "compact";
  slug?: string | null;
  onSlugChange?: (slug: string) => void;
  onBeforePublish?: () => Promise<void>;
}

const VpdPreview: React.FC<VpdPreviewProps> = ({
  project,
  onOpenEditor,
  variant = "panel",
  slug = null,
  onSlugChange,
  onBeforePublish,
}) => {
  const blocks = project.detailedBlocks ?? [];
  const hasContent = blocks.length > 0 || Boolean(project.title?.trim());

  const isPanel = variant === "panel";

  return (
    <div className={isPanel ? "flex h-full min-h-0 flex-col" : "mt-5 border-t border-slate-100 pt-5 dark:border-slate-800"}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Preview</h3>
        <VpdExportActions project={project} slug={slug} onSlugChange={onSlugChange} onBeforePublish={onBeforePublish} />
      </div>

      <div
        className={`group/vpd-preview relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/50 ${
          isPanel ? "flex min-h-0 flex-1 flex-col" : "max-h-[320px]"
        } ${onOpenEditor ? "cursor-pointer" : ""}`}
        onClick={onOpenEditor}
        onKeyDown={
          onOpenEditor
            ? e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenEditor();
                }
              }
            : undefined
        }
        role={onOpenEditor ? "button" : undefined}
        tabIndex={onOpenEditor ? 0 : undefined}
        aria-label={onOpenEditor ? "Open VPD editor" : undefined}
      >
        <div className={`relative min-h-0 ${isPanel ? "flex flex-1 flex-col" : ""} ${hasContent ? "" : "min-h-[160px]"}`}>
          {onOpenEditor && (
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all duration-200 group-hover/vpd-preview:bg-slate-900/35 group-hover/vpd-preview:opacity-100"
              aria-hidden
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-600 shadow-lg dark:bg-slate-900 dark:text-brand-400">
                Open editor
                <ExternalLink size={14} />
              </span>
            </div>
          )}
          {hasContent ? (
            <div className={`overflow-y-auto p-4 scrollbar-on-hover ${isPanel ? "min-h-0 flex-1" : "max-h-[280px]"}`}>
              {project.title && <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{project.title}</h4>}
              <div className="pointer-events-none grid grid-cols-12 gap-3">
                {blocks.map(block => {
                  const span = Math.max(1, Math.min(12, Number(block.span) || 12));
                  const spanClass =
                    span >= 12
                      ? "col-span-12"
                      : span >= 8
                        ? "col-span-12 md:col-span-8"
                        : span >= 6
                          ? "col-span-12 md:col-span-6"
                          : "col-span-12 md:col-span-4";
                  return (
                    <div key={block.id} className={spanClass}>
                      <div className="rounded-lg border border-slate-200/80 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
                        <BlockRenderer item={block} isEditMode={false} onUpdate={() => {}} />
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
        <div className="shrink-0 border-t border-slate-200/80 bg-white/90 px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-900/90">
          <span className="text-[10px] font-medium text-slate-500">Click to open full editor</span>
        </div>
      </div>
    </div>
  );
};

export default VpdPreview;
