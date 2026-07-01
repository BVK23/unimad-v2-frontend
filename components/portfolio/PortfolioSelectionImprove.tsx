"use client";

import { useCallback, useRef } from "react";
import { useOptionalAdkChatContext } from "@/components/chat/AdkChatProvider";
import {
  buildPortfolioSelectionRefineMessage,
  PORTFOLIO_MIN_SELECTION_CHARS,
  PORTFOLIO_SELECTION_PRESETS,
} from "@/features/portfolio/config/selection-presets";

const STRIP_DEBOUNCE_MS = 200;

const pillButtonClass =
  "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] font-medium leading-4 text-brand-700 transition-colors hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-brand-500/15";

type PortfolioSelectionImproveActionsProps = {
  selectedText: string;
  disabled?: boolean;
  onActionFired?: () => void;
};

export const PortfolioSelectionImproveActions = ({
  selectedText,
  disabled = false,
  onActionFired,
}: PortfolioSelectionImproveActionsProps) => {
  const adkChat = useOptionalAdkChatContext();
  const lastFireRef = useRef(0);

  const fireRefine = useCallback(
    (presetLabel: string, instruction: string) => {
      if (disabled) return;
      const trimmed = selectedText.trim();
      if (trimmed.length < PORTFOLIO_MIN_SELECTION_CHARS) return;

      const now = Date.now();
      if (now - lastFireRef.current < STRIP_DEBOUNCE_MS) return;
      lastFireRef.current = now;

      const message = buildPortfolioSelectionRefineMessage(trimmed, instruction);

      if (adkChat) {
        void adkChat.sendMainMessage(message);
      } else {
        window.dispatchEvent(
          new CustomEvent("open-unibot", {
            detail: {
              type: "improve",
              text: message,
              improveType: "portfolio",
              topicTitle: `Improve: ${presetLabel}`,
              requestKey: now,
            },
          })
        );
      }

      onActionFired?.();
    },
    [adkChat, disabled, onActionFired, selectedText]
  );

  if (selectedText.trim().length < PORTFOLIO_MIN_SELECTION_CHARS) {
    return null;
  }

  return (
    <>
      {PORTFOLIO_SELECTION_PRESETS.map(preset => {
        const Icon = preset.icon;
        return (
          <button
            key={preset.id}
            type="button"
            className={pillButtonClass}
            title={preset.label}
            aria-label={preset.label}
            onClick={() => fireRefine(preset.label, preset.instruction)}
          >
            <Icon size={13} className="shrink-0" aria-hidden />
            {preset.label}
          </button>
        );
      })}
    </>
  );
};
