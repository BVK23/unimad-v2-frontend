"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import DiffRegionChipOverlay from "@/components/studio/DiffRegionChipOverlay";
import { documentPreviewBodyTypography } from "@/components/studio/StudioDocumentPreview";
import { type DiffRegion, buildReconciledHtml, reconcileAnchoredDraft } from "@/features/application-assets/utils/application-asset-diff";

type DocumentDiffPreviewProps = {
  baselineDraft: string;
  proposedDraft: string;
  anchorSelectedText?: string;
  onApply: (reconciledHtml: string) => void;
  onRevertAll: () => void;
  busy?: boolean;
  editorClassName?: string;
};

const DIFF_REGION_HIGHLIGHT_CLASS =
  "diff-region-block block rounded-md my-1 px-3 py-2 font-serif bg-emerald-50/90 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:ring-emerald-700/60";

const DIFF_REGION_UNDONE_CLASS = "diff-region-block block rounded-md my-1 font-serif opacity-70";

const buildReviewDisplayHtml = (regions: DiffRegion[], decisions: Record<string, "keep" | "undo">): string =>
  regions
    .map(region => {
      if (region.kind === "unchanged") {
        return region.html;
      }
      if (region.kind === "removed") {
        if (decisions[region.id] === "undo") {
          return region.baselineHtml ?? "";
        }
        return "";
      }

      const isUndone = decisions[region.id] === "undo";
      const isKept = decisions[region.id] === "keep";
      const inner = isUndone ? (region.baselineHtml ?? "") : region.html;

      if (isKept) {
        return inner;
      }

      if (isUndone) {
        return `<div data-diff-region="${region.id}" class="${DIFF_REGION_UNDONE_CLASS}">${inner}</div>`;
      }

      return `<div data-diff-region="${region.id}" class="${DIFF_REGION_HIGHLIGHT_CLASS}">${inner}</div>`;
    })
    .filter(Boolean)
    .join("");

const DocumentDiffPreview = ({
  baselineDraft,
  proposedDraft,
  anchorSelectedText,
  onApply,
  onRevertAll,
  busy = false,
  editorClassName = "",
}: DocumentDiffPreviewProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { regions } = useMemo(
    () =>
      reconcileAnchoredDraft({
        baselineDraft,
        proposedDraft,
        anchorSelectedText,
      }),
    [baselineDraft, proposedDraft, anchorSelectedText]
  );

  const changedRegions = useMemo(() => regions.filter(r => r.kind !== "unchanged"), [regions]);

  const [decisions, setDecisions] = useState<Record<string, "keep" | "undo">>({});

  const displayHtml = useMemo(() => buildReviewDisplayHtml(regions, decisions), [regions, decisions]);

  const layoutKey = `${displayHtml.length}-${Object.keys(decisions).sort().join(",")}`;

  const handleKeep = useCallback((regionId: string) => {
    setDecisions(prev => ({ ...prev, [regionId]: "keep" }));
  }, []);

  const handleUndo = useCallback((regionId: string) => {
    setDecisions(prev => ({ ...prev, [regionId]: "undo" }));
  }, []);

  const handleKeepAll = useCallback(() => {
    const all: Record<string, "keep"> = {};
    for (const r of changedRegions) {
      all[r.id] = "keep";
    }
    setDecisions(all);
  }, [changedRegions]);

  const handleUndoAll = useCallback(() => {
    const all: Record<string, "undo"> = {};
    for (const r of changedRegions) {
      all[r.id] = "undo";
    }
    setDecisions(all);
  }, [changedRegions]);

  const allDecided = changedRegions.length > 0 && changedRegions.every(r => decisions[r.id]);

  const decidedCount = changedRegions.filter(r => decisions[r.id]).length;

  const handleApply = useCallback(() => {
    const html = buildReconciledHtml(regions, decisions);
    onApply(html);
  }, [regions, decisions, onApply]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const target = changedRegions.find(r => !decisions[r.id]);
    if (!target) return;
    const el = container.querySelector(`[data-diff-region="${target.id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [changedRegions, decisions, layoutKey]);

  const regionIdsForChips = changedRegions.map(r => r.id);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollContainerRef} className={`relative min-h-0 flex-1 overflow-y-auto p-12 ${documentPreviewBodyTypography}`}>
        <RichTextEditor value={displayHtml} onChange={() => {}} forceExternalSync readOnly className={editorClassName} />
        <DiffRegionChipOverlay
          scrollContainerRef={scrollContainerRef}
          regionIds={regionIdsForChips}
          decisions={decisions}
          onKeep={handleKeep}
          onUndo={handleUndo}
          busy={busy}
          layoutKey={layoutKey}
        />
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-slate-50/95 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900/90">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {changedRegions.length > 0 ? (
              <>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {decidedCount}/{changedRegions.length} reviewed
                </span>
                <button
                  type="button"
                  onClick={handleKeepAll}
                  disabled={busy}
                  className="text-[11px] font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 dark:text-brand-400"
                >
                  Keep all
                </button>
                <button
                  type="button"
                  onClick={handleUndoAll}
                  disabled={busy}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50 dark:text-slate-400"
                >
                  Undo all
                </button>
              </>
            ) : (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Review highlighted edits above, then apply or revert.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRevertAll}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              Revert all
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={busy || (changedRegions.length > 0 && !allDecided)}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              title={changedRegions.length > 0 && !allDecided ? "Review each change first" : undefined}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDiffPreview;
