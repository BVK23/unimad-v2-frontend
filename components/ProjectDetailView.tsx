import React, { useEffect, useState, useRef, type SetStateAction } from "react";
import type { PortfolioHighlightMap } from "@/features/adk-chat/adkPortfolioHighlightDiff";
import { getPortfolioBlockDeleteLabel } from "@/features/portfolio/utils/getPortfolioBlockDeleteLabel";
import { normalizePortfolioRichTextForRender } from "@/features/portfolio/utils/portfolio-html";
import {
  formatPortfolioUploadError,
  logPortfolioUploadError,
  logPortfolioUploadStart,
  logPortfolioUploadSuccess,
} from "@/features/portfolio/utils/portfolioUploadLog";
import { uploadPortfolioFile } from "@/features/portfolio/utils/upload";
import {
  ArrowLeft,
  Trash2,
  GripVertical,
  MoveHorizontal,
  Edit3,
  Eye,
  Copy,
  Type,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Plus,
  Table2,
  Code2,
  Figma,
} from "lucide-react";
import { useGridResize } from "../hooks/useGridResize";
import { PortfolioItem, ContentType } from "../types";
import BlockRenderer from "./BlockRenderer";
import RichTextEditor, { type RichTextEditorSelectionInfo } from "./RichTextEditor";
import DeleteBlockConfirmModal from "./portfolio/DeleteBlockConfirmModal";
import { PortfolioAdkBlockHighlight } from "./portfolio/PortfolioAdkBlockHighlight";
import PortfolioImage from "./portfolio/PortfolioImage";

const PAGE_HERO_RICH_TEXT_CLASSES =
  "[&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_p]:inline [&_br]:block [&_a]:text-brand-200 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-white";

