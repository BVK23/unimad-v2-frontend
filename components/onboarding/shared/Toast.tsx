"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  variant: ToastVariant;
  message: string;
};

type ToastContextValue = {
  showToast: (variant: ToastVariant, message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: (message: string) => console.info(`[toast:success] ${message}`),
      error: (message: string) => console.error(`[toast:error] ${message}`),
      info: (message: string) => console.info(`[toast:info] ${message}`),
    };
  }
  return {
    success: (message: string) => ctx.showToast("success", message),
    error: (message: string) => ctx.showToast("error", message),
    info: (message: string) => ctx.showToast("info", message),
  };
}

const VARIANT_STYLES: Record<
  ToastVariant,
  { bg: string; border: string; text: string; Icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-900",
    Icon: CheckCircle2,
  },
  error: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-900",
    Icon: AlertCircle,
  },
  info: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-900",
    Icon: Info,
  },
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    (variant: ToastVariant, message: string) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts(prev => [...prev, { id, variant, message }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[300] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => {
          const { bg, border, text, Icon } = VARIANT_STYLES[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-[10px] border px-4 py-3 text-sm shadow-sm ${bg} ${border} ${text}`}
            >
              <Icon size={16} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">{t.message}</div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-current/60 hover:text-current"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Convenience hook to keep call sites concise: `useShowToast().error("…")` */
export function useShowToast() {
  return useToast();
}

/** Lightweight imperative trigger for use outside React, kept compatible with toast() pattern. */
export function ToastSinkProbe() {
  const toast = useToast();
  useEffect(() => {
    (window as unknown as { __unimad_toast?: typeof toast }).__unimad_toast = toast;
    return () => {
      delete (window as unknown as { __unimad_toast?: typeof toast }).__unimad_toast;
    };
  }, [toast]);
  return null;
}
