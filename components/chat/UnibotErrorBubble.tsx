"use client";

import React, { useEffect, useState } from "react";
import { RATE_LIMIT_RETRY_COOLDOWN_SEC } from "@/features/adk-chat/format-stream-error";
import type { ChatMessage } from "@/types";
import { AlertCircle, RotateCcw } from "lucide-react";

type UnibotErrorBubbleProps = {
  message: ChatMessage;
  onRetry?: () => void;
  /** Rate-limit retries wait this long before the button is enabled. */
  retryCooldownSeconds?: number;
};

/** Shown only when an assistant turn fails (rate limit, stream error, etc.). */
export function UnibotErrorBubble({
  message,
  onRetry,
  retryCooldownSeconds = RATE_LIMIT_RETRY_COOLDOWN_SEC,
}: UnibotErrorBubbleProps): React.JSX.Element {
  const isRateLimit = message.errorKind === "rate_limit";
  const cooldownActive = isRateLimit && Boolean(onRetry);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!cooldownActive) return;

    const endsAt = Date.now() + retryCooldownSeconds * 1000;
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    update();
    const id = window.setInterval(update, 250);
    return () => window.clearInterval(id);
  }, [message.id, cooldownActive, retryCooldownSeconds]);

  const retryDisabled = cooldownActive && secondsLeft > 0;

  return (
    <div
      className={`max-w-[95%] rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed shadow-sm ${
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
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              disabled={retryDisabled}
              className={`mt-2.5 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                isRateLimit
                  ? "border-amber-300/80 bg-white/80 text-amber-900 hover:bg-white disabled:hover:bg-white/80 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-950/70 dark:disabled:hover:bg-amber-950/50"
                  : "border-red-200 bg-white/80 text-red-800 hover:bg-white disabled:hover:bg-white/80 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100 dark:hover:bg-red-950/70 dark:disabled:hover:bg-red-950/50"
              }`}
            >
              <RotateCcw size={14} className={retryDisabled ? "" : "motion-safe:group-hover:-rotate-12"} aria-hidden />
              {retryDisabled ? `Try again in ${secondsLeft}s` : "Try again"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
