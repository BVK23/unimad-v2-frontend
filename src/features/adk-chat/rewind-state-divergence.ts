"use client";

import type { ContentScope, ScopeMatch } from "./content-scope";

/** Editor edits after last ADK sync shorter than this are ignored. */
const MIN_DIVERGENCE_MS = 3_000;

/** Local edits beyond this after sync → hide state revert + warn. */
const HEAVY_DIVERGENCE_MS = 60_000;

/** No ADK sync for this long → warn before state revert. */
const STALE_SYNC_MS = 5 * 60_000;

const lastSessionSyncByKey = new Map<string, number>();
const lastLocalEditByKey = new Map<string, number>();

export type RewindStateRevertAssessment = {
  /** Same feature page + session/editor roughly aligned — may offer "revert work". */
  canOfferStateRevert: boolean;
  /** User edited heavily since last chat↔editor sync. */
  showHeavyWorkWarning: boolean;
  divergenceMs: number;
};

export function noteAdkSessionSynced(scope: ContentScope | null | undefined): void {
  const key = scope?.contentKey?.trim();
  if (!key) return;
  const now = Date.now();
  lastSessionSyncByKey.set(key, now);
  lastLocalEditByKey.set(key, now);
}

export function noteFeatureLocalEdit(scope: ContentScope | null | undefined): void {
  const key = scope?.contentKey?.trim();
  if (!key) return;
  lastLocalEditByKey.set(key, Date.now());
}

export function noteFeatureLocalEditByContentKey(contentKey: string | null | undefined): void {
  const key = contentKey?.trim();
  if (!key) return;
  lastLocalEditByKey.set(key, Date.now());
}

export function assessRewindStateRevert(
  messageScope: ContentScope | null | undefined,
  scopeMatch: ScopeMatch
): RewindStateRevertAssessment {
  if (scopeMatch !== "full" || !messageScope?.contentKey) {
    return { canOfferStateRevert: false, showHeavyWorkWarning: false, divergenceMs: 0 };
  }

  const contentKey = messageScope.contentKey;
  const syncAt = lastSessionSyncByKey.get(contentKey) ?? 0;
  const editAt = lastLocalEditByKey.get(contentKey) ?? 0;
  const divergenceMs = Math.max(0, editAt - syncAt);

  if (syncAt === 0) {
    return { canOfferStateRevert: false, showHeavyWorkWarning: false, divergenceMs: 0 };
  }

  const hasMeaningfulDivergence = divergenceMs > MIN_DIVERGENCE_MS;
  const timeSinceSync = Date.now() - syncAt;
  const showHeavyWorkWarning = hasMeaningfulDivergence && (divergenceMs >= HEAVY_DIVERGENCE_MS || timeSinceSync >= STALE_SYNC_MS);

  return {
    canOfferStateRevert: !hasMeaningfulDivergence && !showHeavyWorkWarning,
    showHeavyWorkWarning,
    divergenceMs,
  };
}