interface ProjectDetailViewProps {
  project: PortfolioItem;
  onBack: () => void;
  onUpdateProject: (updatedProject: PortfolioItem) => void;
  allowedBlockTypes?: ContentType[];
  maxWidthClassName?: string;
  gridColumns?: 3 | 12;
  adkHighlights?: PortfolioHighlightMap;
  backLabel?: string;
  hideToolbar?: boolean;
  /** Hide Preview Mode / Edit Page toggle (VPD page-card interiors keep Back only). */
  hideEditModeToggle?: boolean;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
  enableSelectionImprove?: boolean;
  onTextSelectionChange?: (info: RichTextEditorSelectionInfo | null) => void;
  selectionImproveSlot?: React.ReactNode;
  onUploadError?: (message: string) => void;
  /**
   * When true (default), nested page interiors suppress templateSectionTitle → H1 defaults.
   * VPD uses the nested canvas as the full document — pass false so section titles match Studio preview.
   */
  isNestedDetailView?: boolean;
}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onUpdateProject,
  allowedBlockTypes,
  maxWidthClassName,
  gridColumns = 3,
  adkHighlights,
  backLabel = "Back to Portfolio",
  hideToolbar = false,
  hideEditModeToggle = false,
  isEditMode: isEditModeProp,
  onToggleEditMode,
  enableSelectionImprove = false,
  onTextSelectionChange,
  selectionImproveSlot,
  onUploadError,
  isNestedDetailView = true,
}) => {
  const [uncontrolledEditMode, setUncontrolledEditMode] = useState(true);
  const isEditMode = isEditModeProp ?? uncontrolledEditMode;
  const handleToggleEditMode = onToggleEditMode ?? (() => setUncontrolledEditMode(prev => !prev));

  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId?: string } | null>(null);
  const [pendingDeleteBlockId, setPendingDeleteBlockId] = useState<string | null>(null);
  const [selectedNestedPageId, setSelectedNestedPageId] = useState<string | null>(null);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragHandleArmedBlockIdRef = useRef<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const selectionEditorProps =
    enableSelectionImprove && isEditMode
      ? {
          unifiedSelectionToolbar: true as const,
          selectionImproveSlot,
          onSelectionChange: onTextSelectionChange,
        }
      : {};

  const blocks: PortfolioItem[] = (project.detailedBlocks || []).map(b => {
    const rawSpan = Number(b.span ?? 1);
    const normalizedSpan = (() => {
      if (gridColumns === 12) {
        // Upgrade legacy 3-col spans to 12-col spans for VPD/portfolio parity.
        if (rawSpan === 1) return 4;
        if (rawSpan === 2) return 8;
        if (rawSpan === 3) return 12;
        return Math.max(1, Math.min(12, Math.round(rawSpan)));
      }
      // Backward-compat: older saved layouts used a 4-column full-width span.
      if (rawSpan === 4) return 3;
      return Math.max(1, Math.min(3, Math.round(rawSpan)));
    })();
    const normalizedColStart = typeof b.colStart === "number" ? Math.max(1, Math.min(gridColumns, Math.round(b.colStart))) : undefined;

    return {
      ...b,
      span: normalizedSpan as PortfolioItem["span"],
      ...(typeof normalizedColStart === "number" ? { colStart: normalizedColStart } : {}),
    };
  });
  const allowedTypes: ContentType[] = allowedBlockTypes || ["text", "media", "page-card", "link-box", "table", "embed"];
  const editorMaxWidth = maxWidthClassName || "max-w-4xl";

  const selectedNestedPage =
    selectedNestedPageId != null
      ? (blocks.find(block => block.id === selectedNestedPageId && (block.type === "page-card" || block.type === "project")) ?? null)
      : null;

  useEffect(() => {
    if (!selectedNestedPageId) return;
    const stillExists = blocks.some(block => block.id === selectedNestedPageId && (block.type === "page-card" || block.type === "project"));
    if (!stillExists) setSelectedNestedPageId(null);
  }, [blocks, selectedNestedPageId]);

  const handleUpdateBlock = (id: string, updates: Partial<PortfolioItem>) => {
    const newBlocks = blocks.map(b => (b.id === id ? { ...b, ...updates } : b));
    onUpdateProject({ ...project, detailedBlocks: newBlocks });
  };

  const handleUpdateBlocks = (value: SetStateAction<PortfolioItem[]>) => {
    const newBlocks = typeof value === "function" ? value(blocks) : value;
    onUpdateProject({ ...project, detailedBlocks: newBlocks });
  };

  const { gridRef, resizing, initResize } = useGridResize(blocks, handleUpdateBlocks, itemRefs);

  const handleAddBlock = (type: ContentType, preset?: Partial<PortfolioItem>) => {
    const getDefaultSpanForType = (contentType: ContentType): PortfolioItem["span"] => {
      if (gridColumns === 12) {
        if (contentType === "link-box") return 3;
        if (contentType === "text") return 12;
        if (contentType === "table") return 12;
        if (contentType === "embed") return 12;
        if (contentType === "media") return 12;
        return 6;
      }
      if (contentType === "link-box") return 1;
      if (contentType === "text") return 2;
      if (contentType === "table") return 3;
      if (contentType === "embed") return 3;
      return 2;
    };

    const newBlock: PortfolioItem = {
      id: Date.now().toString(),
      type: type,
      content: "",
      span: getDefaultSpanForType(type),
      detailedBlocks: [],
      ...preset,
    };
    handleUpdateBlocks([...blocks, newBlock]);
    setContextMenu(null);
  };

  const handleDuplicateBlock = (id: string) => {
    const itemToCopy = blocks.find(i => i.id === id);
    if (!itemToCopy) return;
    const newBlock: PortfolioItem = { ...itemToCopy, id: Date.now().toString() };
    const index = blocks.findIndex(i => i.id === id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    handleUpdateBlocks(newBlocks);
    setContextMenu(null);
  };

  const handleRemoveBlock = (id: string) => {
    handleUpdateBlocks(blocks.filter(b => b.id !== id));
    setContextMenu(null);
  };

  const requestDeleteBlock = (id: string) => {
    setPendingDeleteBlockId(id);
    setContextMenu(null);
  };

  const handleConfirmDeleteBlock = () => {
    if (!pendingDeleteBlockId) return;
    handleRemoveBlock(pendingDeleteBlockId);
    setPendingDeleteBlockId(null);
  };

  const pendingDeleteBlock = pendingDeleteBlockId ? blocks.find(block => block.id === pendingDeleteBlockId) : null;

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, index: number, blockId: string) => {
    if (resizing) {
      e.preventDefault();
      return;
    }
    if (dragHandleArmedBlockIdRef.current !== blockId) {
      e.preventDefault();
      return;
    }
    const target = e.target as HTMLElement;
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) {
      e.preventDefault();
      return;
    }
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      e.preventDefault();
      return;
    }
    // Clear pinned column starts so blocks can be reordered freely.
    handleUpdateBlocks(
      blocks.map(block => {
        if (typeof block.colStart === "undefined") return block;
        const { colStart, ...rest } = block;
        return rest;
      })
    );

    setDraggedBlockIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedBlockIndex === null || draggedBlockIndex === index) return;
    const newBlocks = [...blocks];
    const draggedItem = newBlocks[draggedBlockIndex];
    newBlocks.splice(draggedBlockIndex, 1);
    newBlocks.splice(index, 0, draggedItem);
    handleUpdateBlocks(newBlocks);
    setDraggedBlockIndex(index);
  };

  const resetDragState = () => {
    setDraggedBlockIndex(null);
    dragHandleArmedBlockIdRef.current = null;
  };

  const getSpanClass = (span: number) => {
    if (gridColumns === 12) {
      const clamped = Math.max(1, Math.min(12, Math.round(span)));
      const spanClasses: Record<number, string> = {
        1: "col-span-1 md:col-span-1",
        2: "col-span-1 md:col-span-2",
        3: "col-span-1 md:col-span-3",
        4: "col-span-1 md:col-span-4",
        5: "col-span-1 md:col-span-5",
        6: "col-span-1 md:col-span-6",
        7: "col-span-1 md:col-span-7",
        8: "col-span-1 md:col-span-8",
        9: "col-span-1 md:col-span-9",
        10: "col-span-1 md:col-span-10",
        11: "col-span-1 md:col-span-11",
        12: "col-span-1 md:col-span-12",
      };
      return spanClasses[clamped];
    }
    if (span === 3) return "col-span-1 md:col-span-3";
    if (span === 2) return "col-span-1 md:col-span-2";
    return "col-span-1 md:col-span-1";
  };

  const handleContextMenu = (e: React.MouseEvent, targetId: string) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 300),
      targetId,
    });
  };

  const handleCoverUpload = async (file: File) => {
    setCoverUploadError(null);
    setIsCoverUploading(true);
    logPortfolioUploadStart("page-cover", file, { pageId: project.id, pageTitle: project.title });
    try {
      const uploaded = await uploadPortfolioFile(file);
      onUpdateProject({ ...project, content: uploaded.url });
      logPortfolioUploadSuccess("page-cover", uploaded.url, { pageId: project.id });
    } catch (error) {
      const message = formatPortfolioUploadError(error, "Could not upload cover. Try a JPG/PNG/GIF under 4MB, or check your connection.");
      logPortfolioUploadError("page-cover", error, { pageId: project.id, pageTitle: project.title });
      setCoverUploadError(message);
      onUploadError?.(message);
    } finally {
      setIsCoverUploading(false);
    }
  };

  const onDropCover = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && isEditMode) void handleCoverUpload(file);
  };

  const EDGE_RESIZE_HIT_AREA_PX = 18;

  const handleEdgeResizeStart = (e: React.MouseEvent<HTMLDivElement>, block: PortfolioItem) => {
    if (!isEditMode || Boolean(resizing) || e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, button, select, [contenteditable="true"]')) return;

    const edgeThreshold = EDGE_RESIZE_HIT_AREA_PX;
    const rect = e.currentTarget.getBoundingClientRect();
    const nearLeft = e.clientX - rect.left <= edgeThreshold;
    const nearRight = rect.right - e.clientX <= edgeThreshold;
    let nearTop = e.clientY - rect.top <= edgeThreshold;
    let nearBottom = rect.bottom - e.clientY <= edgeThreshold;

    if (block.type === "text") {
      nearTop = false;
      nearBottom = false;
    }

    const nearLeftOrRight = nearLeft || nearRight;
    const nearTopOrBottom = nearTop || nearBottom;

    if (!nearLeftOrRight && !nearTopOrBottom) return;
    const axis = nearLeftOrRight && nearTopOrBottom ? "both" : nearTopOrBottom ? "y" : "x";
    const xHandle = nearLeft ? "left" : "right";
    const yHandle = nearTop ? "top" : "bottom";
    initResize(e, block, axis, xHandle, yHandle);
  };

  const handleEdgeResizeHover = (e: React.MouseEvent<HTMLDivElement>, block: PortfolioItem) => {
    if (!isEditMode || Boolean(resizing)) return;
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, button, select, [contenteditable="true"]')) {
      e.currentTarget.style.cursor = "default";
      return;
    }

    const edgeThreshold = EDGE_RESIZE_HIT_AREA_PX;
    const rect = e.currentTarget.getBoundingClientRect();
    const nearLeft = e.clientX - rect.left <= edgeThreshold;
    const nearRight = rect.right - e.clientX <= edgeThreshold;
    let nearTop = e.clientY - rect.top <= edgeThreshold;
    let nearBottom = rect.bottom - e.clientY <= edgeThreshold;

    if (block.type === "text") {
      nearTop = false;
      nearBottom = false;
    }
    const nearHorizontal = nearLeft || nearRight;
    const nearVertical = nearTop || nearBottom;

    if (nearHorizontal && nearVertical) e.currentTarget.style.cursor = "nwse-resize";
    else if (nearVertical) e.currentTarget.style.cursor = "ns-resize";
    else if (nearHorizontal) e.currentTarget.style.cursor = "ew-resize";
    else e.currentTarget.style.cursor = "default";
  };

  if (selectedNestedPage) {
    return (
      <ProjectDetailView
        project={selectedNestedPage}
        onBack={() => setSelectedNestedPageId(null)}
        onUpdateProject={updated => {
          handleUpdateBlocks(blocks.map(block => (block.id === updated.id ? updated : block)));
        }}
        allowedBlockTypes={allowedBlockTypes}
        maxWidthClassName={maxWidthClassName}
        gridColumns={gridColumns}
        adkHighlights={adkHighlights}
        backLabel="Back"
        hideToolbar={false}
        hideEditModeToggle={hideEditModeToggle}
        isEditMode={isEditMode}
        onToggleEditMode={onToggleEditMode}
        enableSelectionImprove={enableSelectionImprove}
        onTextSelectionChange={onTextSelectionChange}
        selectionImproveSlot={selectionImproveSlot}
        onUploadError={onUploadError}
        isNestedDetailView
      />
    );
  }

  return (
    <div className="scrollbar-on-hover relative h-full flex-1 animate-in overflow-y-auto bg-slate-50 duration-300 slide-in-from-right dark:bg-slate-950">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) void handleCoverUpload(file);
          e.target.value = "";
        }}
      />

      {!hideToolbar && (
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 py-4 px-6 flex items-center justify-between shadow-sm">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-bold bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-full"
          >
            <ArrowLeft size={16} /> {backLabel}
          </button>
          {!hideEditModeToggle ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleEditMode}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.99] ${
                  isEditMode
                    ? "bg-brand-50 text-brand-600 shadow-sm"
                    : "bg-brand-600 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-700"
                }`}
              >
                {isEditMode ? (
                  <>
                    <Eye size={14} /> Preview Mode
                  </>
                ) : (
                  <>
                    <Edit3 size={14} /> Edit Page
                  </>
                )}
              </button>
            </div>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* Nested Hero / Cover */}
      <div
        className="relative h-64 md:h-[400px] w-full bg-slate-100 dark:bg-slate-900 overflow-hidden group/hero"
        onDragOver={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={onDropCover}
      >
        {isEditMode && (
          <div className="absolute top-6 right-6 z-30 opacity-0 group-hover/hero:opacity-100 transition-opacity">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isCoverUploading}
              className="px-5 py-2 bg-white/90 backdrop-blur text-slate-900 rounded-full font-bold text-xs shadow-xl hover:bg-white hover:scale-105 active:scale-95 transition-all border border-slate-200"
            >
              {isCoverUploading ? "Uploading..." : "Update Cover"}
            </button>
          </div>
        )}

        {project.content ? (
          <PortfolioImage src={project.content} alt={project.title || "Project cover"} fill sizes="100vw" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center border-b border-slate-200 dark:border-white/10 border-dashed">
            <span className="text-slate-300 font-bold text-sm flex items-center gap-2">
              <ImageIcon size={20} /> No Cover Image
            </span>
          </div>
        )}
        {coverUploadError && (
          <div className="absolute top-6 left-6 z-30 max-w-sm text-xs font-semibold text-red-600 bg-white/95 dark:bg-slate-900 border border-red-200 rounded-lg px-3 py-2 shadow-lg">
            {coverUploadError}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-8 md:p-16">
          <div className={`${editorMaxWidth} mx-auto w-full group/text`}>
            {isEditMode ? (
              <RichTextEditor
                autoLinkUrls
                value={normalizePortfolioRichTextForRender(project.title || "")}
                onChange={value => onUpdateProject({ ...project, title: value })}
                className={`block w-full bg-transparent text-4xl md:text-6xl font-semibold text-white outline-none mb-2 placeholder:text-white/50 ${PAGE_HERO_RICH_TEXT_CLASSES}`}
                placeholder="Page Title"
                {...selectionEditorProps}
              />
            ) : (
              <h1
                className={`text-4xl md:text-6xl font-black text-white mb-2 leading-tight drop-shadow-md ${PAGE_HERO_RICH_TEXT_CLASSES}`}
                dangerouslySetInnerHTML={{
                  __html: normalizePortfolioRichTextForRender(project.title || "Untitled Page"),
                }}
              />
            )}

            {isEditMode ? (
              <RichTextEditor
                autoLinkUrls
                value={normalizePortfolioRichTextForRender(project.description || "")}
                onChange={value => onUpdateProject({ ...project, description: value })}
                className={`block w-full max-w-2xl resize-none bg-transparent text-xl text-white/80 outline-none placeholder:text-white/40 ${PAGE_HERO_RICH_TEXT_CLASSES}`}
                placeholder="Add a description..."
                {...selectionEditorProps}
              />
            ) : (
              project.description && (
                <p
                  className={`text-xl text-white/80 max-w-2xl leading-relaxed text-balance drop-shadow-md ${PAGE_HERO_RICH_TEXT_CLASSES}`}
                  dangerouslySetInnerHTML={{ __html: normalizePortfolioRichTextForRender(project.description) }}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className={`${editorMaxWidth} mx-auto px-6 py-16 pb-40 min-h-[500px]`} onClick={() => setContextMenu(null)}>
        <div
          ref={gridRef as React.RefObject<HTMLDivElement>}
          className={`grid grid-cols-1 ${gridColumns === 12 ? "md:grid-cols-12" : "md:grid-cols-3"} gap-6 relative`}
        >
          {blocks.map((block, index) => {
            // Text + page-cards size to content. Fixed height on page-cards (e.g. VPD
            // problem tiles at 280px) clips cover+title+subtitle and lets siblings overlap.
            // Tables size to rows (fixed height clips metric grids when rows are added).
            const isContentSizedBlock =
              block.type === "text" || block.type === "page-card" || block.type === "project" || block.type === "table";
            const blockSizeStyle =
              block.height && !isContentSizedBlock
                ? { height: `${block.height}px` }
                : block.height && (block.type === "page-card" || block.type === "project")
                  ? { minHeight: `${block.height}px` }
                  : undefined;

            return (
              <div
                key={block.id}
                style={{
                  gridColumnStart: block.colStart,
                  ...blockSizeStyle,
                }}
                className={`
                ${getSpanClass(block.span)} 
                relative group transition-all duration-300
                ${isEditMode ? "rounded-[2rem]" : ""}
                ${draggedBlockIndex === index ? "opacity-30 scale-[0.98]" : "opacity-100"}
                ${block.type === "link-box" || isContentSizedBlock ? "self-start" : ""}
              `}
              >
                <PortfolioAdkBlockHighlight kind={adkHighlights?.[`page:${project.id}:block:${block.id}`]} className="h-full w-full">
                  <div
                    ref={node => {
                      itemRefs.current[block.id] = node;
                    }}
                    onDragOver={e => handleDragOver(e, index)}
                    onDragEnd={resetDragState}
                    onContextMenu={e => handleContextMenu(e, block.id)}
                    onMouseDown={e => handleEdgeResizeStart(e, block)}
                    onMouseMove={e => handleEdgeResizeHover(e, block)}
                    onMouseLeave={e => {
                      e.currentTarget.style.cursor = "default";
                    }}
                    onMouseUpCapture={() => {
                      dragHandleArmedBlockIdRef.current = null;
                    }}
                    className="w-full relative h-auto"
                  >
                    {/* Block Controls */}
                    {isEditMode && (
                      <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity flex flex-col gap-2 z-30">
                        <div
                          className="p-1.5 cursor-move text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-white/5"
                          draggable={!resizing}
                          onMouseDown={e => {
                            e.stopPropagation();
                            dragHandleArmedBlockIdRef.current = block.id;
                          }}
                          onDragStart={e => handleDragStart(e, index, block.id)}
                          onDragEnd={resetDragState}
                          onMouseUp={() => {
                            dragHandleArmedBlockIdRef.current = null;
                          }}
                        >
                          <GripVertical size={14} />
                        </div>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            requestDeleteBlock(block.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-white/5 transition-colors"
                          title="Delete block"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}

                    <BlockRenderer
                      item={block}
                      isEditMode={isEditMode}
                      onUpdate={handleUpdateBlock}
                      onSelectProject={page => setSelectedNestedPageId(page.id)}
                      isNestedDetailView={isNestedDetailView}
                      enableSelectionImprove={enableSelectionImprove}
                      onTextSelectionChange={onTextSelectionChange}
                      selectionImproveSlot={selectionImproveSlot}
                      onUploadError={onUploadError}
                    />

                    {isEditMode && (
                      <>
                        <div
                          className="absolute inset-y-0 left-0 w-[18px] cursor-ew-resize z-20"
                          onMouseDown={e => initResize(e, block, "x", "left")}
                          title="Resize width"
                        />
                        <div
                          className="absolute inset-y-0 right-0 w-[18px] cursor-ew-resize z-20"
                          onMouseDown={e => initResize(e, block, "x", "right")}
                          title="Resize width"
                        />
                      </>
                    )}
                  </div>
                </PortfolioAdkBlockHighlight>
              </div>
            );
          })}

          {/* Editor Inline Menu */}
          {isEditMode && (
            <div
              className={`col-span-1 ${gridColumns === 12 ? "md:col-span-12" : "md:col-span-3"} mt-8 border-t border-slate-100 dark:border-white/10 pt-8`}
            >
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Plus size={14} /> Add Block
              </h4>
              <div className="flex flex-wrap gap-3">
                {allowedTypes.includes("text") && (
                  <button
                    onClick={() => handleAddBlock("text")}
                    className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm"
                  >
                    <Type size={16} /> Text
                  </button>
                )}
                {allowedTypes.includes("media") && (
                  <button
                    onClick={() => handleAddBlock("media")}
                    className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm"
                  >
                    <ImageIcon size={16} /> Media
                  </button>
                )}
                {allowedTypes.includes("page-card") && (
                  <button
                    onClick={() => handleAddBlock("page-card")}
                    className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm"
                  >
                    <FileText size={16} /> Page
                  </button>
                )}
                {allowedTypes.includes("link-box") && (
                  <button
                    onClick={() => handleAddBlock("link-box")}
                    className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm"
                  >
                    <LinkIcon size={16} /> Link
                  </button>
                )}
                {allowedTypes.includes("table") && (
                  <button
                    onClick={() =>
                      handleAddBlock("table", {
                        title: "Table",
                        content: JSON.stringify([
                          ["Header 1", "Header 2"],
                          ["", ""],
                          ["", ""],
                        ]),
                      })
                    }
                    className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm"
                  >
                    <Table2 size={16} /> Table
                  </button>
                )}
                {allowedTypes.includes("embed") && (
                  <>
                    <button
                      onClick={() => handleAddBlock("embed", { title: "Embed Code", variant: "code" })}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm"
                    >
                      <Code2 size={16} /> Embed Code
                    </button>
                    <button
                      onClick={() => handleAddBlock("embed", { title: "Figma Embed", variant: "figma" })}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm"
                    >
                      <Figma size={16} /> Figma Embed
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && isEditMode && (
        <div
          className="fixed z-[100] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 w-48 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.targetId && (
            <div className="py-1">
              <button
                onClick={() => {
                  handleDuplicateBlock(contextMenu.targetId!);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 font-medium"
              >
                <Copy size={16} /> Duplicate Block
              </button>
              <button
                onClick={() => {
                  requestDeleteBlock(contextMenu.targetId!);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-medium"
              >
                <Trash2 size={16} /> Delete Block
              </button>
            </div>
          )}
        </div>
      )}
      {pendingDeleteBlock && (
        <DeleteBlockConfirmModal
          blockLabel={getPortfolioBlockDeleteLabel(pendingDeleteBlock)}
          onCancel={() => setPendingDeleteBlockId(null)}
          onConfirm={handleConfirmDeleteBlock}
        />
      )}
    </div>
  );
};

export default ProjectDetailView;
