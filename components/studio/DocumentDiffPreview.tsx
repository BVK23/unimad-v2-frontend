"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import DiffRegionChipOverlay from "@/components/studio/DiffRegionChipOverlay";
import DocumentReviewBottomBar from "@/components/studio/DocumentReviewBottomBar";
import { documentPreviewBodyTypography } from "@/components/studio/StudioDocumentPreview";
import { useApplicationAssetDiffReviewUiStore } from "@/features/application-assets/store/useApplicationAssetDiffReviewUiStore";
import { type DiffRegion, buildReconciledHtml, reconcileAnchoredDraft } from "@/features/application-assets/utils/application-asset-diff";

type DocumentDiffPreviewProps = {
  baselineDraft: string;
  proposedDraft: string;
  anchorSelectedText?: string;
  reviewSessionKey?: string;
  onApply: (reconciledHtml: string) => void;
  onRevertAll: () => void;
  busy?: boolean;
  editorClassName?: string;
};

const DIFF_REGION_HIGHLIGHT_CLASS =
  "diff-region-block group/region block cursor-pointer rounded-md my-1 px-3 py-2 font-serif bg-blue-50/40 dark:bg-blue-900/20 transition-colors hover:bg-blue-100/50 dark:hover:bg-blue-900/30";

const DIFF_REGION_ACTIVE_CLASS =
  "diff-region-block group/region block cursor-pointer rounded-md my-1 px-3 py-2 font-serif bg-blue-100/50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 transition-colors";

const DIFF_REGION_UNDONE_CLASS = "diff-region-block block rounded-md my-1 font-serif opacity-70";
const DIFF_REGION_REMOVED_CLASS =
  "diff-region-block group/region block cursor-pointer rounded-md my-1 px-3 py-2 font-serif bg-rose-50/90 ring-1 ring-rose-200/80 line-through decoration-rose-500/80 dark:bg-rose-950/40 dark:ring-rose-700/60";

