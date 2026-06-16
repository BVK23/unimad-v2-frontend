"use client";

import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

type RouteNavigationOverlayProps = {
  message?: string;
};

/** Full-viewport loading layer during client-side route transitions (above modals). */
export function RouteNavigationOverlay({ message = "Loading…" }: RouteNavigationOverlayProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-slate-950/80"
      style={{ zIndex: 600 }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <Loader2 size={32} className="animate-spin text-brand-600" aria-hidden />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{message}</p>
      </div>
    </div>,
    document.body
  );
}
