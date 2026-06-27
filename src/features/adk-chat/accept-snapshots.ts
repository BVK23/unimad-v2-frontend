"use client";

import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import type { PortfolioData, ResumeData } from "@/types";
import type { ContentDomain } from "./content-scope";

export type ApplicationAssetAcceptPayload = {
  kind: "application_asset";
  content: string;
  assetType: ApplicationAssetApiType;
  assetId?: string | null;
  role?: string;
  company?: string;
  jobDescription?: string;
  contactName?: string;
};

export type ContentGenAcceptPayload = {
  kind: "content_gen";
  content: string;
  topic: string;
  funnel: ContentGenFunnel | null;
  assetId?: string | null;
};

export type ResumeAcceptPayload = {
  kind: "resume";
  resume: ResumeData;
};

export type PortfolioAcceptPayload = {
  kind: "portfolio";
  portfolio: PortfolioData;
};

export type LinkedInAcceptPayload = {
  kind: "linkedin";
  profileKey: string;
  profile: import("@/src/features/linkedin/api/adk-mappers").LinkedInSessionProfile;
};

export type AcceptSnapshotPayload =
  | ApplicationAssetAcceptPayload
  | ContentGenAcceptPayload
  | ResumeAcceptPayload
  | PortfolioAcceptPayload
  | LinkedInAcceptPayload;

export type AcceptSnapshot = {
  domain: ContentDomain;
  contentKey: string;
  assistantMessageId: string;
  preAcceptPayload: AcceptSnapshotPayload;
  postAcceptPayload: AcceptSnapshotPayload;
  acceptedAt: string;
};

export type AcceptSnapshotsMap = Record<string, AcceptSnapshot>;

const UI_ACCEPT_SNAPSHOTS_KEY = "ui_accept_snapshots";

function localStorageKey(userId: string, sessionId: string): string {
  return `unimad_accept_snapshots:${userId}:${sessionId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAcceptSnapshot(value: unknown): value is AcceptSnapshot {
  if (!isRecord(value)) return false;
  return (
    typeof value.assistantMessageId === "string" &&
    typeof value.contentKey === "string" &&
    typeof value.domain === "string" &&
    typeof value.acceptedAt === "string" &&
    isRecord(value.preAcceptPayload) &&
    isRecord(value.postAcceptPayload)
  );
}

export function parseAcceptSnapshotsFromAdkState(state: Record<string, unknown> | null | undefined): AcceptSnapshotsMap {
  if (!state) return {};
  const raw = state[UI_ACCEPT_SNAPSHOTS_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: AcceptSnapshotsMap = {};
  for (const [id, snapshot] of Object.entries(raw as Record<string, unknown>)) {
    if (isAcceptSnapshot(snapshot)) {
      out[id] = snapshot;
    }
  }
  return out;
}

export function loadAcceptSnapshotsFromLocalStorage(userId: string, sessionId: string): AcceptSnapshotsMap {
  if (typeof window === "undefined" || !userId || !sessionId) return {};
  try {
    const raw = window.localStorage.getItem(localStorageKey(userId, sessionId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: AcceptSnapshotsMap = {};
    for (const [id, snapshot] of Object.entries(parsed as Record<string, unknown>)) {
      if (isAcceptSnapshot(snapshot)) {
        out[id] = snapshot;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function saveAcceptSnapshotsToLocalStorage(userId: string, sessionId: string, snapshots: AcceptSnapshotsMap): void {
  if (typeof window === "undefined" || !userId || !sessionId) return;
  try {
    window.localStorage.setItem(localStorageKey(userId, sessionId), JSON.stringify(snapshots));
  } catch {
    /* ignore quota */
  }
}

export function mergeAcceptSnapshots(adk: AcceptSnapshotsMap, local: AcceptSnapshotsMap): AcceptSnapshotsMap {
  return { ...local, ...adk };
}

let inMemorySnapshots: AcceptSnapshotsMap = {};
let inMemorySnapshotSessionKey = "";

export function setAcceptSnapshotsCache(userId: string, sessionId: string, snapshots: AcceptSnapshotsMap): void {
  inMemorySnapshotSessionKey = `${userId}:${sessionId}`;
  inMemorySnapshots = { ...snapshots };
}

export function getAcceptSnapshotsCache(userId: string, sessionId: string): AcceptSnapshotsMap {
  if (inMemorySnapshotSessionKey !== `${userId}:${sessionId}`) return {};
  return inMemorySnapshots;
}

export function recordAcceptSnapshot(userId: string, sessionId: string, snapshot: AcceptSnapshot): AcceptSnapshotsMap {
  if (!userId || !sessionId || !snapshot.assistantMessageId.trim()) {
    return getAcceptSnapshotsCache(userId, sessionId);
  }
  const id = snapshot.assistantMessageId.trim();
  const next = { ...getAcceptSnapshotsCache(userId, sessionId), [id]: snapshot };
  setAcceptSnapshotsCache(userId, sessionId, next);
  saveAcceptSnapshotsToLocalStorage(userId, sessionId, next);
  return next;
}

export function pruneAcceptSnapshotsByAssistantIds(userId: string, sessionId: string, assistantIds: Iterable<string>): AcceptSnapshotsMap {
  const drop = new Set([...assistantIds].filter(Boolean));
  if (drop.size === 0) {
    return getAcceptSnapshotsCache(userId, sessionId);
  }
  const current = getAcceptSnapshotsCache(userId, sessionId);
  const next: AcceptSnapshotsMap = {};
  for (const [id, snapshot] of Object.entries(current)) {
    if (!drop.has(id)) {
      next[id] = snapshot;
    }
  }
  setAcceptSnapshotsCache(userId, sessionId, next);
  saveAcceptSnapshotsToLocalStorage(userId, sessionId, next);
  return next;
}

export function buildAcceptSnapshotStateDelta(snapshots: AcceptSnapshotsMap): Record<string, unknown> {
  return { [UI_ACCEPT_SNAPSHOTS_KEY]: snapshots };
}
