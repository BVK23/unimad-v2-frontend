import { useState, useRef, useEffect } from 'react';
import { ColumnSpan, PortfolioItem } from '../types';

export const useGridResize = (items: PortfolioItem[], setItems: (items: PortfolioItem[]) => void) => {
    const [resizing, setResizing] = useState<{
        id: string;
        axis: 'x' | 'y' | 'both';
        xHandle: 'left' | 'right';
        startX: number;
        startY: number;
        startSpan: number;
        startCol: number;
        startHeight: number;
    } | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizing || !gridRef.current) return;

            let nextSpan = resizing.startSpan;
            let nextCol = resizing.startCol;
            let nextHeight = resizing.startHeight;
            const targetItem = items.find((i) => i.id === resizing.id);
            const minHeight =
                targetItem && (targetItem.type === 'link-box' || targetItem.type === 'text')
                    ? 36
                    : 96;

            if (resizing.axis === 'x' || resizing.axis === 'both') {
                const gridWidth = gridRef.current.offsetWidth;
                // Try to infer current grid column count (1 on small screens, 3 on md+).
                // Fallback to 3 to match our editor layout.
                let columns = 3;
                try {
                    const template = window.getComputedStyle(gridRef.current).gridTemplateColumns;
                    const parsed = template.split(' ').filter(Boolean).length;
                    if (parsed >= 1) columns = parsed;
                } catch {
                    // ignore
                }
                const oneColWidth = gridWidth / columns;
                const deltaX = e.clientX - resizing.startX;
                const colShift = Math.round(deltaX / oneColWidth);

                if (resizing.xHandle === 'left') {
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

            if (resizing.axis === 'y' || resizing.axis === 'both') {
                const deltaY = e.clientY - resizing.startY;
                nextHeight = Math.max(minHeight, Math.min(1200, resizing.startHeight + deltaY));
            }

            setItems(items.map(item => {
                if (item.id !== resizing.id) return item;
                const shouldResizeWidth = resizing.axis === 'x' || resizing.axis === 'both';
                const shouldResizeHeight = resizing.axis === 'y' || resizing.axis === 'both';
                const widthChanged = shouldResizeWidth && item.span !== nextSpan;
                const colChanged = shouldResizeWidth && (item.colStart ?? resizing.startCol) !== nextCol;
                const heightChanged = shouldResizeHeight && (item.height ?? resizing.startHeight) !== nextHeight;
                if (!widthChanged && !heightChanged && !colChanged) return item;
                return {
                    ...item,
                    span: shouldResizeWidth ? (nextSpan as ColumnSpan) : item.span,
                    colStart: shouldResizeWidth ? nextCol : item.colStart,
                    height: shouldResizeHeight ? nextHeight : item.height
                };
            }));
        };

        const handleMouseUp = () => {
            setResizing(null);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        if (resizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = resizing.axis === 'y' ? 'ns-resize' : resizing.axis === 'both' ? 'nwse-resize' : 'ew-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
    }, [resizing, items, setItems]); // Depend on items to ensure freshness

    const initResize = (
        e: React.MouseEvent,
        item: PortfolioItem,
        axis: 'x' | 'y' | 'both' = 'x',
        xHandle: 'left' | 'right' = 'right'
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

        setResizing({
            id: item.id,
            axis,
            xHandle,
            startX: e.clientX,
            startY: e.clientY,
            startSpan: item.span,
            startCol,
            startHeight: item.height ?? 220
        });
    };

    return { gridRef, resizing, initResize };
};
