"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type SlotIndex = 0 | 1;

type RenderTarget = {
  slot: SlotIndex;
  url: string;
  gen: number;
} | null;

type LoadSuccessPayload = {
  numPages: number;
};

export type ResumePDFViewerProps = {
  slot0FileUrl: string | null;
  slot1FileUrl: string | null;
  visibleSlot: SlotIndex;
  exitingSlot: SlotIndex | null;
  renderingTarget: RenderTarget;
  width: number;
  onSlotRendered: (slot: SlotIndex, fileUrl: string, numPages: number) => void;
  onSlotError: (slot: SlotIndex, fileUrl: string, error?: unknown) => void;
};

const visibleWrapClass = "absolute inset-0 z-[30] h-full w-full opacity-100 transition-opacity duration-150";
const exitingWrapClass = "absolute inset-0 z-[20] h-full w-full opacity-100 pointer-events-none transition-opacity duration-150";
const hiddenWrapClass = "absolute inset-0 z-[10] h-full w-full opacity-0 pointer-events-none";
/** Matches `p-3` horizontal padding (24px) + 1px border each side on the page frame */
const PAGE_STACK_HORIZONTAL_OVERHEAD = 26;
const pagesStackClass = "flex flex-col gap-4 p-3";
const pageFrameClass = "w-fit mx-auto bg-white border border-slate-200 shadow-sm";

const ResumePDFViewer = ({
  slot0FileUrl,
  slot1FileUrl,
  visibleSlot,
  exitingSlot,
  renderingTarget,
  width,
  onSlotRendered,
  onSlotError,
}: ResumePDFViewerProps) => {
  const pageRenderWidth = Math.max(280, width - PAGE_STACK_HORIZONTAL_OVERHEAD);
  const [slot0NumPages, setSlot0NumPages] = useState(0);
  const [slot1NumPages, setSlot1NumPages] = useState(0);
  const renderedPagesBySlotRef = useRef<{ 0: Set<number>; 1: Set<number> }>({
    0: new Set<number>(),
    1: new Set<number>(),
  });
  const emittedReadyKeyRef = useRef<string | null>(null);
  const emittedErrorKeyRef = useRef<string | null>(null);

  const slot0Pages = useMemo(() => Array.from({ length: slot0NumPages }, (_, idx) => idx + 1), [slot0NumPages]);
  const slot1Pages = useMemo(() => Array.from({ length: slot1NumPages }, (_, idx) => idx + 1), [slot1NumPages]);

  const emitSlotError = useCallback(
    (slot: SlotIndex, fileUrl: string, error?: unknown) => {
      const key = `${slot}:${fileUrl}`;
      if (emittedErrorKeyRef.current === key) return;
      emittedErrorKeyRef.current = key;
      onSlotError(slot, fileUrl, error);
    },
    [onSlotError]
  );

  const handleDocumentLoadSuccess = useCallback((slot: SlotIndex, payload: LoadSuccessPayload) => {
    const pageCount = payload.numPages > 0 ? payload.numPages : 1;
    renderedPagesBySlotRef.current[slot] = new Set<number>();
    if (slot === 0) {
      setSlot0NumPages(pageCount);
    } else {
      setSlot1NumPages(pageCount);
    }
    emittedReadyKeyRef.current = null;
    emittedErrorKeyRef.current = null;
  }, []);

  const handlePageRenderSuccess = useCallback(
    (slot: SlotIndex, fileUrl: string, pageNumber: number) => {
      if (!renderingTarget) return;
      if (renderingTarget.slot !== slot || renderingTarget.url !== fileUrl) return;

      const totalPages = slot === 0 ? slot0NumPages : slot1NumPages;
      if (totalPages <= 0) return;

      const renderedSet = renderedPagesBySlotRef.current[slot];
      renderedSet.add(pageNumber);
      if (renderedSet.size < totalPages) return;

      const key = `${slot}:${fileUrl}:${renderingTarget.gen}`;
      if (emittedReadyKeyRef.current === key) return;
      emittedReadyKeyRef.current = key;
      onSlotRendered(slot, fileUrl, totalPages);
    },
    [onSlotRendered, renderingTarget, slot0NumPages, slot1NumPages]
  );

  const renderSlot = (slot: SlotIndex, fileUrl: string | null, pages: number[]) => {
    if (!fileUrl) return null;
    const wrapClass = visibleSlot === slot ? visibleWrapClass : exitingSlot === slot ? exitingWrapClass : hiddenWrapClass;
    const isAriaHidden = visibleSlot !== slot && exitingSlot !== slot;

    return (
      <div className={wrapClass} aria-hidden={isAriaHidden}>
        <Document
          file={fileUrl}
          loading={null}
          error={null}
          onLoadSuccess={(payload: LoadSuccessPayload) => {
            handleDocumentLoadSuccess(slot, payload);
          }}
          onLoadError={(error: Error) => {
            emitSlotError(slot, fileUrl, error);
          }}
        >
          <div className={pagesStackClass}>
            {pages.map(pageNumber => (
              <div key={`slot-${slot}-frame-${fileUrl}-${pageNumber}`} className={pageFrameClass}>
                <Page
                  key={`slot-${slot}-${fileUrl}-${pageNumber}`}
                  pageNumber={pageNumber}
                  width={pageRenderWidth}
                  renderAnnotationLayer
                  renderTextLayer={false}
                  loading={null}
                  error={null}
                  onLoadError={(error: Error) => {
                    emitSlotError(slot, fileUrl, error);
                  }}
                  onRenderError={(error: Error) => {
                    emitSlotError(slot, fileUrl, error);
                  }}
                  onRenderSuccess={() => {
                    handlePageRenderSuccess(slot, fileUrl, pageNumber);
                  }}
                />
              </div>
            ))}
          </div>
        </Document>
      </div>
    );
  };

  return (
    <div className="relative h-full w-full">
      {renderSlot(0, slot0FileUrl, slot0Pages)}
      {renderSlot(1, slot1FileUrl, slot1Pages)}
    </div>
  );
};

export default ResumePDFViewer;
