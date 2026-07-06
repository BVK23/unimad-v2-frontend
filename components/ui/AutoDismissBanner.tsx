"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

const DEFAULT_DURATION_MS = 15000;

type AutoDismissBannerProps = {
  children: ReactNode;
  className?: string;
  durationMs?: number;
  onDismiss?: () => void;
  progressBarClassName?: string;
  progressFillClassName?: string;
};

export function AutoDismissBanner({
  children,
  className,
  durationMs = DEFAULT_DURATION_MS,
  onDismiss,
  progressBarClassName = "bg-brand-100 dark:bg-brand-900/40",
  progressFillClassName = "bg-brand-500 dark:bg-brand-400",
}: AutoDismissBannerProps) {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(true);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const dismiss = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setVisible(false);
    onDismissRef.current?.();
  }, []);

  useEffect(() => {
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const start = startTimeRef.current ?? now;
      const elapsed = now - start;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);

      if (elapsed >= durationMs) {
        rafRef.current = null;
        dismiss();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [dismiss, durationMs]);

  if (!visible) return null;

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <div style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}>
        <div className="flex items-start gap-3 px-6 py-3">
          <div className="min-w-0 flex-1">{children}</div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-md p-1 text-brand-700/70 transition-colors hover:bg-brand-100 hover:text-brand-900 dark:text-brand-200/70 dark:hover:bg-brand-900/40 dark:hover:text-brand-50"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className={`h-0.5 w-full ${progressBarClassName}`}>
        <div className={`h-full transition-none ${progressFillClassName}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
