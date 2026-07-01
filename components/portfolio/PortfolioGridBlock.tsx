"use client";

import React, { memo } from "react";
import type { PortfolioHighlightKind } from "@/features/adk-chat/adkPortfolioHighlightDiff";
import type { ContentType, PortfolioItem } from "@/types";
import { motion } from "framer-motion";
import { Code2, Figma, FileText, GripVertical, Image as ImageIcon, Link as LinkIcon, Plus, Table2, Trash2, Type } from "lucide-react";
import BlockRenderer from "../BlockRenderer";
import type { RichTextEditorSelectionInfo } from "../RichTextEditor";
import { PortfolioAdkBlockHighlight } from "./PortfolioAdkBlockHighlight";

type ResizeHandle = "left" | "right";
type ResizeAxis = "x" | "y";
type ResizeYHandle = "top" | "bottom";

export type PortfolioGridBlockProps = {
  item: PortfolioItem;
  index: number;
  isEditMode: boolean;
  isResizingThis: boolean;
  isGridResizing: boolean;
  isDragging: boolean;
  rowSpan: number;
  spanClass: string;
  blockHighlight?: PortfolioHighlightKind;
  isInlineInserterActive: boolean;
  enableSelectionImprove: boolean;
  selectionImproveSlot?: React.ReactNode;
  onItemRef: (id: string, el: HTMLDivElement | null) => void;
  onDragOver: (event: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onContextMenu: (event: React.MouseEvent, targetId: string) => void;
  onDragHandleMouseUp: () => void;
  onEdgeResizeStart: (event: React.MouseEvent<HTMLDivElement>, item: PortfolioItem) => void;
  onEdgeResizeHover: (event: React.MouseEvent<HTMLDivElement>, item: PortfolioItem) => void;
  onUpdate: (id: string, updates: Partial<PortfolioItem>) => void;
  onSelectProject: (project: PortfolioItem) => void;
  onMeasureHeight: (id: string, height: number) => void;
  onTextSelectionChange?: (info: RichTextEditorSelectionInfo | null) => void;
  onRequestDelete: (id: string) => void;
  onDragStart: (event: React.DragEvent, index: number, itemId: string) => void;
  onDragHandleMouseDown: (itemId: string) => void;
  onToggleInlineInserter: (index: number, isActive: boolean) => void;
  onInsertBlockAfter: (index: number, type: ContentType, preset?: Partial<PortfolioItem>) => void;
  initResize: (event: React.MouseEvent, item: PortfolioItem, axis: ResizeAxis, xHandle: ResizeHandle, yHandle?: ResizeYHandle) => void;
};

const PortfolioGridBlockInner: React.FC<PortfolioGridBlockProps> = ({
  item,
  index,
  isEditMode,
  isResizingThis,
  isGridResizing,
  isDragging,
  rowSpan,
  spanClass,
  blockHighlight,
  isInlineInserterActive,
  enableSelectionImprove,
  selectionImproveSlot,
  onItemRef,
  onDragOver,
  onDragEnd,
  onContextMenu,
  onDragHandleMouseUp,
  onEdgeResizeStart,
  onEdgeResizeHover,
  onUpdate,
  onSelectProject,
  onMeasureHeight,
  onTextSelectionChange,
  onRequestDelete,
  onDragStart,
  onDragHandleMouseDown,
  onToggleInlineInserter,
  onInsertBlockAfter,
  initResize,
}) => {
  const inlineInsertOptions: Array<{
    type: ContentType;
    icon: React.ReactNode;
    label: string;
    preset?: Partial<PortfolioItem>;
  }> = [
    { type: "text", icon: <Type size={14} />, label: "Text" },
    { type: "media", icon: <ImageIcon size={14} />, label: "Media" },
    { type: "page-card", icon: <FileText size={14} />, label: "Page" },
    { type: "link-box", icon: <LinkIcon size={14} />, label: "Link" },
    {
      type: "table",
      icon: <Table2 size={14} />,
      label: "Table",
      preset: {
        title: "Table",
        content: JSON.stringify([
          ["Header 1", "Header 2", "Header 3"],
          ["", "", ""],
          ["", "", ""],
        ]),
      },
    },
    {
      type: "embed",
      icon: <Code2 size={14} />,
      label: "Code",
      preset: { title: "Embed Code", variant: "code" as const },
    },
    {
      type: "embed",
      icon: <Figma size={14} />,
      label: "Figma",
      preset: { title: "Figma Embed", variant: "figma" as const },
    },
  ];

  const wrapperClassName = `
    ${spanClass}
    relative ${isResizingThis ? "transition-none" : "transition-all duration-300"}
    ${isEditMode ? "rounded-[2rem]" : ""}
    ${isDragging ? "opacity-30 scale-[0.98]" : "opacity-100"}
  `;

  const wrapperStyle: React.CSSProperties = {
    gridColumnStart: item.colStart,
    gridRowEnd: `span ${rowSpan}`,
    height: "100%",
    overflow: "visible",
  };

  const blockBody = (
    <PortfolioAdkBlockHighlight kind={blockHighlight} className="h-full w-full">
      <div
        className="relative w-full h-full group/block"
        onMouseDown={e => onEdgeResizeStart(e, item)}
        onMouseMove={e => onEdgeResizeHover(e, item)}
        onMouseLeave={e => {
          e.currentTarget.style.cursor = "default";
        }}
      >
        {isEditMode && (
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover/block:opacity-100 group-hover/block:pointer-events-auto transition-opacity flex flex-col gap-2 z-30">
            <div
              className="p-1.5 cursor-move text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-white/5"
              draggable={!isGridResizing}
              onMouseDown={e => {
                e.stopPropagation();
                onDragHandleMouseDown(item.id);
              }}
              onDragStart={e => onDragStart(e, index, item.id)}
              onDragEnd={onDragEnd}
              title="Move block"
            >
              <GripVertical size={14} />
            </div>

            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onRequestDelete(item.id);
              }}
              className="p-1.5 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-white/5 transition-colors"
              title="Delete block"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
        <BlockRenderer
          item={item}
          isEditMode={isEditMode}
          onUpdate={onUpdate}
          onSelectProject={onSelectProject}
          onMeasureCollapsedHeight={onMeasureHeight}
          onMeasureContentHeight={onMeasureHeight}
          enableSelectionImprove={enableSelectionImprove}
          onTextSelectionChange={onTextSelectionChange}
          selectionImproveSlot={selectionImproveSlot}
        />
        {isEditMode && (
          <>
            <div
              style={{ overflow: "visible", pointerEvents: "auto" }}
              className={`absolute -bottom-5 left-0 right-0 flex h-10 items-center justify-center transition-opacity duration-150 ${
                isInlineInserterActive ? "z-[60]" : "z-30"
              } ${isInlineInserterActive ? "opacity-100" : "opacity-0 hover:opacity-100"}`}
            >
              <div className="absolute inset-x-4 top-1/2 h-[2px] rounded-full bg-brand-400/40" />
              <button
                type="button"
                onMouseDown={e => e.stopPropagation()}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleInlineInserter(index, isInlineInserterActive);
                }}
                className={`relative flex h-7 w-7 items-center justify-center rounded-full border shadow-md transition-all ${
                  isInlineInserterActive ? "z-[61]" : "z-[31]"
                } ${
                  isInlineInserterActive
                    ? "scale-110 border-brand-500 bg-brand-500 text-white"
                    : "border-slate-200 bg-white text-slate-400 hover:scale-110 hover:border-brand-400 hover:text-brand-600 dark:border-white/10 dark:bg-slate-800"
                }`}
              >
                <Plus size={15} />
              </button>
              {isInlineInserterActive ? (
                <div
                  className="absolute left-1/2 top-full z-50 mt-2 flex w-max max-w-[90vw] flex-row items-center gap-1.5 overflow-x-auto rounded-full border border-slate-100 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-slate-900"
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                >
                  {inlineInsertOptions.map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onInsertBlockAfter(index, opt.type, opt.preset);
                      }}
                      className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {isInlineInserterActive ? (
              <div
                className="fixed inset-0 z-[59]"
                onClick={e => {
                  e.stopPropagation();
                  onToggleInlineInserter(index, true);
                }}
              />
            ) : null}
          </>
        )}

        {isEditMode && (
          <>
            <div
              className="absolute inset-y-0 left-0 w-[18px] cursor-ew-resize z-20"
              onMouseDown={e => initResize(e, item, "x", "left")}
              title="Resize width"
            />
            <div
              className="absolute inset-y-0 right-0 w-[18px] cursor-ew-resize z-20"
              onMouseDown={e => initResize(e, item, "x", "right")}
              title="Resize width"
            />
            {item.type !== "table" && (
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[60%] flex flex-col items-center gap-0.5 cursor-ns-resize opacity-0 group-hover/block:opacity-100 transition-all duration-150 z-30 hover:scale-110"
                onMouseDown={e => {
                  e.stopPropagation();
                  initResize(e, item, "y", "right", "bottom");
                }}
                title="Drag to resize height"
              >
                <div className="w-10 h-1.5 bg-brand-400/70 hover:bg-brand-500 dark:bg-brand-500/60 rounded-full shadow-sm transition-colors" />
              </div>
            )}
          </>
        )}
      </div>
    </PortfolioAdkBlockHighlight>
  );

  const sharedProps = {
    ref: (el: HTMLDivElement | null) => onItemRef(item.id, el),
    onDragOver: (e: React.DragEvent) => onDragOver(e, index),
    onDragEnd,
    onContextMenu: (e: React.MouseEvent) => onContextMenu(e, item.id),
    onMouseUpCapture: onDragHandleMouseUp,
    className: wrapperClassName,
    style: wrapperStyle,
  };

  return <motion.div {...sharedProps}>{blockBody}</motion.div>;
};

const arePortfolioGridBlockPropsEqual = (prev: PortfolioGridBlockProps, next: PortfolioGridBlockProps) =>
  prev.item === next.item &&
  prev.index === next.index &&
  prev.isEditMode === next.isEditMode &&
  prev.isResizingThis === next.isResizingThis &&
  prev.isGridResizing === next.isGridResizing &&
  prev.isDragging === next.isDragging &&
  prev.rowSpan === next.rowSpan &&
  prev.spanClass === next.spanClass &&
  prev.blockHighlight === next.blockHighlight &&
  prev.isInlineInserterActive === next.isInlineInserterActive &&
  prev.enableSelectionImprove === next.enableSelectionImprove &&
  prev.selectionImproveSlot === next.selectionImproveSlot;

export const PortfolioGridBlock = memo(PortfolioGridBlockInner, arePortfolioGridBlockPropsEqual);
