import React from "react";
import { PortfolioItem } from "../../types";

interface VpdCardThumbnailProps {
  project: PortfolioItem;
  className?: string;
}

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const codePoint = Number.parseInt(hex, 16);
      return Number.isNaN(codePoint) ? "" : String.fromCodePoint(codePoint);
    })
    .replace(/&#(\d+);/g, (_, decimal: string) => {
      const codePoint = Number.parseInt(decimal, 10);
      return Number.isNaN(codePoint) ? "" : String.fromCodePoint(codePoint);
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

const stripText = (value: string) =>
  decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const VpdCardThumbnail: React.FC<VpdCardThumbnailProps> = ({ project, className = "" }) => {
  const blocks = project.detailedBlocks ?? [];
  const title = stripText(project.title || "") || "Untitled VPD";
  const subtitle = stripText(project.description || "");

  return (
    <div className={`relative h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-900 ${className}`} aria-hidden>
      {/* Mini hero */}
      <div className="h-[32%] shrink-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 px-2 pb-2 pt-2">
        <p className="line-clamp-2 text-[7px] font-semibold leading-tight text-white">{title}</p>
        {subtitle ? <p className="mt-0.5 line-clamp-1 text-[5px] text-white/70">{subtitle}</p> : null}
      </div>

      {/* Mini block grid */}
      <div className={`grid h-[68%] grid-cols-12 gap-0.5 overflow-hidden p-1 ${blocks.length > 0 ? "auto-rows-min content-start" : ""}`}>
        {blocks.length > 0 ? (
          blocks.slice(0, 4).map(block => {
            const span = Math.max(1, Math.min(12, Number(block.span) || 12));
            const colClass = span >= 12 ? "col-span-12" : span >= 8 ? "col-span-8" : span >= 6 ? "col-span-6" : "col-span-4";
            const blockTitle = stripText(block.title || "");
            const preview =
              block.type === "link-box" ? blockTitle || stripText(block.content || "Link") : stripText(block.content || block.title || "");

            return (
              <div
                key={block.id}
                className={`${colClass} self-start overflow-hidden rounded-md border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] dark:border-slate-600 dark:bg-slate-800`}
              >
                {blockTitle ? (
                  <p className="border-b border-slate-100 px-1 py-1 text-[5px] font-semibold leading-[1.1] text-slate-700 dark:border-slate-700 dark:text-slate-200">
                    {blockTitle}
                  </p>
                ) : null}
                <p className="px-1 py-1 text-[4px] leading-[1.2] text-slate-600 dark:text-slate-300">{preview || "…"}</p>
              </div>
            );
          })
        ) : (
          <>
            <div className="col-span-12 rounded-[3px] border border-dashed border-slate-300 bg-white/80 dark:border-slate-600 dark:bg-slate-800/80" />
            <div className="col-span-6 rounded-[3px] border border-slate-200/90 bg-white dark:border-slate-600 dark:bg-slate-800" />
            <div className="col-span-6 rounded-[3px] border border-slate-200/90 bg-white dark:border-slate-600 dark:bg-slate-800" />
          </>
        )}
      </div>
    </div>
  );
};

export default VpdCardThumbnail;
