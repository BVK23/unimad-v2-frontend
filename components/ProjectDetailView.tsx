import React, { useEffect, useState, useRef, type SetStateAction } from "react";
import { HeroMediaPickerDialog } from "@/components/shared/HeroMediaPickerDialog";
import type { PortfolioHighlightMap } from "@/features/adk-chat/adkPortfolioHighlightDiff";
import { optimisticDeleteMedia } from "@/features/media/utils/optimistic-delete-media";
import { getPortfolioBlockDeleteLabel } from "@/features/portfolio/utils/getPortfolioBlockDeleteLabel";
import { isReadOnlyPortfolioBlockVisible } from "@/features/portfolio/utils/isReadOnlyPortfolioBlockVisible";
import {
  normalizePortfolioRichTextForRender,
  wrapPortfolioTitleWithHeadingLevel,
  extractTitleHeadingLevel,
} from "@/features/portfolio/utils/portfolio-html";
import {
  formatPortfolioUploadError,
  logPortfolioUploadError,
  logPortfolioUploadStart,
  logPortfolioUploadSuccess,
} from "@/features/portfolio/utils/portfolioUploadLog";
import { MEDIA_CATEGORY, uploadPortfolioFile } from "@/features/portfolio/utils/upload";
import { VPD_TITLE_MAX_CHARS } from "@/features/vpd/constants/title";
import { htmlToPlainText } from "@/utils/html-to-text";
import {
  ArrowLeft,
  Trash2,
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
  Pencil,
} from "lucide-react";
import { useGridResize } from "../hooks/useGridResize";
import { PortfolioItem, ContentType } from "../types";
import RichTextEditor, { type RichTextEditorSelectionInfo } from "./RichTextEditor";
import DeleteBlockConfirmModal from "./portfolio/DeleteBlockConfirmModal";
import { PortfolioGridBlock } from "./portfolio/PortfolioGridBlock";
import PortfolioImage from "./portfolio/PortfolioImage";

const PAGE_HERO_RICH_TEXT_CLASSES =
  "[&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_p]:inline [&_br]:block [&_a]:text-brand-200 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-white";

const PAGE_BANNER_RICH_TEXT_CLASSES =
  "[&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_p]:m-0 [&_br]:block [&_a]:text-brand-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-brand-700";

