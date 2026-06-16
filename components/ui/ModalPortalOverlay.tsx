"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  MODAL_OVERLAY_ABOVE_MENU_Z_CLASS,
  MODAL_OVERLAY_NESTED_Z_INDEX,
  MODAL_OVERLAY_Z_CLASS,
  MODAL_OVERLAY_Z_INDEX,
} from "@/lib/ui/modal-overlay";

export type ModalPortalOverlayProps = React.HTMLAttributes<HTMLDivElement> & {
  /** When false, nothing is rendered. Defaults to true. */
  open?: boolean;
  /** Inline z-index (always applied). Defaults to standard modal tier. */
  zIndex?: number;
  /** Nested tier when zIndex is omitted. */
  tier?: "standard" | "nested";
  /** @deprecated Tailwind class fallback; zIndex style takes precedence for stacking. */
  zClass?: string;
};

function resolveModalZIndex(zIndex: number | undefined, tier: "standard" | "nested" | undefined, zClass?: string): number {
  if (zIndex != null) return zIndex;
  if (tier === "nested" || zClass === MODAL_OVERLAY_ABOVE_MENU_Z_CLASS) return MODAL_OVERLAY_NESTED_Z_INDEX;
  return MODAL_OVERLAY_Z_INDEX;
}

/**
 * Full-viewport modal backdrop rendered via portal on `document.body`.
 * Use for dialogs inside scroll/overflow containers (Uniboard pages, Studio, Settings).
 */
export function ModalPortalOverlay({
  children,
  className = "",
  open = true,
  zIndex,
  tier,
  zClass = MODAL_OVERLAY_Z_CLASS,
  ...rest
}: ModalPortalOverlayProps) {
  const stackZIndex = resolveModalZIndex(zIndex, tier, zClass);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div data-modal-overlay className={`fixed inset-0 ${zClass} ${className}`} style={{ zIndex: stackZIndex }} {...rest}>
      {children}
    </div>,
    document.body
  );
}

export { MODAL_OVERLAY_ABOVE_MENU_Z_CLASS, MODAL_OVERLAY_Z_CLASS };
