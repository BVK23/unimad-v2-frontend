"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  APPLICATION_ASSET_EVENTS,
  type ApplicationAssetSelectionFreeformDetail,
  type ApplicationAssetSelectionRefineDetail,
} from "@/features/application-assets/api/application-asset-events";
import {
  APPLICATION_ASSET_MIN_SELECTION_CHARS,
  APPLICATION_ASSET_SELECTION_PRESETS,
  buildSelectionRefineUserMessage,
} from "@/features/application-assets/config/selection-presets";
import type { ApplicationAssetSelectionRect } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { Wand2 } from "lucide-react";

const STRIP_DEBOUNCE_MS = 200;

type SelectionQuickActionsProps = {
  assetType: ApplicationAssetApiType;
  selectedText: string;
  selectionRect: ApplicationAssetSelectionRect;
  disabled?: boolean;
  disabledReason?: string;
  onActionFired?: () => void;
};

const SelectionQuickActions = ({
  assetType,
  selectedText,
  selectionRect,
  disabled = false,
  disabledReason,
  onActionFired,
}: SelectionQuickActionsProps) => {
  const lastFireRef = useRef(0);
  const presets = APPLICATION_ASSET_SELECTION_PRESETS[assetType];

  const canShow = selectedText.trim().length >= APPLICATION_ASSET_MIN_SELECTION_CHARS;

  const fireRefine = useCallback(
    (presetLabel: string, instruction: string) => {
      if (disabled) return;
      const now = Date.now();
      if (now - lastFireRef.current < STRIP_DEBOUNCE_MS) return;
      lastFireRef.current = now;

      const message = buildSelectionRefineUserMessage(assetType, selectedText, instruction);
      const detail: ApplicationAssetSelectionRefineDetail = {
        assetType,
        selectedText: selectedText.trim(),
        instruction,
        presetLabel,
        message,
      };
      window.dispatchEvent(new CustomEvent(APPLICATION_ASSET_EVENTS.selectionRefine, { detail }));
      onActionFired?.();
    },
    [assetType, disabled, onActionFired, selectedText]
  );

  const handleFreeform = useCallback(() => {
    if (disabled) return;
    const now = Date.now();
    if (now - lastFireRef.current < STRIP_DEBOUNCE_MS) return;
    lastFireRef.current = now;

    const detail: ApplicationAssetSelectionFreeformDetail = {
      assetType,
      selectedText: selectedText.trim(),
    };
    window.dispatchEvent(new CustomEvent(APPLICATION_ASSET_EVENTS.selectionFreeform, { detail }));
    onActionFired?.();
  }, [assetType, disabled, onActionFired, selectedText]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onActionFired?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onActionFired]);

  if (!canShow || typeof document === "undefined") {
    return null;
  }

  const top = selectionRect.top + selectionRect.height + 8;
  const left = Math.max(8, selectionRect.left + selectionRect.width / 2);

  const strip = (
    <div
      role="toolbar"
      aria-label="Quick actions for selected text"
      className={`fixed z-[60] flex max-w-[min(96vw,520px)] flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 ${
        disabled ? "pointer-events-none opacity-40" : ""
      }`}
      style={{
        top,
        left,
        transform: "translateX(-50%)",
      }}
      onMouseDown={e => e.preventDefault()}
    >
      {disabled && disabledReason ? <span className="px-2 text-[10px] text-slate-500 dark:text-slate-400">{disabledReason}</span> : null}
      {presets.map(preset => {
        const Icon = preset.icon;
        return (
          <button
            key={preset.id}
            type="button"
            disabled={disabled}
            title={preset.label}
            aria-label={preset.label}
            onClick={() => fireRefine(preset.label, preset.instruction)}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100 disabled:cursor-not-allowed dark:bg-brand-500/15 dark:text-brand-200 dark:hover:bg-brand-500/25"
          >
            <Icon size={12} aria-hidden />
            {preset.label}
          </button>
        );
      })}
      <button
        type="button"
        disabled={disabled}
        title="Ask Unibot with your own instruction"
        aria-label="Ask Unibot"
        onClick={handleFreeform}
        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        <Wand2 size={12} aria-hidden />
        Ask Unibot…
      </button>
    </div>
  );

  return createPortal(strip, document.body);
};

export default SelectionQuickActions;
