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
import { useSelectionSuggestions } from "@/features/application-assets/hooks/useSelectionSuggestions";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetSelectionRect } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { Sparkles, Wand2 } from "lucide-react";

const STRIP_DEBOUNCE_MS = 200;

const pillButtonClass = "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] font-medium leading-4";

const SuggestionPillSkeleton = ({ textWidth }: { textWidth: string }) => (
  <button
    type="button"
    disabled
    tabIndex={-1}
    aria-hidden
    className={`${pillButtonClass} pointer-events-none bg-brand-50 dark:bg-brand-500/15`}
  >
    <span className="suggestion-pill-skeleton-bone block size-3 shrink-0 rounded-full" />
    <span className={`suggestion-pill-skeleton-bone block h-4 shrink-0 rounded-full ${textWidth}`} />
  </button>
);

export type SelectionImproveActionsProps = {
  assetType: ApplicationAssetApiType;
  selectedText: string;
  documentBody: string;
  /** Current document HTML at selection time (preferred baseline for diff). */
  baselineDraft?: string;
  disabled?: boolean;
  disabledReason?: string;
  onActionFired?: () => void;
};

export const SelectionImproveActions = ({
  assetType,
  selectedText,
  documentBody,
  baselineDraft: baselineDraftProp,
  disabled = false,
  disabledReason,
  onActionFired,
}: SelectionImproveActionsProps) => {
  const lastFireRef = useRef(0);

  const assetId = useApplicationAssetStudioStore(s => s.assetId);
  const role = useApplicationAssetStudioStore(s => s.role);
  const company = useApplicationAssetStudioStore(s => s.company);
  const jobDescription = useApplicationAssetStudioStore(s => s.jobDescription);
  const contactName = useApplicationAssetStudioStore(s => s.contactName);

  const { suggestions, status } = useSelectionSuggestions({
    assetType,
    assetId,
    selectedText,
    documentBody,
    role,
    company,
    jobDescription,
    contactName,
    enabled: !disabled,
  });

  const isLoading = status === "loading";
  const staticPresets = APPLICATION_ASSET_SELECTION_PRESETS[assetType];

  const getSuggestionIcon = (suggestionId: string) => {
    if (status === "fallback") {
      const preset = staticPresets.find(p => p.id === suggestionId);
      if (preset) return preset.icon;
    }
    return Sparkles;
  };

  const resolveBaselineDraft = useCallback(() => {
    const fromProp = baselineDraftProp?.trim();
    if (fromProp) return fromProp;
    const studio = useApplicationAssetStudioStore.getState();
    return studio.acceptedContent.trim() || studio.draftPreview.trim();
  }, [baselineDraftProp]);

  const fireRefine = useCallback(
    (presetLabel: string, instruction: string) => {
      if (disabled) return;
      const now = Date.now();
      if (now - lastFireRef.current < STRIP_DEBOUNCE_MS) return;
      lastFireRef.current = now;

      const baselineDraft = resolveBaselineDraft();
      const message = buildSelectionRefineUserMessage(assetType, selectedText, instruction);
      const detail: ApplicationAssetSelectionRefineDetail = {
        assetType,
        selectedText: selectedText.trim(),
        instruction,
        presetLabel,
        message,
        baselineDraft,
      };
      useApplicationAssetStudioStore.getState().setRefineAnchor(selectedText);
      window.dispatchEvent(new CustomEvent(APPLICATION_ASSET_EVENTS.selectionRefine, { detail }));
      onActionFired?.();
    },
    [assetType, disabled, onActionFired, resolveBaselineDraft, selectedText]
  );

  const handleFreeform = useCallback(() => {
    if (disabled) return;
    const now = Date.now();
    if (now - lastFireRef.current < STRIP_DEBOUNCE_MS) return;
    lastFireRef.current = now;

    const baselineDraft = resolveBaselineDraft();
    const detail: ApplicationAssetSelectionFreeformDetail = {
      assetType,
      selectedText: selectedText.trim(),
      baselineDraft,
    };
    useApplicationAssetStudioStore.getState().setRefineAnchor(selectedText);
    window.dispatchEvent(new CustomEvent(APPLICATION_ASSET_EVENTS.selectionFreeform, { detail }));
    onActionFired?.();
  }, [assetType, disabled, onActionFired, resolveBaselineDraft, selectedText]);

  return (
    <>
      {disabled && disabledReason ? <span className="px-2 text-[10px] text-slate-500 dark:text-slate-400">{disabledReason}</span> : null}
      <button
        type="button"
        disabled={disabled}
        title="Improve with Unibot using your own instruction"
        aria-label="Improve with Unibot"
        onClick={handleFreeform}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/20"
      >
        <Wand2 size={14} aria-hidden />
        Improve with Unibot
      </button>
      {isLoading ? (
        <>
          <SuggestionPillSkeleton textWidth="w-[4.75rem]" />
          <SuggestionPillSkeleton textWidth="w-[5.5rem]" />
        </>
      ) : (
        suggestions.map(suggestion => {
          const Icon = getSuggestionIcon(suggestion.id);
          return (
            <button
              key={suggestion.id}
              type="button"
              disabled={disabled}
              title={suggestion.label}
              aria-label={suggestion.label}
              onClick={() => fireRefine(suggestion.label, suggestion.instruction)}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Icon size={14} aria-hidden />
              {suggestion.label}
            </button>
          );
        })
      )}
      <style jsx global>{`
        .suggestion-pill-skeleton-bone {
          position: relative;
          overflow: hidden;
          background: rgba(52, 109, 224, 0.14);
        }

        :global(.dark) .suggestion-pill-skeleton-bone {
          background: rgba(110, 160, 240, 0.18);
        }

        .suggestion-pill-skeleton-bone::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.45) 45%,
            rgba(255, 255, 255, 0.7) 50%,
            rgba(255, 255, 255, 0.45) 55%,
            transparent 100%
          );
          animation: suggestionPillShimmer 1.35s ease-in-out infinite;
        }

        :global(.dark) .suggestion-pill-skeleton-bone::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 45%,
            rgba(255, 255, 255, 0.16) 50%,
            rgba(255, 255, 255, 0.08) 55%,
            transparent 100%
          );
        }

        @keyframes suggestionPillShimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );
};

type SelectionQuickActionsProps = {
  assetType: ApplicationAssetApiType;
  selectedText: string;
  selectionRect: ApplicationAssetSelectionRect;
  documentBody: string;
  baselineDraft?: string;
  disabled?: boolean;
  disabledReason?: string;
  onActionFired?: () => void;
};

const SelectionQuickActions = ({
  assetType,
  selectedText,
  selectionRect,
  documentBody,
  baselineDraft,
  disabled = false,
  disabledReason,
  onActionFired,
}: SelectionQuickActionsProps) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onActionFired?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onActionFired]);

  const canShow = selectedText.trim().length >= APPLICATION_ASSET_MIN_SELECTION_CHARS;

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
      <SelectionImproveActions
        assetType={assetType}
        selectedText={selectedText}
        documentBody={documentBody}
        baselineDraft={baselineDraft}
        disabled={disabled}
        disabledReason={disabledReason}
        onActionFired={onActionFired}
      />
    </div>
  );

  return createPortal(strip, document.body);
};

export default SelectionQuickActions;
