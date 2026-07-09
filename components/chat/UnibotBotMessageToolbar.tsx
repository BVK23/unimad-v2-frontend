"use client";

import type React from "react";
import { useCallback, useState } from "react";
import { botMessageToPlainTextCopy } from "@/features/adk-chat/utils/bot-message-to-plain-text-copy";
import { Check, Copy } from "lucide-react";

type UnibotBotMessageToolbarProps = {
  textToCopy: string;
};

/** Copy action for assistant messages — copies user-facing prose only. */
export function UnibotBotMessageToolbar({ textToCopy }: UnibotBotMessageToolbarProps): React.JSX.Element | null {
  const [copied, setCopied] = useState(false);

  const plainText = botMessageToPlainTextCopy(textToCopy);

  const handleCopy = useCallback(async () => {
    if (!plainText) {
      return;
    }

    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, [plainText]);

  if (!plainText) {
    return null;
  }

  const btnClass =
    "inline-flex items-center justify-center rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-white/10";

  return (
    <div className="flex items-center justify-start gap-0.5 px-1">
      <button
        type="button"
        onClick={() => void handleCopy()}
        title={copied ? "Copied" : "Copy response"}
        aria-label={copied ? "Copied" : "Copy response"}
        className={btnClass}
      >
        {copied ? <Check size={12} aria-hidden className="text-brand-600" /> : <Copy size={12} aria-hidden />}
      </button>
    </div>
  );
}
