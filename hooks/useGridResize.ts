import { useState, useRef, useEffect, type Dispatch, type SetStateAction } from "react";
import { ColumnSpan, PortfolioItem } from "../types";

type ResizeSession = {
  id: string;
  axis: "x" | "y" | "both";
  xHandle: "left" | "right";
  startX: number;
  startY: number;
  startSpan: number;
  startCol: number;
  startHeight: number;
};

export const useGridResize = (_items: PortfolioItem[], setItems: Dispatch<SetStateAction<PortfolioItem[]>>) => {
  const [resizing, setResizing] = useState<ResizeSession | null>(null);
  const resizingRef = useRef<ResizeSession | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resizingRef.current = resizing;
  }, [resizing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const session = resizingRef.current;
      if (!session || !gridRef.current) return;

      setItems(prev => {
        const targetItem = prev.find(i => i.id === session.id);
        if (!targetItem) return prev;

        let nextSpan = session.startSpan;
        let nextCol = session.startCol;
        let nextHeight = session.startHeight;
        const minHeight = targetItem.type === "link-box" || targetItem.type === "text" ? 36 : 96;

        if (session.axis === "x" || session.axis === "both") {
          const gridWidth = gridRef.current!.offsetWidth;
          let columns = 3;

          try {
            const template = window.getComputedStyle(gridRef.current!).gridTemplateColumns;
            const parsed = template.split(" ").filter(Boolean).length;
            if (parsed >= 1) columns = parsed;
          } catch {
            // Keep fallback
          }

          const oneColWidth = gridWidth / columns;
          const deltaX = e.clientX - session.startX;
          const colShift = Math.round(deltaX / oneColWidth);

          if (session.xHandle === "left") {
            const rightEdge = session.startCol + session.startSpan - 1;
            const nextColStart = Math.max(1, Math.min(rightEdge, session.startCol + colShift));
            nextCol = nextColStart;
            nextSpan = Math.max(1, rightEdge - nextColStart + 1);
          } else {
            const spanChange = Math.round(deltaX / oneColWidth);
            const maxSpan = Math.max(1, columns - session.startCol + 1);
            nextSpan = Math.max(1, Math.min(maxSpan, session.startSpan + spanChange));
            nextCol = session.startCol;
          }
        }

        if (session.axis === "y" || session.axis === "both") {
          const deltaY = e.clientY - session.startY;
          nextHeight = Math.max(minHeight, Math.min(1200, session.startHeight + deltaY));
        }

        const shouldResizeWidth = session.axis === "x" || session.axis === "both";
        const shouldResizeHeight = session.axis === "y" || session.axis === "both";
        const storedHeight = targetItem.height ?? session.startHeight;
        const widthChanged = shouldResizeWidth && targetItem.span !== nextSpan;
        const colChanged = shouldResizeWidth && (targetItem.colStart ?? session.startCol) !== nextCol;
        const heightChanged = shouldResizeHeight && storedHeight !== nextHeight;

        if (!widthChanged && !heightChanged && !colChanged) return prev;

        return prev.map(item => {
          if (item.id !== session.id) return item;

          return {
            ...item,
            span: shouldResizeWidth ? (nextSpan as ColumnSpan) : item.span,
            colStart: shouldResizeWidth ? nextCol : item.colStart,
            height: shouldResizeHeight ? nextHeight : item.height,
          };
        });
      });
    };

    const handleMouseUp = () => {
      const ended = resizingRef.current;
      if (ended && (ended.axis === "y" || ended.axis === "both")) {
        setItems(current => current.map(item => (item.id === ended.id ? { ...item, heightUserSet: true } : item)));
      }
      setResizing(null);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    if (!resizing) return;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = resizing.axis === "y" ? "ns-resize" : resizing.axis === "both" ? "nwse-resize" : "ew-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
  }, [resizing, setItems]);

  const initResize = (e: React.MouseEvent, item: PortfolioItem, axis: "x" | "y" | "both" = "x", xHandle: "left" | "right" = "right") => {
    e.stopPropagation();
    e.preventDefault();
    if (e.button !== 0) return;

    let startCol = Math.max(1, item.colStart ?? 1);
    try {
      const style = window.getComputedStyle(e.currentTarget as HTMLElement);
      const parsedStart = Number.parseInt(style.gridColumnStart, 10);
      if (Number.isFinite(parsedStart) && parsedStart > 0) startCol = parsedStart;
    } catch {
      // Keep fallback
    }

    setResizing({
      id: item.id,
      axis,
      xHandle,
      startX: e.clientX,
      startY: e.clientY,
      startSpan: item.span,
      startCol,
      startHeight: item.height ?? 160,
    });
  };

  return { gridRef, resizing, initResize };
};