const buildReviewDisplayHtml = (regions: DiffRegion[], decisions: Record<string, "keep" | "undo">, activeRegionId: string | null): string =>
  regions
    .map(region => {
      if (region.kind === "unchanged") {
        return region.html;
      }
      if (region.kind === "removed") {
        if (decisions[region.id] === "undo") {
          return `<div data-diff-region="${region.id}" class="${DIFF_REGION_UNDONE_CLASS}">${region.baselineHtml ?? ""}</div>`;
        }
        const removedClass = region.id === activeRegionId ? DIFF_REGION_ACTIVE_CLASS : DIFF_REGION_REMOVED_CLASS;
        return `<div data-diff-region="${region.id}" class="${removedClass}">${region.baselineHtml ?? ""}</div>`;
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

      const highlightClass = region.id === activeRegionId ? DIFF_REGION_ACTIVE_CLASS : DIFF_REGION_HIGHLIGHT_CLASS;
      return `<div data-diff-region="${region.id}" class="${highlightClass}">${inner}</div>`;
    })
    .filter(Boolean)
    .join("");

const DocumentDiffPreview = ({
  baselineDraft,
  proposedDraft,
  anchorSelectedText,
  reviewSessionKey = "review",
  onApply,
  onRevertAll,
  busy = false,
  editorClassName = "",
}: DocumentDiffPreviewProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);

  const decisions = useApplicationAssetDiffReviewUiStore(s => s.decisions);
  const activeRegionId = useApplicationAssetDiffReviewUiStore(s => s.activeRegionId);
  const initSession = useApplicationAssetDiffReviewUiStore(s => s.initSession);
  const clearSession = useApplicationAssetDiffReviewUiStore(s => s.clearSession);
  const setActiveRegionId = useApplicationAssetDiffReviewUiStore(s => s.setActiveRegionId);
  const keepRegion = useApplicationAssetDiffReviewUiStore(s => s.keepRegion);
  const undoRegion = useApplicationAssetDiffReviewUiStore(s => s.undoRegion);
  const keepAll = useApplicationAssetDiffReviewUiStore(s => s.keepAll);
  const undoAll = useApplicationAssetDiffReviewUiStore(s => s.undoAll);

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
  const changedRegionIds = useMemo(() => changedRegions.map(r => r.id), [changedRegions]);

  const changedRegionIdsKey = changedRegionIds.join(",");

  useEffect(() => {
    if (changedRegionIds.length === 0) {
      clearSession();
      return;
    }
    initSession(reviewSessionKey, changedRegionIds);
    return () => clearSession();
  }, [reviewSessionKey, changedRegionIdsKey, changedRegionIds, initSession, clearSession]);

  const displayHtml = useMemo(() => buildReviewDisplayHtml(regions, decisions, activeRegionId), [regions, decisions, activeRegionId]);

  const layoutKey = `${displayHtml.length}-${Object.keys(decisions).sort().join(",")}-${activeRegionId ?? ""}`;

  const allDecided = changedRegions.length > 0 && changedRegions.every(r => decisions[r.id]);
  const decidedCount = changedRegions.filter(r => decisions[r.id]).length;

  const handleHoverRegionChange = useCallback((regionId: string | null) => {
    setHoveredRegionId(regionId);
  }, []);

  const resolveHoveredRegionId = useCallback(
    (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return null;
      const regionEl = target.closest("[data-diff-region]") as HTMLElement | null;
      const pillEl = target.closest("[data-diff-pill]") as HTMLElement | null;
      const regionId = regionEl?.getAttribute("data-diff-region") ?? pillEl?.getAttribute("data-diff-pill") ?? null;
      if (!regionId || !changedRegionIds.includes(regionId) || decisions[regionId]) {
        return null;
      }
      return regionId;
    },
    [changedRegionIds, decisions]
  );

  const handleApply = useCallback(() => {
    const html = buildReconciledHtml(regions, decisions);
    onApply(html);
  }, [regions, decisions, onApply]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTargetId =
      activeRegionId && changedRegionIds.includes(activeRegionId) ? activeRegionId : changedRegions.find(r => !decisions[r.id])?.id;

    if (!scrollTargetId) return;
    const el = container.querySelector(`[data-diff-region="${scrollTargetId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeRegionId, changedRegions, changedRegionIds, decisions, layoutKey]);

  const handleRegionClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement).closest("[data-diff-region]") as HTMLElement | null;
      if (!target) return;
      const regionId = target.getAttribute("data-diff-region");
      if (!regionId || !changedRegionIds.includes(regionId)) return;
      if (decisions[regionId]) return;
      setActiveRegionId(regionId);
    },
    [changedRegionIds, decisions, setActiveRegionId]
  );

  return (
    <div className="relative flex h-full min-h-[min(68vh,580px)] flex-col overflow-visible">
      <div
        ref={scrollContainerRef}
        className={`relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-12 pb-28 ${documentPreviewBodyTypography}`}
        onClick={handleRegionClick}
        onMouseOver={e => {
          handleHoverRegionChange(resolveHoveredRegionId(e.target));
        }}
        onMouseLeave={e => {
          const nextTarget = e.relatedTarget;
          if (nextTarget instanceof Node && e.currentTarget.contains(nextTarget)) {
            return;
          }
          handleHoverRegionChange(null);
        }}
        role="presentation"
      >
        <RichTextEditor value={displayHtml} onChange={() => {}} forceExternalSync readOnly className={editorClassName} />
        <DiffRegionChipOverlay
          scrollContainerRef={scrollContainerRef}
          regionIds={changedRegionIds}
          decisions={decisions}
          activeRegionId={activeRegionId}
          hoveredRegionId={hoveredRegionId}
          onHoverRegionChange={handleHoverRegionChange}
          onKeep={keepRegion}
          onUndo={undoRegion}
          busy={busy}
          layoutKey={layoutKey}
        />
      </div>
      <DocumentReviewBottomBar
        reviewedCount={decidedCount}
        totalCount={changedRegions.length}
        onKeepAll={keepAll}
        onUndoAll={undoAll}
        onRevertAll={onRevertAll}
        onApply={handleApply}
        busy={busy}
        applyDisabled={changedRegions.length > 0 && !allDecided}
        applyDisabledReason="Review each change first"
      />
    </div>
  );
};

export default DocumentDiffPreview;
