import React, { useEffect, useRef, useState } from "react";
import { resolveLinkTitle } from "@/features/portfolio/server-actions/resolve-link-title";
import { hostnameLooksLikeWebAddress, normalizeExternalUrl } from "@/features/portfolio/utils/external-url";
import { UploadError, uploadPortfolioFile } from "@/features/portfolio/utils/upload";
import { ExternalLink, Link as LinkIcon, ChevronDown, ChevronRight, Copy, Loader2, UploadCloud, Trash2, Plus, Minus } from "lucide-react";
import { PortfolioItem } from "../types";
import RichTextEditor from "./RichTextEditor";

// Restores visible rendering for HTML emitted by RichTextEditor's execCommand output.
// Tailwind Preflight strips list-style on ul/ol and sizing on h1/h2, and the project does not install
// @tailwindcss/typography, so prose* classes are inert. These descendant utilities scope the fix to
// the container they are applied to (no leakage to siblings).
const RICH_TEXT_CONTENT_CLASSES =
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 " +
  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 " +
  "[&_li]:my-0.5 " +
  "[&_h1]:text-3xl [&_h1]:font-semibold " +
  "[&_h2]:text-2xl [&_h2]:font-semibold " +
  "[&_h3]:text-xl [&_h3]:font-semibold " +
  "[&_strong]:font-bold [&_b]:font-bold " +
  "[&_em]:italic [&_i]:italic " +
  "[&_u]:underline";

interface BlockRendererProps {
  item: PortfolioItem;
  isEditMode: boolean;
  onUpdate: (id: string, updates: Partial<PortfolioItem>) => void;
  onSelectProject?: (item: PortfolioItem) => void;
  onMeasureCollapsedHeight?: (id: string, height: number) => void;
}

type LinkBoxBlockProps = {
  item: PortfolioItem;
  isEditMode: boolean;
  onUpdate: (id: string, updates: Partial<PortfolioItem>) => void;
  mediaInputRef: React.RefObject<HTMLInputElement | null>;
  openMediaPicker: (e: React.MouseEvent) => void;
  onMediaInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMediaFileUpload: (file: File) => void;
};

