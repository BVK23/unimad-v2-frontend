import React from "react";
import { resolvePortfolioBlockType } from "@/features/portfolio/utils/normalizePortfolioBlockType";
import { normalizePortfolioRichTextForRender } from "@/features/portfolio/utils/portfolio-html";
import { PortfolioItem } from "../../types";
import PortfolioImage from "../portfolio/PortfolioImage";

interface VpdCardThumbnailProps {
  project: PortfolioItem;
  className?: string;
}

/** Keep enough rows to convey the layout; overflow is clipped (thumbnail is a preview, not the full doc). */
const MAX_THUMBNAIL_ROWS = 6;

/** Mini-scale rich-text styles so bold / paragraphs / lists read in the thumbnail body. */
const MINI_RICH_TEXT_CLASSES =
  "[&_p]:mb-0.5 [&_p:last-child]:mb-0 " +
  "[&_strong]:font-bold [&_b]:font-bold " +
  "[&_em]:italic [&_i]:italic " +
  "[&_u]:underline " +
  "[&_ul]:my-0.5 [&_ul]:list-disc [&_ul]:pl-1.5 " +
  "[&_ol]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-1.5 " +
  "[&_li]:my-0 " +
  "break-words [overflow-wrap:anywhere]";

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

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const blockSpan = (block: PortfolioItem): number => Math.max(1, Math.min(12, Number(block.span) || 12));

const spanToColClass = (span: number): string => {
  if (span >= 12) return "col-span-12";
  if (span >= 8) return "col-span-8";
  if (span >= 6) return "col-span-6";
  return "col-span-4";
};

/** Group blocks into rows the same way the 12-col grid wraps them, so we can cap by whole rows. */
const groupBlocksIntoRows = (blocks: PortfolioItem[]): PortfolioItem[][] => {
  const rows: PortfolioItem[][] = [];
  let current: PortfolioItem[] = [];
  let filled = 0;

  for (const block of blocks) {
    const span = blockSpan(block);
    if (current.length > 0 && filled + span > 12) {
      rows.push(current);
      current = [];
      filled = 0;
    }
    current.push(block);
    filled += span;
  }
  if (current.length > 0) rows.push(current);

  return rows;
};

const cardShell =
  "overflow-hidden rounded-md border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] dark:border-slate-600 dark:bg-slate-800";

