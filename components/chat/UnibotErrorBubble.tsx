"use client";

import React from "react";
import type { ChatMessage } from "@/types";
import { AlertCircle, RotateCcw } from "lucide-react";

type UnibotErrorBubbleProps = {
  message: ChatMessage;
  onRetry?: () => void;
};

/** Shown only when an assistant turn fails (rate limit, stream error, etc.). */
export function UnibotErrorBubble({ message, onRetry }: UnibotErrorBubbleProps): React.JSX.Element {
  const isRateLimit = message.errorKind === "rate_limit";

  return (
    <div
      className={`max-w-[95%] rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed ${
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
