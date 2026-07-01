import { useState, useRef, useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { MAX_PORTFOLIO_ITEM_HEIGHT_PX } from "@/features/portfolio/constants/portfolioLayout";
import { ColumnSpan, PortfolioItem } from "../types";

export const useGridResize = (
  items: PortfolioItem[],
  setItems: Dispatch<SetStateAction<PortfolioItem[]>>,
  blockRefs?: MutableRefObject<Record<string, HTMLElement | null>>
) => {
  const [resizing, setResizing] = useState<{
    id: string;
    axis: "x" | "y" | "both";
    xHandle: "left" | "right";
    yHandle: "top" | "bottom";
    startX: number;
    startY: number;
    startSpan: number;
    startCol: number;
    startHeight: number;
    contentMinHeight: number;
  } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing || !gridRef.current) return;

      let nextSpan = resizing.startSpan;
      let nextCol = resizing.startCol;
      let nextHeight = resizing.startHeight;

      const staticFloor = 80;
      const minHeight = Math.max(staticFloor, resizing.contentMinHeight);

      if (resizing.axis === "x" || resizing.axis === "both") {
        const gridWidth = gridRef.current.offsetWidth;
        let columns = 3;
        try {
          const template = window.getComputedStyle(gridRef.current).gridTemplateColumns;
          const parsed = template.split(" ").filter(Boolean).length;
          if (parsed >= 1) columns = parsed;
        } catch {
          // ignore
        }
        const oneColWidth = gridWidth / columns;
        const deltaX = e.clientX - resizing.startX;
        const colShift = Math.round(deltaX / oneColWidth);

        if (resizing.xHandle === "left") {
          const rightEdge = resizing.startCol + resizing.startSpan - 1;
          const nextColStart = Math.max(1, Math.min(rightEdge, resizing.startCol + colShift));
          nextCol = nextColStart;
          nextSpan = Math.max(1, rightEdge - nextColStart + 1);
        } else {
          const spanChange = Math.round(deltaX / oneColWidth);
          const maxSpan = Math.max(1, columns - resizing.startCol + 1);
          nextSpan = Math.max(1, Math.min(maxSpan, resizing.startSpan + spanChange));
          nextCol = resizing.startCol;
        }
      }

      if (resizing.axis === "y" || resizing.axis === "both") {
        const deltaY = e.clientY - resizing.startY;
        if (resizing.yHandle === "top") {
          nextHeight = Math.max(minHeight, Math.min(MAX_PORTFOLIO_ITEM_HEIGHT_PX, resizing.startHeight - deltaY));
        } else {
          nextHeight = Math.max(minHeight, Math.min(MAX_PORTFOLIO_ITEM_HEIGHT_PX, resizing.startHeight + deltaY));
        }
      }

      setItems(prev =>
        prev.map(item => {
          if (item.id !== resizing.id) return item;
          const shouldResizeWidth = resizing.axis === "x" || resizing.axis === "both";
          const shouldResizeHeight = resizing.axis === "y" || resizing.axis === "both";
          const widthChanged = shouldResizeWidth && item.span !== nextSpan;
          const colChanged = shouldResizeWidth && (item.colStart ?? resizing.startCol) !== nextCol;
          const heightChanged = shouldResizeHeight && (item.height ?? resizing.startHeight) !== nextHeight;
          if (!widthChanged && !heightChanged && !colChanged) return item;
          return {
            ...item,
            span: shouldResizeWidth ? (nextSpan as ColumnSpan) : item.span,
            colStart: shouldResizeWidth ? nextCol : item.colStart,
            height: shouldResizeHeight ? nextHeight : item.height,
            heightUserSet: shouldResizeHeight ? true : item.heightUserSet,
          };
        })
      );
    };

    const handleMouseUp = () => {
      setResizing(null);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    if (resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = resizing.axis === "y" ? "ns-resize" : resizing.axis === "both" ? "nwse-resize" : "ew-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
  }, [resizing, items, setItems]);

  const initResize = (
    e: React.MouseEvent,
    item: PortfolioItem,
    axis: "x" | "y" | "both" = "x",
    xHandle: "left" | "right" = "right",
    yHandle: "top" | "bottom" = "bottom"
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.button !== 0) return;

    let startCol = Math.max(1, item.colStart ?? 1);
    try {
      const style = window.getComputedStyle(e.currentTarget as HTMLElement);
      const parsedStart = Number.parseInt(style.gridColumnStart, 10);
      if (Number.isFinite(parsedStart) && parsedStart > 0) startCol = parsedStart;
    } catch {
      // ignore
    }

    const contentMinHeight = 80;
    let actualHeight = item.height ?? 220;

    if (!["media", "link-box", "embed"].includes(item.type)) {
      const blockEl = blockRefs?.current?.[item.id];
      if (blockEl) {
        if (item.height === undefined) {
          actualHeight = blockEl.offsetHeight;
        }
      }
    }

    setResizing({
      id: item.id,
      axis,
      xHandle,
      yHandle,
      startX: e.clientX,
      startY: e.clientY,
      startSpan: item.span,
      startCol,
      startHeight: actualHeight,
      contentMinHeight,
    });
  };

  return { gridRef, resizing, initResize };
};