const MiniBlock: React.FC<{ block: PortfolioItem }> = ({ block }) => {
  const type = resolvePortfolioBlockType(block);
  const blockTitle = stripText(block.title || "");

  // Page card — visual card: cover thumbnail + title + subtitle (description). Never show `content` (a cover URL).
  if (type === "page-card" || type === "project") {
    const coverEnabled = block.showCoverImage !== false;
    const cover = block.canvasCover?.trim() || (isHttpUrl(block.content || "") ? (block.content || "").trim() : "");
    const subtitle = stripText(block.description || "");

    return (
      <div className={`flex flex-col ${cardShell}`}>
        <div className="relative h-[48px] w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
          {coverEnabled && cover ? <PortfolioImage src={cover} alt="" fill sizes="120px" className="object-cover" /> : null}
        </div>
        <div className="px-1 py-1">
          {blockTitle ? (
            <p className="line-clamp-1 text-[5px] font-semibold leading-[1.1] text-slate-700 dark:text-slate-200">{blockTitle}</p>
          ) : null}
          {subtitle ? <p className="mt-0.5 line-clamp-1 text-[4px] leading-[1.2] text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
      </div>
    );
  }

  // Media / image / video / embed — render the asset if it's a URL, else a label.
  if (type === "media" || type === "image" || type === "video" || type === "embed") {
    const src = isHttpUrl(block.content || "") ? (block.content || "").trim() : "";
    return (
      <div className={cardShell}>
        <div className="relative h-[22px] w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
          {src ? <PortfolioImage src={src} alt="" fill sizes="120px" className="object-cover" /> : null}
        </div>
        {blockTitle ? (
          <p className="px-1 py-1 text-[5px] font-semibold leading-[1.1] text-slate-700 dark:text-slate-200 line-clamp-1">{blockTitle}</p>
        ) : null}
      </div>
    );
  }

  // Table — faux rows so it reads as a table, not raw JSON.
  if (type === "table") {
    return (
      <div className={cardShell}>
        {blockTitle ? (
          <p className="border-b border-slate-100 px-1 py-1 text-[5px] font-semibold leading-[1.1] text-slate-700 dark:border-slate-700 dark:text-slate-200 line-clamp-1">
            {blockTitle}
          </p>
        ) : null}
        <div className="space-y-0.5 p-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[3px] rounded-[1px] bg-slate-100 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  // Link box — title (or the URL when untitled), never a body fallback.
  if (type === "link-box") {
    const label = blockTitle || stripText(block.content || "Link");
    return (
      <div className={`px-1 py-1 ${cardShell}`}>
        <p className="line-clamp-2 text-[5px] font-semibold leading-[1.1] text-slate-700 dark:text-slate-200">{label || "Link"}</p>
      </div>
    );
  }

  // Text (default) — title as plain label; body keeps rich formatting (bold, paragraphs, lists).
  // No line-clamp: blocks grow to fit their content. The outer thumbnail clips overflow.
  const hasBody = Boolean(stripText(block.content || ""));
  const bodyHtml = hasBody ? normalizePortfolioRichTextForRender(block.content || "") : "";
  return (
    <div className={cardShell}>
      {blockTitle ? (
        <p className="border-b border-slate-100 px-1 py-1 text-[5px] font-semibold leading-none text-slate-700 dark:border-slate-700 dark:text-slate-200">
          {blockTitle}
        </p>
      ) : null}
      {hasBody ? (
        <div
          className={`px-1 py-0.5 text-[4px] leading-[1.2] text-slate-600 dark:text-slate-300 ${MINI_RICH_TEXT_CLASSES}`}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      ) : null}
    </div>
  );
};

const VpdCardThumbnail: React.FC<VpdCardThumbnailProps> = ({ project, className = "" }) => {
  const blocks = project.detailedBlocks ?? [];
  const title = stripText(project.title || "") || "Untitled VPD";
  const subtitle = stripText(project.description || "");
  const coverUrl = typeof project.content === "string" ? project.content.trim() : "";
  const hasCover = Boolean(coverUrl);
  const visibleBlocks = groupBlocksIntoRows(blocks).slice(0, MAX_THUMBNAIL_ROWS).flat();

  return (
    <div className={`relative h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-900 ${className}`} aria-hidden>
      {/* Mini hero — cover image when present, otherwise the gray placeholder */}
      <div
        className={`relative h-[32%] shrink-0 overflow-hidden px-2 pb-2 pt-2 ${
          hasCover ? "bg-slate-800" : "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900"
        }`}
      >
        {hasCover ? (
          <>
            <PortfolioImage src={coverUrl} alt="" fill sizes="240px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/15 to-transparent" />
          </>
        ) : null}
        <div className={`relative z-[1] ${hasCover ? "drop-shadow-sm" : ""}`}>
          <p className="line-clamp-2 text-[7px] font-semibold leading-tight text-white">{title}</p>
          {subtitle ? <p className="mt-0.5 line-clamp-1 text-[5px] text-white/70">{subtitle}</p> : null}
        </div>
      </div>

      {/* Mini block grid — preserves each block's span so rows (e.g. two half-width page cards) match the doc layout.
          Blocks stay fit-to-content via `self-start`; overflow past the visible area is intentionally clipped. */}
      <div
        className={`grid h-[68%] grid-cols-12 gap-0.5 overflow-hidden p-1 ${visibleBlocks.length > 0 ? "auto-rows-min content-start" : ""}`}
      >
        {visibleBlocks.length > 0 ? (
          visibleBlocks.map(block => (
            <div key={block.id} className={`${spanToColClass(blockSpan(block))} self-start`}>
              <MiniBlock block={block} />
            </div>
          ))
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