/** Stable heading sizes so H1/H2/H3 don't jump the title layout. Default visual weight matches H2. */
const PAGE_BANNER_TITLE_CLASSES = `${PAGE_BANNER_RICH_TEXT_CLASSES} min-h-[2.5rem] text-3xl font-semibold leading-tight text-slate-900 md:text-4xl dark:text-white [&_h1]:m-0 [&_h1]:block [&_h1]:text-4xl [&_h1]:leading-tight md:[&_h1]:text-5xl [&_h2]:m-0 [&_h2]:block [&_h2]:text-3xl [&_h2]:leading-tight md:[&_h2]:text-4xl [&_h3]:m-0 [&_h3]:block [&_h3]:text-2xl [&_h3]:leading-tight md:[&_h3]:text-3xl`;

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
  /** Hide Preview Mode / Edit Page toggle (e.g. published read-only). Nested page cards still show it when editable. */
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
  /** When true, force read-only: no edit toggle, no mutations UI. */
  isReadOnly?: boolean;
  /**
   * `hero` — full-bleed cover with title overlay (portfolio nested pages).
   * `banner` — portfolio-style max-width cover with upload/reposition (VPD document canvas).
   */
  coverLayout?: "hero" | "banner";
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
  isReadOnly = false,
  coverLayout = "hero",
}) => {
  const [uncontrolledEditMode, setUncontrolledEditMode] = useState(true);
  const isEditMode = isReadOnly ? false : (isEditModeProp ?? uncontrolledEditMode);
  const handleToggleEditMode = isReadOnly ? () => {} : (onToggleEditMode ?? (() => setUncontrolledEditMode(prev => !prev)));
  const suppressEditToggle = hideEditModeToggle || isReadOnly;

  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId?: string } | null>(null);
  const [pendingDeleteBlockId, setPendingDeleteBlockId] = useState<string | null>(null);
  const [selectedNestedPageId, setSelectedNestedPageId] = useState<string | null>(null);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isIconUploading, setIsIconUploading] = useState(false);
  const [isRepositioningCover, setIsRepositioningCover] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [tempCoverPos, setTempCoverPos] = useState<{ x: number; y: number }>(() => project.coverPosition ?? { x: 50, y: 50 });
  const [inlineInserterIndex, setInlineInserterIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const coverBannerRef = useRef<HTMLDivElement>(null);
  const coverDragStateRef = useRef<{ x: number; y: number } | null>(null);
  const coverRepositionBaselineRef = useRef<{ x: number; y: number } | null>(null);
  const tempCoverPosRef = useRef(tempCoverPos);
  const dragHandleArmedBlockIdRef = useRef<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const useBannerCover = coverLayout === "banner";
  const coverVisible = project.showCoverImage !== false;
  const coverPosition = project.coverPosition ?? { x: 50, y: 50 };

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
  const renderBlocks = isEditMode ? blocks : blocks.filter(isReadOnlyPortfolioBlockVisible);
  const allowedTypes: ContentType[] = (allowedBlockTypes || ["text", "media", "page-card", "link-box", "table", "embed"]).filter(
    type => !(isNestedDetailView && (type === "page-card" || type === "project"))
  );
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

  useEffect(() => {
    if (isRepositioningCover) return;
    setTempCoverPos(project.coverPosition ?? { x: 50, y: 50 });
  }, [isRepositioningCover, project.coverPosition]);

  useEffect(() => {
    tempCoverPosRef.current = tempCoverPos;
  }, [tempCoverPos]);

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
    if (isNestedDetailView && (type === "page-card" || type === "project")) {
      setContextMenu(null);
      return;
    }
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

  const handleInsertBlockAfter = (index: number, type: ContentType, preset?: Partial<PortfolioItem>) => {
    if (isNestedDetailView && (type === "page-card" || type === "project")) {
      setInlineInserterIndex(null);
      return;
    }
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
      type,
      content: "",
      span: getDefaultSpanForType(type),
      detailedBlocks: [],
      ...preset,
    };
    const next = [...blocks];
    next.splice(index + 1, 0, newBlock);
    handleUpdateBlocks(next);
    setInlineInserterIndex(null);
  };

  const handleIconUpload = async (file: File) => {
    setCoverUploadError(null);
    setIsIconUploading(true);
    logPortfolioUploadStart("page-icon", file, { pageId: project.id, pageTitle: project.title });
    try {
      const uploaded = await uploadPortfolioFile(file, MEDIA_CATEGORY.DOCUMENT_ICON);
      onUpdateProject({ ...project, iconUrl: uploaded.url });
      logPortfolioUploadSuccess("page-icon", uploaded.url, { pageId: project.id });
    } catch (error) {
      const message = formatPortfolioUploadError(error, "Could not upload icon. Try a JPG/PNG/GIF under 4MB.");
      logPortfolioUploadError("page-icon", error, { pageId: project.id, pageTitle: project.title });
      setCoverUploadError(message);
      onUploadError?.(message);
    } finally {
      setIsIconUploading(false);
    }
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
    const block = blocks.find(b => b.id === pendingDeleteBlockId);
    if (block) {
      for (const url of [block.content, block.canvasCover, block.iconUrl]) {
        if (typeof url === "string" && url.trim()) optimisticDeleteMedia(url);
      }
    }
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
      const uploaded = await uploadPortfolioFile(file, MEDIA_CATEGORY.COVER_PICTURE);
      const initialPos = { x: 50, y: 50 };
      onUpdateProject({
        ...project,
        content: uploaded.url,
        showCoverImage: true,
        coverPosition: initialPos,
      });
      coverRepositionBaselineRef.current = initialPos;
      setTempCoverPos(initialPos);
      if (useBannerCover) setIsRepositioningCover(true);
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

  const clampCoverPos = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const beginCoverReposition = (position: { x: number; y: number }) => {
    coverRepositionBaselineRef.current = project.coverPosition ?? { x: 50, y: 50 };
    setTempCoverPos(position);
    setIsRepositioningCover(true);
  };

  const handleRepositionCover = () => {
    if (!project.content?.trim()) return;
    beginCoverReposition(project.coverPosition ?? { x: 50, y: 50 });
  };

  const handleBannerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isRepositioningCover) return;
    e.preventDefault();
    coverDragStateRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBannerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isRepositioningCover || !coverDragStateRef.current || !coverBannerRef.current) return;
    const rect = coverBannerRef.current.getBoundingClientRect();
    const dx = e.clientX - coverDragStateRef.current.x;
    const dy = e.clientY - coverDragStateRef.current.y;
    coverDragStateRef.current = { x: e.clientX, y: e.clientY };
    const pctDx = (dx / Math.max(1, rect.width)) * 100;
    const pctDy = (dy / Math.max(1, rect.height)) * 100;
    setTempCoverPos(prev => ({
      x: clampCoverPos(prev.x - pctDx, 0, 100),
      y: clampCoverPos(prev.y - pctDy, 0, 100),
    }));
  };

  const handleBannerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    coverDragStateRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (isRepositioningCover) {
      onUpdateProject({ ...project, coverPosition: tempCoverPosRef.current });
    }
  };

  const handleSaveCoverLayout = () => {
    onUpdateProject({ ...project, coverPosition: tempCoverPosRef.current });
    coverRepositionBaselineRef.current = null;
    setIsRepositioningCover(false);
  };

  const handleCancelCoverReposition = () => {
    const baseline = coverRepositionBaselineRef.current ?? project.coverPosition ?? { x: 50, y: 50 };
    onUpdateProject({ ...project, coverPosition: baseline });
    setTempCoverPos(baseline);
    coverRepositionBaselineRef.current = null;
    setIsRepositioningCover(false);
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
          if (isReadOnly) return;
          handleUpdateBlocks(blocks.map(block => (block.id === updated.id ? updated : block)));
        }}
        allowedBlockTypes={allowedBlockTypes}
        maxWidthClassName={maxWidthClassName}
        gridColumns={gridColumns}
        adkHighlights={adkHighlights}
        backLabel="Back"
        hideToolbar={false}
        // Page interiors match Portfolio: hero cover (title/description on image), no VPD root icon row.
        hideEditModeToggle={isReadOnly}
        isEditMode={isEditMode}
        onToggleEditMode={isReadOnly ? undefined : onToggleEditMode}
        enableSelectionImprove={!isReadOnly && enableSelectionImprove}
        onTextSelectionChange={onTextSelectionChange}
        selectionImproveSlot={selectionImproveSlot}
        onUploadError={onUploadError}
        isNestedDetailView
        isReadOnly={isReadOnly}
        coverLayout="hero"
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
      <input
        ref={iconInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) void handleIconUpload(file);
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
          {!suppressEditToggle ? (
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

      {/* Cover + title */}
      {useBannerCover ? (
        <div className={`${editorMaxWidth} mx-auto w-full px-4 pt-6 md:px-6`}>
          {isEditMode && !coverVisible ? (
            <button
              type="button"
              onClick={() => onUpdateProject({ ...project, showCoverImage: true })}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-4 text-sm font-medium text-slate-400 transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-white/10"
            >
              <ImageIcon size={16} /> Show Cover Image
            </button>
          ) : null}

          {coverVisible ? (
            <div
              ref={coverBannerRef}
              className={`group/hero relative aspect-[4/1] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/5 dark:bg-slate-900 ${
                isRepositioningCover ? "ring-2 ring-brand-500/60 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950" : ""
              }`}
              onDragOver={e => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={onDropCover}
            >
              {project.content ? (
                <PortfolioImage
                  src={project.content}
                  alt={project.title || "Project cover"}
                  fill
                  sizes="(max-width: 768px) 100vw, 1280px"
                  className={`object-cover ${isRepositioningCover ? "cursor-grab select-none active:cursor-grabbing" : ""}`}
                  style={{
                    objectPosition: `${(isRepositioningCover ? tempCoverPos : coverPosition).x}% ${(isRepositioningCover ? tempCoverPos : coverPosition).y}%`,
                  }}
                  onPointerDown={isRepositioningCover ? handleBannerPointerDown : undefined}
                  onPointerMove={isRepositioningCover ? handleBannerPointerMove : undefined}
                  onPointerUp={isRepositioningCover ? handleBannerPointerUp : undefined}
                  onPointerCancel={isRepositioningCover ? handleBannerPointerUp : undefined}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-400">No Cover Image</div>
              )}

              {isEditMode && !isRepositioningCover ? (
                <div className="absolute inset-0 z-10 hidden items-center justify-center gap-4 bg-black/40 backdrop-blur-sm transition-all group-hover/hero:flex">
                  <button
                    type="button"
                    onClick={() => setCoverPickerOpen(true)}
                    disabled={isCoverUploading}
                    className="rounded-full bg-white px-6 py-2 text-sm font-medium text-slate-900 shadow-xl transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                  >
                    {isCoverUploading ? "Uploading..." : project.content ? "Update Cover" : "Upload Cover"}
                  </button>
                  {project.content ? (
                    <button
                      type="button"
                      onClick={handleRepositionCover}
                      className="rounded-full bg-white px-6 py-2 text-sm font-medium text-slate-900 shadow-xl transition-transform hover:scale-105 active:scale-95"
                    >
                      Reposition Cover
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onUpdateProject({ ...project, showCoverImage: false })}
                    className="rounded-full bg-red-500 p-2.5 text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
                    title="Hide Cover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : null}

              {isEditMode && isRepositioningCover ? (
                <>
                  <p className="absolute left-4 top-3 z-20 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm">
                    Drag to reposition your cover
                  </p>
                  <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelCoverReposition}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/55"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCoverLayout}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-100"
                    >
                      Save Layout
                    </button>
                  </div>
                </>
              ) : null}

              {coverUploadError ? (
                <div className="absolute left-4 top-4 z-30 max-w-sm rounded-lg border border-red-200 bg-white/95 px-3 py-2 text-xs font-semibold text-red-600 shadow-lg dark:bg-slate-900">
                  {coverUploadError}
                </div>
              ) : null}
            </div>
          ) : null}

          <div
            className={`relative mb-2 flex items-end gap-4 pl-5 md:pl-6 ${
              coverVisible && (project.iconUrl || isEditMode) ? "-mt-10" : "mt-4"
            }`}
          >
            {(project.iconUrl || isEditMode) && (
              <div className="relative z-10 shrink-0">
                {project.iconUrl ? (
                  <div className="group/icon relative h-24 w-24 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 md:h-28 md:w-28">
                    <PortfolioImage src={project.iconUrl} alt="VPD icon" fill sizes="112px" className="object-cover" />
                    {isEditMode ? (
                      <div className="absolute inset-0 hidden items-center justify-center gap-1.5 bg-black/45 group-hover/icon:flex">
                        <button
                          type="button"
                          onClick={() => iconInputRef.current?.click()}
                          disabled={isIconUploading}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm transition-transform hover:scale-105"
                          title="Change icon"
                          aria-label="Change icon"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (project.iconUrl) optimisticDeleteMedia(project.iconUrl);
                            onUpdateProject({ ...project, iconUrl: "" });
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-transform hover:scale-105"
                          title="Remove icon"
                          aria-label="Remove icon"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : isEditMode ? (
                  <button
                    type="button"
                    onClick={() => iconInputRef.current?.click()}
                    disabled={isIconUploading}
                    className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-300 bg-white/80 text-slate-400 transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-white/15 dark:bg-slate-900/60 md:h-28 md:w-28"
                    title="Add company or job icon"
                  >
                    <ImageIcon size={20} />
                    <span className="text-[9px] font-medium uppercase tracking-wide">Icon</span>
                  </button>
                ) : null}
              </div>
            )}

            <div className="group/text min-w-0 flex-1 pb-0.5 pt-3">
              {isEditMode ? (
                <RichTextEditor
                  autoLinkUrls
                  toolbarVariant="title"
                  value={normalizePortfolioRichTextForRender(
                    extractTitleHeadingLevel(project.title || "")
                      ? project.title || ""
                      : wrapPortfolioTitleWithHeadingLevel(project.title || "", "h2")
                  )}
                  onChange={value => {
                    if (htmlToPlainText(value).length > VPD_TITLE_MAX_CHARS) return;
                    onUpdateProject({ ...project, title: value });
                  }}
                  className={`block w-full bg-transparent outline-none placeholder:text-slate-400 ${PAGE_BANNER_TITLE_CLASSES}`}
                  placeholder="Page Title"
                  {...selectionEditorProps}
                />
              ) : (
                <div
                  className={PAGE_BANNER_TITLE_CLASSES}
                  dangerouslySetInnerHTML={{
                    __html: normalizePortfolioRichTextForRender(
                      extractTitleHeadingLevel(project.title || "")
                        ? project.title || "Untitled Page"
                        : wrapPortfolioTitleWithHeadingLevel(project.title || "Untitled Page", "h2")
                    ),
                  }}
                />
              )}

              {/* Description field intentionally disabled for VPD banner layout.
              {isEditMode ? (
                <RichTextEditor ... placeholder="Add a description..." />
              ) : (
                project.description && <p>...</p>
              )}
              */}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="group/hero relative h-64 w-full overflow-hidden bg-slate-100 dark:bg-slate-900 md:h-[400px]"
          onDragOver={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={onDropCover}
        >
          {isEditMode && (
            <div className="absolute right-6 top-6 z-30 opacity-0 transition-opacity group-hover/hero:opacity-100">
              <button
                type="button"
                onClick={() => setCoverPickerOpen(true)}
                disabled={isCoverUploading}
                className="rounded-full border border-slate-200 bg-white/90 px-5 py-2 text-xs font-bold text-slate-900 shadow-xl backdrop-blur transition-all hover:scale-105 hover:bg-white active:scale-95"
              >
                {isCoverUploading ? "Uploading..." : "Update Cover"}
              </button>
            </div>
          )}

          {project.content ? (
            <PortfolioImage src={project.content} alt={project.title || "Project cover"} fill sizes="100vw" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center border-b border-dashed border-slate-200 dark:border-white/10">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-300">
                <ImageIcon size={20} /> No Cover Image
              </span>
            </div>
          )}
          {coverUploadError && (
            <div className="absolute left-6 top-6 z-30 max-w-sm rounded-lg border border-red-200 bg-white/95 px-3 py-2 text-xs font-semibold text-red-600 shadow-lg dark:bg-slate-900">
              {coverUploadError}
            </div>
          )}

          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-8 md:p-16">
            <div className={`${editorMaxWidth} group/text mx-auto w-full`}>
              {isEditMode ? (
                <RichTextEditor
                  autoLinkUrls
                  value={normalizePortfolioRichTextForRender(project.title || "")}
                  onChange={value => onUpdateProject({ ...project, title: value })}
                  className={`mb-2 block w-full bg-transparent text-4xl font-semibold text-white outline-none placeholder:text-white/50 md:text-6xl ${PAGE_HERO_RICH_TEXT_CLASSES}`}
                  placeholder="Page Title"
                  {...selectionEditorProps}
                />
              ) : (
                <h1
                  className={`mb-2 text-4xl font-black leading-tight text-white drop-shadow-md md:text-6xl ${PAGE_HERO_RICH_TEXT_CLASSES}`}
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
                    className={`max-w-2xl text-balance text-xl leading-relaxed text-white/80 drop-shadow-md ${PAGE_HERO_RICH_TEXT_CLASSES}`}
                    dangerouslySetInnerHTML={{ __html: normalizePortfolioRichTextForRender(project.description) }}
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid Container */}
      <div
        className={`${editorMaxWidth} mx-auto min-h-[500px] px-6 ${useBannerCover ? "py-6" : "py-16"} pb-40`}
        onClick={() => {
          setContextMenu(null);
          setInlineInserterIndex(null);
        }}
      >
        <div
          ref={gridRef as React.RefObject<HTMLDivElement>}
          className={`grid grid-cols-1 ${gridColumns === 12 ? "md:grid-cols-12" : "md:grid-cols-3"} gap-6 relative`}
        >
          {renderBlocks.map((block, index) => (
            <PortfolioGridBlock
              key={block.id}
              item={block}
              index={index}
              isEditMode={isEditMode}
              isResizingThis={resizing?.id === block.id}
              isGridResizing={Boolean(resizing)}
              isDragging={draggedBlockIndex === index}
              rowSpan={1}
              spanClass={getSpanClass(block.span)}
              blockHighlight={adkHighlights?.[`page:${project.id}:block:${block.id}`]}
              isInlineInserterActive={inlineInserterIndex === index}
              enableSelectionImprove={enableSelectionImprove}
              onTextSelectionChange={onTextSelectionChange}
              selectionImproveSlot={selectionImproveSlot}
              allowedBlockTypes={allowedTypes}
              isNestedDetailView={isNestedDetailView}
              heightMode="explicit"
              onItemRef={(id, el) => {
                itemRefs.current[id] = el;
              }}
              onDragOver={handleDragOver}
              onDragEnd={resetDragState}
              onContextMenu={handleContextMenu}
              onDragHandleMouseUp={() => {
                dragHandleArmedBlockIdRef.current = null;
              }}
              onEdgeResizeStart={handleEdgeResizeStart}
              onEdgeResizeHover={handleEdgeResizeHover}
              onUpdate={handleUpdateBlock}
              onSelectProject={page => setSelectedNestedPageId(page.id)}
              onMeasureHeight={() => {}}
              onRequestDelete={requestDeleteBlock}
              onDragStart={handleDragStart}
              onDragHandleMouseDown={itemId => {
                dragHandleArmedBlockIdRef.current = itemId;
              }}
              onToggleInlineInserter={(idx, isActive) => {
                setInlineInserterIndex(isActive ? null : idx);
              }}
              onInsertBlockAfter={handleInsertBlockAfter}
              initResize={initResize}
              onUploadError={onUploadError}
            />
          ))}

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
      <HeroMediaPickerDialog
        open={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        kind="cover-picture"
        currentUrl={project.content}
        onSelectUrl={url => {
          const initialPos = project.coverPosition ?? { x: 50, y: 50 };
          onUpdateProject({
            ...project,
            content: url,
            showCoverImage: true,
            coverPosition: initialPos,
          });
          if (useBannerCover) {
            coverRepositionBaselineRef.current = initialPos;
            setTempCoverPos(initialPos);
            setIsRepositioningCover(true);
          }
        }}
      />
    </div>
  );
};

export default ProjectDetailView;
