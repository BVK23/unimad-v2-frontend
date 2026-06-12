"use client";

import React from "react";
import { createPortal } from "react-dom";
import { MODAL_OVERLAY_ABOVE_MENU_Z_CLASS, MODAL_OVERLAY_Z_CLASS } from "@/lib/ui/modal-overlay";

export type ModalPortalOverlayProps = React.HTMLAttributes<HTMLDivElement> & {
  /** When false, nothing is rendered. Defaults to true. */
  open?: boolean;
  /** z-index tier; defaults to standard modal overlay above Uniboard header. */
  zClass?: string;
};

/**
 * Full-viewport modal backdrop rendered via portal on `document.body`.
 * Use for dialogs inside scroll/overflow containers (Uniboard pages, Studio, Settings).
 */
export function ModalPortalOverlay({
  children,
  className = "",
  open = true,
  zClass = MODAL_OVERLAY_Z_CLASS,
  ...rest
}: ModalPortalOverlayProps) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={`fixed inset-0 ${zClass} ${className}`} {...rest}>
      {children}
    </div>,
    document.body
  );
}

export { MODAL_OVERLAY_ABOVE_MENU_Z_CLASS, MODAL_OVERLAY_Z_CLASS };
