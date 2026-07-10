"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PdfHighlightMap } from "@/features/adk-chat/adkResumeHighlightDiff";
import { getResumePreviewContentSignature } from "@/features/resume/utils/getResumeContentSignature";
import type { ResumeData } from "@/types";
import { pdf } from "@react-pdf/renderer";
import dynamic from "next/dynamic";
import ResumePDF from "./ResumePDF";

const DynamicPDFViewer = dynamic(() => import("./ResumePDFViewer"), {
  ssr: false,
});

const CONTAINER_STYLE = { width: 800, height: 1130 };

type SlotIndex = 0 | 1;

type RenderTarget = {
  slot: SlotIndex;
  url: string;
  gen: number;
} | null;

interface ResumePDFPreviewProps {
  data: ResumeData;
  /** ADK review gutter stripes (green = added, amber = modified). */
  highlights?: PdfHighlightMap;
  loadingLabel?: string;
  errorLabel?: string;
  onLoadingChange?: (loading: boolean) => void;
}

const DEFAULT_LOADING_LABEL = "Loading preview…";
const DEFAULT_ERROR_LABEL = "Unable to render preview";

const ResumePDFPreviewInner: React.FC<ResumePDFPreviewProps> = ({
  data,
  highlights,
  loadingLabel = DEFAULT_LOADING_LABEL,
  errorLabel = DEFAULT_ERROR_LABEL,
  onLoadingChange,
}) => {
  const dataRef = useRef(data);
  const highlightsRef = useRef(highlights);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

  const contentSignature = useMemo(
    () => `${getResumePreviewContentSignature(data)}|${JSON.stringify(highlights ?? {})}`,
    [data, highlights]
  );

  const [slot0Url, setSlot0Url] = useState<string | null>(null);
  const [slot1Url, setSlot1Url] = useState<string | null>(null);
  const [visibleSlot, setVisibleSlot] = useState<SlotIndex>(0);
  const [exitingSlot, setExitingSlot] = useState<SlotIndex | null>(null);
  const [renderingTarget, setRenderingTarget] = useState<RenderTarget>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasFatalError, setHasFatalError] = useState(false);

  const slot0UrlRef = useRef<string | null>(null);
  const slot1UrlRef = useRef<string | null>(null);
  const visibleSlotRef = useRef<SlotIndex>(0);
  const exitingSlotClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderingTargetRef = useRef<RenderTarget>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    slot0UrlRef.current = slot0Url;
  }, [slot0Url]);
  useEffect(() => {
    slot1UrlRef.current = slot1Url;
  }, [slot1Url]);
  useEffect(() => {
    visibleSlotRef.current = visibleSlot;
  }, [visibleSlot]);
  useEffect(() => {
    renderingTargetRef.current = renderingTarget;
  }, [renderingTarget]);

  useEffect(() => {
    return () => {
      if (exitingSlotClearTimerRef.current) {
        clearTimeout(exitingSlotClearTimerRef.current);
      }
      if (slot0UrlRef.current) URL.revokeObjectURL(slot0UrlRef.current);
      if (slot1UrlRef.current) URL.revokeObjectURL(slot1UrlRef.current);
    };
  }, []);

  const setSlotUrl = useCallback((slot: SlotIndex, nextUrl: string | null) => {
    if (slot === 0) {
      setSlot0Url(prev => {
        if (prev && prev !== nextUrl) URL.revokeObjectURL(prev);
        return nextUrl;
      });
      return;
    }
    setSlot1Url(prev => {
      if (prev && prev !== nextUrl) URL.revokeObjectURL(prev);
      return nextUrl;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let generatedUrl: string | null = null;
    let usedInState = false;
    const generation = ++generationRef.current;

    const run = async () => {
      setIsRendering(true);
      setHasFatalError(false);

      const hasAnyUrl = Boolean(slot0UrlRef.current || slot1UrlRef.current);
      if (!hasAnyUrl) {
        setIsInitialLoading(true);
      }

      const targetSlot: SlotIndex = hasAnyUrl ? (visibleSlotRef.current === 0 ? 1 : 0) : 0;

      try {
        const blob = await pdf(<ResumePDF data={dataRef.current} highlights={highlightsRef.current} />).toBlob();
        const objectUrl = URL.createObjectURL(blob);
        generatedUrl = objectUrl;

        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        usedInState = true;
        setSlotUrl(targetSlot, objectUrl);
        setRenderingTarget({ slot: targetSlot, url: objectUrl, gen: generation });
      } catch (err) {
        if (cancelled) return;
        console.error("Resume PDF preview failed:", err);
        setIsRendering(false);

        if (!slot0UrlRef.current && !slot1UrlRef.current) {
          setHasFatalError(true);
          setIsInitialLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (generatedUrl && !usedInState) {
        URL.revokeObjectURL(generatedUrl);
      }
    };
  }, [contentSignature, setSlotUrl]);

  const handleSlotRendered = useCallback(
    (slot: SlotIndex, fileUrl: string, _numPages: number) => {
      const target = renderingTargetRef.current;
      if (!target) return;
      if (target.slot !== slot || target.url !== fileUrl) return;

      const previousVisible = visibleSlotRef.current;
      if (previousVisible !== slot) {
        setExitingSlot(previousVisible);
        if (exitingSlotClearTimerRef.current) {
          clearTimeout(exitingSlotClearTimerRef.current);
        }
        exitingSlotClearTimerRef.current = setTimeout(() => {
          setExitingSlot(null);
          exitingSlotClearTimerRef.current = null;
        }, 180);
      }

      setVisibleSlot(slot);
      setRenderingTarget(null);
      setIsRendering(false);
      if (isInitialLoading) {
        setIsInitialLoading(false);
      }
    },
    [isInitialLoading]
  );

  const handleSlotError = useCallback(
    (slot: SlotIndex, fileUrl: string) => {
      const target = renderingTargetRef.current;
      if (!target) return;
      if (target.slot !== slot || target.url !== fileUrl) return;

      setRenderingTarget(null);
      setIsRendering(false);
      setSlotUrl(slot, null);

      const hasVisibleUrl = visibleSlotRef.current === 0 ? Boolean(slot0UrlRef.current) : Boolean(slot1UrlRef.current);
      if (!hasVisibleUrl) {
        setHasFatalError(true);
        setIsInitialLoading(false);
      }
    },
    [setSlotUrl]
  );

  const hasAnyUrl = Boolean(slot0Url || slot1Url);

  useEffect(() => {
    const waiting = isInitialLoading && !hasAnyUrl && isRendering;
    onLoadingChange?.(waiting);
  }, [hasAnyUrl, isInitialLoading, isRendering, onLoadingChange]);

  if (!hasAnyUrl) {
    return (
      <div className="w-[800px] h-[1130px] bg-white shadow-xl rounded-xl flex items-center justify-center text-slate-400 text-sm px-4 text-center">
        {isInitialLoading || !hasFatalError ? loadingLabel : errorLabel}
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-xl overflow-y-auto overflow-x-auto relative max-w-full" style={CONTAINER_STYLE}>
      <DynamicPDFViewer
        slot0FileUrl={slot0Url}
        slot1FileUrl={slot1Url}
        visibleSlot={visibleSlot}
        exitingSlot={exitingSlot}
        renderingTarget={renderingTarget}
        width={CONTAINER_STYLE.width}
        onSlotRendered={handleSlotRendered}
        onSlotError={handleSlotError}
      />
    </div>
  );
};

export default React.memo(ResumePDFPreviewInner);