const LinkBoxBlock: React.FC<LinkBoxBlockProps> = ({
  item,
  isEditMode,
  onUpdate,
  mediaInputRef,
  openMediaPicker,
  onMediaInputChange,
  handleMediaFileUpload,
}) => {
  const [isMediaDragOver, setIsMediaDragOver] = useState(false);
  const [isResolvingTitle, setIsResolvingTitle] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const lastFetchedUrlRef = useRef<string | null>(null);
  const fetchGenRef = useRef(0);

  useEffect(() => {
    lastFetchedUrlRef.current = null;
    fetchGenRef.current = 0;
  }, [item.id]);

  const hasPreviewImage = Boolean(item.content);
  const heightPx = item.height ?? 96;
  const compact = heightPx <= 110;

  const linkCardClassName = `h-full min-h-0 w-full flex items-center p-4 border rounded-2xl bg-white dark:bg-white/5 transition-all group/link ${isEditMode ? "border-slate-100 dark:border-white/10 hover:border-brand-500/30" : "border-slate-100 dark:border-white/10 hover:shadow-lg hover:-translate-y-1"} ${isMediaDragOver && isEditMode ? "border-brand-500 ring-2 ring-brand-200" : ""}`;

  const onDropLinkPreview = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    setIsMediaDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleMediaFileUpload(file);
  };

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    void (async () => {
      setResolveError(null);
      const trimmed = e.currentTarget.value.trim();
      const gen = ++fetchGenRef.current;

      if (!trimmed) {
        onUpdate(item.id, { title: undefined, linkUrl: undefined });
        lastFetchedUrlRef.current = null;
        setIsResolvingTitle(false);
        return;
      }

      const normalized = normalizeExternalUrl(trimmed);
      if (!normalized) {
        onUpdate(item.id, { title: trimmed });
        lastFetchedUrlRef.current = null;
        setIsResolvingTitle(false);
        return;
      }

      let host: string;
      try {
        host = new URL(normalized).hostname;
      } catch {
        onUpdate(item.id, { title: trimmed });
        lastFetchedUrlRef.current = null;
        setIsResolvingTitle(false);
        return;
      }

      if (!hostnameLooksLikeWebAddress(host)) {
        onUpdate(item.id, { title: trimmed });
        lastFetchedUrlRef.current = null;
        setIsResolvingTitle(false);
        return;
      }

      onUpdate(item.id, { linkUrl: normalized });

      if (lastFetchedUrlRef.current === normalized) {
        setIsResolvingTitle(false);
        return;
      }

      setIsResolvingTitle(true);
      try {
        const result = await resolveLinkTitle(normalized);
        if (gen !== fetchGenRef.current) return;

        if (result.ok) {
          lastFetchedUrlRef.current = normalized;
          onUpdate(item.id, { title: result.title, linkUrl: normalized });
        } else {
          setResolveError(result.error);
          onUpdate(item.id, { title: trimmed, linkUrl: normalized });
        }
      } finally {
        if (gen === fetchGenRef.current) {
          setIsResolvingTitle(false);
        }
      }
    })();
  };

  const inner = (
    <>
      <input ref={mediaInputRef} type="file" accept="image/*" className="hidden" onChange={onMediaInputChange} />

      <div className="w-14 h-14 flex-shrink-0 bg-slate-50 dark:bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden text-slate-400 group-hover/link:text-brand-500 group-hover/link:bg-brand-50 transition-colors">
        {hasPreviewImage ? (
          <img src={item.content} className="w-full h-full object-cover" alt="Page box preview" />
        ) : item.linkIcon ? (
          <img src={item.linkIcon} className="w-7 h-7 grayscale group-hover/link:grayscale-0 transition-all" alt="" />
        ) : (
          <LinkIcon size={24} />
        )}
      </div>
      <div className="ml-5 flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <input
              value={item.title || ""}
              onChange={e => {
                setResolveError(null);
                onUpdate(item.id, { title: e.target.value });
              }}
              onBlur={handleTitleBlur}
              onClick={e => e.stopPropagation()}
              onKeyDown={e => e.stopPropagation()}
              className="font-semibold text-lg text-slate-900 dark:text-white bg-transparent outline-none w-full min-w-0 placeholder:text-slate-300"
              placeholder="Paste a link or title"
              aria-label="Link URL or title"
            />
          ) : (
            <span className="font-semibold text-lg text-slate-900 dark:text-white truncate">{item.title || "External Link"}</span>
          )}
          {isEditMode && isResolvingTitle ? <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin text-brand-500" aria-hidden /> : null}
          {!isEditMode && (
            <ExternalLink size={14} className="text-slate-300 flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          )}
        </div>
        {isEditMode ? (
          <>
            {resolveError ? <p className="mt-1 text-xs text-red-500 truncate">{resolveError}</p> : null}
            {!compact && (
              <button
                type="button"
                onClick={openMediaPicker}
                className="mt-2 text-xs font-medium uppercase tracking-widest text-slate-500 hover:text-brand-600 transition-colors"
              >
                Upload image or GIF
              </button>
            )}
          </>
        ) : (
          <p className="text-sm font-medium text-slate-400 mt-1 truncate">{item.linkUrl || "Open page"}</p>
        )}
      </div>
    </>
  );

  if (!isEditMode) {
    const viewHref = normalizeExternalUrl(item.linkUrl ?? "");
    if (viewHref) {
      return (
        <a href={viewHref} target="_blank" rel="noopener noreferrer" className={linkCardClassName}>
          {inner}
        </a>
      );
    }
    return <div className={`${linkCardClassName} cursor-default`}>{inner}</div>;
  }

  return (
    <div
      className={linkCardClassName}
      onDragOver={e => {
        e.preventDefault();
        e.stopPropagation();
        setIsMediaDragOver(true);
      }}
      onDragLeave={e => {
        e.preventDefault();
        e.stopPropagation();
        setIsMediaDragOver(false);
      }}
      onDrop={onDropLinkPreview}
    >
      {inner}
    </div>
  );
};

const BlockRenderer: React.FC<BlockRendererProps> = ({ item, isEditMode, onUpdate, onSelectProject, onMeasureCollapsedHeight }) => {
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const collapsedTextRef = useRef<HTMLDivElement>(null);
  const [isMediaDragOver, setIsMediaDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const stripHtml = (value: string) =>
    value
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

  useEffect(() => {
    if (!onMeasureCollapsedHeight || item.type !== "text" || !item.isCollapsible || !item.isCollapsed || !collapsedTextRef.current) {
      return;
    }

    const node = collapsedTextRef.current;
    const report = () => onMeasureCollapsedHeight(item.id, Math.ceil(node.getBoundingClientRect().height));
    report();

    const observer = new ResizeObserver(() => report());
    observer.observe(node);
    return () => observer.disconnect();
  }, [item.id, item.type, item.isCollapsible, item.isCollapsed, item.title, isEditMode, onMeasureCollapsedHeight]);

  const parseTableContent = (value?: string): string[][] => {
    if (!value) return Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ""));
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) throw new Error("Invalid table");
      const rows = parsed.filter(Array.isArray).map((row: unknown[]) => row.map(cell => String(cell ?? "")));
      if (!rows.length) throw new Error("Empty table");
      return rows;
    } catch {
      return Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ""));
    }
  };

  const serializeTableContent = (rows: string[][]) => JSON.stringify(rows);

  const handleMediaFileUpload = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);
    try {
      const uploaded = await uploadPortfolioFile(file);
      const normalizedMediaType: PortfolioItem["mediaType"] =
        uploaded.mediaType === "video" || uploaded.mediaType === "pdf" ? uploaded.mediaType : "image";

      onUpdate(item.id, {
        content: uploaded.url,
        mediaType: normalizedMediaType,
        mediaName: uploaded.name,
        mediaMimeType: uploaded.mimeType,
        ...(item.type === "page-card" || item.type === "project" ? { showCoverImage: true } : {}),
      });
    } catch (error) {
      const message = error instanceof UploadError ? error.message : "Upload failed";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const openMediaPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    mediaInputRef.current?.click();
  };

  const onMediaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    void handleMediaFileUpload(file);
    e.target.value = "";
  };

  // -- Text Block --
  if (item.type === "text") {
    const heightPx = item.height ?? 160;
    const compact = heightPx <= 96;
    const toggleCollapsed = () => onUpdate(item.id, { isCollapsed: !item.isCollapsed });

    return (
      <div
        ref={item.isCollapsible && item.isCollapsed ? collapsedTextRef : null}
        className={`relative flex flex-col group/text bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10 transition-all ${isEditMode ? "hover:border-brand-500/30" : ""} p-6 overflow-hidden ${item.isCollapsed ? "" : "h-full"}`}
      >
        {(item.title || isEditMode || item.isCollapsible) && (
          <div className={`flex items-center gap-2 ${item.isCollapsed ? "" : "mb-3"}`}>
            {item.isCollapsible && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleCollapsed();
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-brand-600 z-10"
              >
                {item.isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
              </button>
            )}
            {isEditMode ? (
              <RichTextEditor
                value={item.title || ""}
                onChange={value => onUpdate(item.id, { title: value })}
                onToggleCollapsible={() => onUpdate(item.id, { isCollapsible: !item.isCollapsible })}
                isCollapsible={Boolean(item.isCollapsible)}
                className={`w-full bg-transparent text-slate-900 dark:text-white ${compact ? "text-base font-semibold min-h-0" : "text-lg font-semibold min-h-[1.5rem]"} ${RICH_TEXT_CONTENT_CLASSES}`}
                placeholder="Section Title (Optional)"
              />
            ) : (
              item.title && (
                <h3
                  className={`font-semibold text-lg text-slate-900 dark:text-white ${RICH_TEXT_CONTENT_CLASSES}`}
                  dangerouslySetInnerHTML={{ __html: item.title }}
                />
              )
            )}
          </div>
        )}

        {!item.isCollapsed && (
          <div className="flex-1 min-h-0 overflow-hidden">
            {isEditMode ? (
              <RichTextEditor
                value={item.content || ""}
                onChange={value => onUpdate(item.id, { content: value })}
                className={`w-full outline-none bg-transparent h-full min-h-[4rem] text-slate-600 dark:text-slate-300
                                    ${item.fontSize === "2xl" ? "text-2xl font-semibold" : item.fontSize === "xl" ? "text-xl font-semibold" : "text-base"}
                                    ${item.fontWeight === "bold" ? "font-semibold" : item.fontWeight === "medium" ? "font-medium" : "font-normal"}
                                    ${RICH_TEXT_CONTENT_CLASSES}
                                `}
                placeholder="New content block..."
              />
            ) : (
              <div
                className={`
                                    max-w-none text-slate-600 dark:text-slate-300
                                    ${item.fontSize === "2xl" ? "text-2xl font-semibold" : item.fontSize === "xl" ? "text-xl font-semibold" : "text-base"}
                                    ${RICH_TEXT_CONTENT_CLASSES}
                                `}
                dangerouslySetInnerHTML={{ __html: item.content || "" }}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // -- Media Block (Image, Video, PDF) --
  if (item.type === "media") {
    const isVideo = item.mediaType === "video";
    const isPDF = item.mediaType === "pdf";

    const onDropMedia = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsMediaDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && isEditMode) void handleMediaFileUpload(file);
    };

    return (
      <div
        className={`h-full rounded-2xl overflow-hidden bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group/media relative shadow-sm transition-all ${isEditMode ? "hover:border-brand-500/30" : ""} ${isMediaDragOver ? "border-brand-500 ring-2 ring-brand-200" : ""}`}
        onDragOver={e => {
          if (!isEditMode) return;
          e.preventDefault();
          setIsMediaDragOver(true);
        }}
        onDragLeave={e => {
          if (!isEditMode) return;
          e.preventDefault();
          setIsMediaDragOver(false);
        }}
        onDrop={onDropMedia}
      >
        <input ref={mediaInputRef} type="file" accept="image/*,video/*,application/pdf" className="hidden" onChange={onMediaInputChange} />

        {item.content ? (
          <>
            {isVideo ? (
              <video src={item.content} controls className="w-full h-full min-h-[220px] object-cover bg-black" />
            ) : isPDF ? (
              <div className="h-full min-h-[220px] p-8 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900">
                <Copy size={42} className="text-slate-300 mb-4" />
                <p className="font-semibold text-slate-700 dark:text-slate-100">{item.mediaName || item.title || "Uploaded document"}</p>
                <a
                  href={item.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs uppercase tracking-widest text-brand-600 mt-2 font-medium"
                >
                  Open PDF
                </a>
              </div>
            ) : (
              <img
                src={item.content}
                alt={item.mediaName || "Media content"}
                className="w-full h-full min-h-[220px] object-cover group-hover/media:scale-105 transition-transform duration-700"
              />
            )}

            {isEditMode && (
              <div className="absolute top-4 right-4 z-20 opacity-0 group-hover/media:opacity-100 transition-opacity">
                <button
                  onClick={openMediaPicker}
                  disabled={isUploading}
                  className="text-[10px] font-medium uppercase tracking-widest bg-white/95 dark:bg-slate-900 text-slate-700 dark:text-white rounded-full px-3 py-1.5 shadow-xl border border-slate-200 dark:border-white/10 disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Replace Media"}
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={openMediaPicker}
            disabled={isUploading}
            className="w-full min-h-[220px] h-full p-8 border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-brand-500 hover:text-brand-600 transition-colors flex flex-col items-center justify-center gap-3 text-slate-400 disabled:opacity-60 disabled:cursor-wait"
          >
            <UploadCloud size={30} />
            <span className="text-sm font-semibold">{isUploading ? "Uploading..." : "Upload Media"}</span>
            <span className="text-[11px] uppercase tracking-wider font-medium">
              {isUploading ? "Please wait" : "Drag & drop or click to browse"}
            </span>
          </button>
        )}
        {uploadError && (
          <div className="absolute bottom-3 left-3 right-3 z-30 text-xs font-medium text-red-500 bg-white/95 dark:bg-slate-900 border border-red-200 rounded-md px-3 py-1.5 shadow">
            {uploadError}
          </div>
        )}
      </div>
    );
  }

  // -- Link Box Block --
  if (item.type === "link-box") {
    return (
      <LinkBoxBlock
        item={item}
        isEditMode={isEditMode}
        onUpdate={onUpdate}
        mediaInputRef={mediaInputRef}
        openMediaPicker={openMediaPicker}
        onMediaInputChange={onMediaInputChange}
        handleMediaFileUpload={handleMediaFileUpload}
      />
    );
  }

  // -- Page Card (Project) --
  if (item.type === "page-card" || item.type === "project") {
    const normalizedTitle = (item.title || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    const normalizedDescription = (item.description || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    const hasTitle = Boolean(stripHtml(normalizedTitle));
    const hasDescription = Boolean(normalizedDescription);
    const hasAnyText = hasTitle || hasDescription;
    const coverEnabled = item.showCoverImage !== false;
    const heightPx = item.height ?? 160;
    const TITLE_ONLY_MIN_PX = 108;
    const TITLE_AND_SUBTITLE_MIN_PX = 144;
    const showTextArea = coverEnabled ? heightPx >= TITLE_ONLY_MIN_PX : true;
    const showSubtitle = coverEnabled ? heightPx >= TITLE_AND_SUBTITLE_MIN_PX : true;

    const onDropCover = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file && isEditMode) void handleMediaFileUpload(file);
    };

    return (
      <div
        onClick={() => (!isEditMode && onSelectProject ? onSelectProject(item) : undefined)}
        className={`h-full rounded-2xl bg-white dark:bg-[#111] overflow-hidden group/card transition-all duration-500 flex flex-col border border-slate-100 dark:border-white/5 shadow-sm relative
                    ${isEditMode ? "hover:border-brand-500/30" : "cursor-pointer hover:shadow-2xl hover:-translate-y-1 hover:border-slate-200"}
                `}
      >
        <input ref={mediaInputRef} type="file" accept="image/*" className="hidden" onChange={onMediaInputChange} />

        {coverEnabled ? (
          <div
            className="relative overflow-hidden w-full bg-slate-100 dark:bg-slate-800 transition-all duration-500 flex-1 min-h-0"
            onDragOver={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={onDropCover}
          >
            {isEditMode && (
              <div className="absolute inset-0 z-10 opacity-0 group-hover/card:opacity-100 bg-black/40 flex flex-col items-center justify-center p-4 transition-opacity gap-2">
                <button
                  onClick={openMediaPicker}
                  disabled={isUploading}
                  className="text-[10px] font-medium uppercase tracking-widest bg-white/95 text-slate-700 rounded-full px-4 py-2 shadow-xl border border-slate-200 hover:bg-white transition-colors disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Replace Image"}
                </button>
                {item.content && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onUpdate(item.id, { showCoverImage: false });
                    }}
                    className="text-[10px] font-medium uppercase tracking-widest bg-white/95 text-slate-700 rounded-full px-4 py-2 shadow-xl border border-slate-200 hover:bg-white transition-colors"
                  >
                    Hide Cover
                  </button>
                )}
                <span className="text-[9px] text-white/60 mt-1 font-bold uppercase tracking-tighter">or drag & drop</span>
                {uploadError && (
                  <span className="text-[10px] font-medium text-red-300 bg-black/70 rounded px-2 py-1 mt-1">{uploadError}</span>
                )}
              </div>
            )}
            {item.content ? (
              <img
                src={item.content}
                alt={item.title || "Project cover"}
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-slate-300 font-medium uppercase tracking-widest text-xs">No Cover Image</span>
              </div>
            )}
          </div>
        ) : (
          isEditMode && (
            <div className="p-4 flex flex-col gap-1">
              <button
                type="button"
                onClick={openMediaPicker}
                disabled={isUploading}
                className="w-full px-4 py-2 rounded-full bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-brand-500/40 transition-all disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Add Cover Image"}
              </button>
              {uploadError && <span className="text-[11px] font-medium text-red-500">{uploadError}</span>}
            </div>
          )
        )}

        {(isEditMode || hasAnyText) && showTextArea && (
          <div
            className={`px-4 md:px-4 flex flex-col justify-center w-full overflow-hidden ${showSubtitle ? "py-6 md:py-8" : "py-4 md:py-6"}`}
          >
            {isEditMode ? (
              <div className={`space-y-3 ${showSubtitle ? "" : "space-y-2"}`}>
                <RichTextEditor
                  value={item.title || ""}
                  onChange={value => onUpdate(item.id, { title: value })}
                  className={`w-full bg-transparent text-2xl font-semibold text-slate-900 dark:text-white min-h-[2rem] ${RICH_TEXT_CONTENT_CLASSES}`}
                  placeholder="Page Title"
                />
                {showSubtitle && (
                  <textarea
                    value={item.description || ""}
                    onChange={e => onUpdate(item.id, { description: e.target.value })}
                    onClick={e => e.stopPropagation()}
                    className="text-base text-slate-500 dark:text-slate-400 bg-transparent outline-none w-full mt-0 resize-none min-h-[3rem]"
                    placeholder="Subtitle (optional)"
                    rows={2}
                  />
                )}
              </div>
            ) : (
              <div className={`space-y-3 ${showSubtitle ? "" : "space-y-2"}`}>
                {hasTitle && (
                  <h3
                    className={`font-semibold text-2xl text-slate-900 dark:text-white leading-tight ${RICH_TEXT_CONTENT_CLASSES}`}
                    dangerouslySetInnerHTML={{ __html: normalizedTitle }}
                  />
                )}
                {showSubtitle && hasDescription && (
                  <p className="text-base text-slate-500 dark:text-slate-400 mt-3 line-clamp-3 text-pretty">{normalizedDescription}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (item.type === "table") {
    const rows = parseTableContent(item.content);
    const columnCount = Math.max(1, ...rows.map(row => row.length));
    const normalizedRows = rows.map(row =>
      row.length < columnCount ? [...row, ...Array.from({ length: columnCount - row.length }, () => "")] : row
    );

    const updateCell = (rowIndex: number, colIndex: number, nextValue: string) => {
      const nextRows = normalizedRows.map((row, rIdx) =>
        rIdx === rowIndex ? row.map((cell, cIdx) => (cIdx === colIndex ? nextValue : cell)) : row
      );
      onUpdate(item.id, { content: serializeTableContent(nextRows) });
    };

    const addRow = () =>
      onUpdate(item.id, { content: serializeTableContent([...normalizedRows, Array.from({ length: columnCount }, () => "")]) });
    const removeRow = () => {
      if (normalizedRows.length <= 1) return;
      onUpdate(item.id, { content: serializeTableContent(normalizedRows.slice(0, -1)) });
    };
    const addColumn = () => onUpdate(item.id, { content: serializeTableContent(normalizedRows.map(row => [...row, ""])) });
    const removeColumn = () => {
      if (columnCount <= 1) return;
      onUpdate(item.id, { content: serializeTableContent(normalizedRows.map(row => row.slice(0, -1))) });
    };

    return (
      <div
        className={`h-full rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-white/5 p-4 flex flex-col gap-3 ${isEditMode ? "hover:border-brand-500/30" : ""}`}
      >
        {isEditMode && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={addRow}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 hover:border-brand-500/40 inline-flex items-center gap-1"
            >
              <Plus size={12} /> Row
            </button>
            <button
              type="button"
              onClick={removeRow}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 hover:border-brand-500/40 inline-flex items-center gap-1"
            >
              <Minus size={12} /> Row
            </button>
            <button
              type="button"
              onClick={addColumn}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 hover:border-brand-500/40 inline-flex items-center gap-1"
            >
              <Plus size={12} /> Column
            </button>
            <button
              type="button"
              onClick={removeColumn}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 hover:border-brand-500/40 inline-flex items-center gap-1"
            >
              <Minus size={12} /> Column
            </button>
          </div>
        )}
        <div className="overflow-auto rounded-xl border border-slate-200 dark:border-white/10">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {normalizedRows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, colIndex) => (
                    <td key={`cell-${rowIndex}-${colIndex}`} className="border border-slate-200 dark:border-white/10 p-0 align-top">
                      {isEditMode ? (
                        <RichTextEditor
                          value={cell}
                          onChange={value => updateCell(rowIndex, colIndex, value)}
                          className={`w-full min-w-[120px] bg-transparent px-3 py-2 outline-none text-slate-700 dark:text-slate-200 min-h-[38px] ${RICH_TEXT_CONTENT_CLASSES}`}
                          placeholder={rowIndex === 0 ? `Header ${colIndex + 1}` : "Cell"}
                        />
                      ) : (
                        <div
                          className={`px-3 py-2 text-slate-700 dark:text-slate-200 min-h-[38px] ${RICH_TEXT_CONTENT_CLASSES}`}
                          dangerouslySetInnerHTML={{ __html: cell }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (item.type === "embed") {
    const embedVariant = item.variant === "figma" ? "figma" : "code";
    const embedValue = item.content || "";
    const normalizedEmbedValue = embedValue.trim();
    const hasEmbedValue = normalizedEmbedValue.length > 0;
    const looksLikeUrl = /^https?:\/\//i.test(normalizedEmbedValue);
    const figmaUrl =
      embedVariant === "figma"
        ? normalizedEmbedValue.includes("figma.com")
          ? `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(normalizedEmbedValue)}`
          : ""
        : "";

    return (
      <div
        className={`h-full rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-white/5 p-4 flex flex-col gap-3 ${isEditMode ? "hover:border-brand-500/30" : ""}`}
      >
        {isEditMode ? (
          <input
            type="text"
            value={embedValue}
            onChange={e => onUpdate(item.id, { content: e.target.value })}
            className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 outline-none text-sm text-slate-700 dark:text-slate-200"
            placeholder={embedVariant === "figma" ? "Paste Figma file/share URL" : "Paste embed HTML or URL"}
          />
        ) : null}

        <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
          {hasEmbedValue ? (
            embedVariant === "figma" ? (
              figmaUrl ? (
                <iframe src={figmaUrl} className="w-full h-full min-h-[220px]" allowFullScreen />
              ) : (
                <div className="absolute inset-0 min-h-[220px] grid place-items-center text-center text-xs text-slate-400 px-4">
                  Paste a valid Figma URL to preview.
                </div>
              )
            ) : looksLikeUrl ? (
              <iframe
                src={normalizedEmbedValue}
                className="w-full h-full min-h-[220px]"
                allow="fullscreen; clipboard-read; clipboard-write"
              />
            ) : (
              <iframe srcDoc={embedValue} sandbox="allow-scripts allow-same-origin allow-popups" className="w-full h-full min-h-[220px]" />
            )
          ) : (
            <div className="absolute inset-0 min-h-[220px] grid place-items-center text-center text-xs text-slate-400 px-4">
              {embedVariant === "figma" ? "Figma preview appears here." : "Embed preview appears here."}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div className="p-4 bg-slate-100 rounded-xl text-slate-500 text-sm">Unknown Type</div>;
};

export default BlockRenderer;
