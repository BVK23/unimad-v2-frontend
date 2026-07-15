"use client";

import React, { useEffect, useState } from "react";
import { GENERIC_RETRY_COOLDOWN_SEC, RATE_LIMIT_RETRY_COOLDOWN_SEC } from "@/features/adk-chat/format-stream-error";
import type { ChatMessage } from "@/types";
import { AlertCircle, RotateCcw } from "lucide-react";

type UnibotErrorBubbleProps = {
  message: ChatMessage;
  onRetry?: () => void;
  /** Rate-limit retries wait this long before the button is enabled. */
  retryCooldownSeconds?: number;
};

/** Shown only when an assistant turn fails (rate limit, stream error, etc.). */
export function UnibotErrorBubble({ message, onRetry, retryCooldownSeconds }: UnibotErrorBubbleProps): React.JSX.Element {
  const isRateLimit = message.errorKind === "rate_limit";
  const cooldownSeconds = retryCooldownSeconds ?? (isRateLimit ? RATE_LIMIT_RETRY_COOLDOWN_SEC : GENERIC_RETRY_COOLDOWN_SEC);
  const cooldownActive = Boolean(onRetry) && cooldownSeconds > 0;
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!cooldownActive) {
      return;
    }

    const durationMs = cooldownSeconds * 1000;
    const endsAt = Date.now() + durationMs;
    const update = () => {
      const remainingMs = Math.max(0, endsAt - Date.now());
      setSecondsLeft(Math.ceil(remainingMs / 1000));
      setProgress(remainingMs / durationMs);
    };
    update();
    const id = window.setInterval(update, 100);
    return () => window.clearInterval(id);
  }, [message.id, cooldownActive, cooldownSeconds]);

  const displaySecondsLeft = cooldownActive ? secondsLeft : 0;
  const displayProgress = cooldownActive ? progress : 0;
  const retryDisabled = cooldownActive && displaySecondsLeft > 0;
  const showRetryButton = Boolean(onRetry) && !retryDisabled;

  return (
    <div
      className={`max-w-[95%] overflow-hidden rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed shadow-sm ${
        isRateLimit
          ? "border-amber-200/90 bg-amber-50/95 text-amber-950 dark:border-amber-900/45 dark:bg-amber-950/35 dark:text-amber-100"
          : "border-red-200/80 bg-red-50/90 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100"
      }`}
    >
      <div className="flex gap-2.5">
        <AlertCircle
          size={18}
          className={`mt-0.5 shrink-0 ${isRateLimit ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400"}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-wrap">{message.text}</p>
          {onRetry && retryDisabled ? (
            <div className="mt-2.5">
              <p
                className={`mb-1.5 text-[11px] font-medium tabular-nums ${
                  isRateLimit ? "text-amber-800/90 dark:text-amber-200/90" : "text-red-800/90 dark:text-red-200/90"
                }`}
              >
                Try again in {displaySecondsLeft}s
              </p>
              <div
                className={`h-1 w-full overflow-hidden rounded-full ${
                  isRateLimit ? "bg-amber-200/70 dark:bg-amber-900/50" : "bg-red-200/70 dark:bg-red-900/50"
                }`}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={cooldownSeconds}
                aria-valuenow={displaySecondsLeft}
                aria-label="Time until Try again is available"
              >
                <div
                  className={`h-full origin-left rounded-full transition-[width] duration-100 ease-linear ${
                    isRateLimit ? "bg-amber-500 dark:bg-amber-400" : "bg-red-500 dark:bg-red-400"
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, displayProgress * 100))}%` }}
                />
              </div>
            </div>
          ) : null}
          {showRetryButton ? (
            <button
              type="button"
              onClick={onRetry}
              className={`mt-2.5 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                isRateLimit
                  ? "border-amber-300/80 bg-white/80 text-amber-900 hover:bg-white dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-950/70"
                  : "border-red-200 bg-white/80 text-red-800 hover:bg-white dark:border-red-800 dark:bg-red-950/50 dark:text-red-100 dark:hover:bg-red-950/70"
              }`}
            >
              <RotateCcw size={14} aria-hidden />
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
