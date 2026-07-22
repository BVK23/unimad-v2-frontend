"use client";

import { useEffect, useRef, useState } from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { applyImageCrop, getCropPreviewBackgroundStyle, getImageCropGeometry, type CropGeometry } from "@/utils/image-crop";

const clampPan = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type SquareImageCropModalProps = {
  open: boolean;
  source: string | null;
  title?: string;
  description?: string;
  maxOutputPx?: number;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => void;
};

export type SquareImageCropEditorProps = {
  source: string;
  title?: string;
  description?: string;
  maxOutputPx?: number;
  isSaving?: boolean;
  /** When embedded, render inside parent modal (no nested overlay / close chrome). */
  variant?: "modal" | "embedded";
  showHeader?: boolean;
  cancelLabel?: string;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => void;
};

export function SquareImageCropEditor({
  source,
  title = "Crop photo",
  description = "Drag to reposition and use zoom to frame your photo.",
  maxOutputPx = 512,
  isSaving = false,
  variant = "modal",
  showHeader = true,
  cancelLabel = "Cancel",
  onClose,
  onSave,
}: SquareImageCropEditorProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imageReady, setImageReady] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState(source);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ x: number; y: number } | null>(null);

  // Reset crop UI when the source image changes (adjust state during render).
  if (source !== activeSource) {
    setActiveSource(source);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImageSize({ width: 0, height: 0 });
    setImageReady(false);
    setCropError(null);
  }

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    if (source.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      if (cancelled) return;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageReady(true);
    };
    img.onerror = () => {
      if (cancelled) return;
      setCropError("Could not load this image for cropping. Try uploading again.");
    };
    img.src = source;
    return () => {
      cancelled = true;
    };
  }, [source]);

  const geometry: CropGeometry | null =
    imageSize.width && imageSize.height ? getImageCropGeometry(imageSize.width, imageSize.height, "1:1", zoom, pan) : null;

  const previewStyle =
    geometry && imageSize.width && imageSize.height ? getCropPreviewBackgroundStyle(source, imageSize, geometry) : undefined;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    dragStateRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStateRef.current.x;
    const dy = e.clientY - dragStateRef.current.y;
    dragStateRef.current = { x: e.clientX, y: e.clientY };
    setPan(prev => ({
      x: clampPan(prev.x - dx / Math.max(1, rect.width), -1, 1),
      y: clampPan(prev.y - dy / Math.max(1, rect.height), -1, 1),
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const body = (
    <div className={variant === "embedded" ? "space-y-5" : "space-y-5 p-5"}>
      {showHeader && variant === "embedded" ? (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      ) : null}

      <div className="flex items-center justify-center rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
        <div
          ref={previewRef}
          className="h-48 w-48 shrink-0 overflow-hidden rounded-full bg-black/5 shadow-inner ring-2 ring-white/40 dark:bg-black/30 dark:ring-white/10"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="h-full w-full cursor-grab bg-cover bg-center bg-no-repeat active:cursor-grabbing" style={previewStyle} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Zoom</span>
          <span>{zoom.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          className="w-full accent-brand-600"
        />
      </div>

      {cropError ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {cropError}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800 disabled:opacity-60 dark:border-white/10 dark:hover:text-white"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={isSaving || !imageReady || Boolean(cropError)}
          onClick={() => {
            setCropError(null);
            applyImageCrop(
              source,
              "1:1",
              zoom,
              pan,
              croppedDataUrl => onSave(croppedDataUrl),
              maxOutputPx,
              message => setCropError(message)
            );
          }}
          className="rounded-full bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
        >
          {isSaving ? "Saving…" : imageReady ? "Save" : "Loading…"}
        </button>
      </div>
    </div>
  );

  if (variant === "embedded") {
    return body;
  }

  return (
    <ModalPortalOverlay tier="nested" className="flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0c0c0c]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-white"
          >
            Close
          </button>
        </div>
        {body}
      </div>
    </ModalPortalOverlay>
  );
}

export function SquareImageCropModal({
  open,
  source,
  title = "Crop photo",
  description = "Drag to reposition and use zoom to frame your photo.",
  maxOutputPx = 512,
  isSaving = false,
  onClose,
  onSave,
}: SquareImageCropModalProps) {
  if (!open || !source) return null;

  return (
    <SquareImageCropEditor
      key={source}
      source={source}
      title={title}
      description={description}
      maxOutputPx={maxOutputPx}
      isSaving={isSaving}
      variant="modal"
      onClose={onClose}
      onSave={onSave}
    />
  );
}
