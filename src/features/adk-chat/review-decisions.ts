"use client";

export type ReviewDecision = "accepted" | "discarded";

export type ReviewDecisionsMap = Record<string, ReviewDecision>;

const EMPTY_REVIEW_DECISIONS: ReviewDecisionsMap = Object.freeze({});

const UI_REVIEW_DECISIONS_KEY = "ui_review_decisions";

function localStorageKey(userId: string, sessionId: string): string {
  return `unimad_review_decisions:${userId}:${sessionId}`;
}

export function parseReviewDecisionsFromAdkState(state: Record<string, unknown> | null | undefined): ReviewDecisionsMap {
  if (!state) return {};
  const raw = state[UI_REVIEW_DECISIONS_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: ReviewDecisionsMap = {};
  for (const [id, decision] of Object.entries(raw as Record<string, unknown>)) {
    if (decision === "accepted" || decision === "discarded") {
      out[id] = decision;
    }
  }
  return out;
}

export function loadReviewDecisionsFromLocalStorage(userId: string, sessionId: string): ReviewDecisionsMap {
  if (typeof window === "undefined" || !userId || !sessionId) return {};
  try {
    const raw = window.localStorage.getItem(localStorageKey(userId, sessionId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: ReviewDecisionsMap = {};
    for (const [id, decision] of Object.entries(parsed as Record<string, unknown>)) {
      if (decision === "accepted" || decision === "discarded") {
        out[id] = decision;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function saveReviewDecisionsToLocalStorage(userId: string, sessionId: string, decisions: ReviewDecisionsMap): void {
  if (typeof window === "undefined" || !userId || !sessionId) return;
  try {
    window.localStorage.setItem(localStorageKey(userId, sessionId), JSON.stringify(decisions));
  } catch {
    /* ignore quota */
  }
}

export function mergeReviewDecisions(adk: ReviewDecisionsMap, local: ReviewDecisionsMap): ReviewDecisionsMap {
  return { ...local, ...adk };
}

let inMemoryDecisions: ReviewDecisionsMap = EMPTY_REVIEW_DECISIONS;
let inMemorySessionKey = "";
const reviewDecisionsListeners = new Set<() => void>();

const notifyReviewDecisionsListeners = (): void => {
  reviewDecisionsListeners.forEach(listener => listener());
};

export function subscribeReviewDecisionsChanged(listener: () => void): () => void {
  reviewDecisionsListeners.add(listener);
  return () => {
    reviewDecisionsListeners.delete(listener);
  };
}

export function setReviewDecisionsCache(userId: string, sessionId: string, decisions: ReviewDecisionsMap): void {
  inMemorySessionKey = `${userId}:${sessionId}`;
  inMemoryDecisions = { ...decisions };
  notifyReviewDecisionsListeners();
}

export function getReviewDecisionsCache(userId: string, sessionId: string): ReviewDecisionsMap {
  if (inMemorySessionKey !== `${userId}:${sessionId}`) return EMPTY_REVIEW_DECISIONS;
  return inMemoryDecisions;
}

export function getReviewDecisionsServerSnapshot(): ReviewDecisionsMap {
  return EMPTY_REVIEW_DECISIONS;
}

export function shouldOfferDraftReview(userId: string, sessionId: string, assistantMessageId: string | null | undefined): boolean {
  if (!assistantMessageId?.trim()) return true;
  const id = assistantMessageId.trim();
  const cached = getReviewDecisionsCache(userId, sessionId);
  return !(id in cached);
}

export function recordReviewDecision(
  userId: string,
  sessionId: string,
  assistantMessageId: string | null | undefined,
  decision: ReviewDecision
): ReviewDecisionsMap {
  if (!assistantMessageId?.trim() || !userId || !sessionId) {
    return getReviewDecisionsCache(userId, sessionId);
  }
  const id = assistantMessageId.trim();
  const next = { ...getReviewDecisionsCache(userId, sessionId), [id]: decision };
  setReviewDecisionsCache(userId, sessionId, next);
  saveReviewDecisionsToLocalStorage(userId, sessionId, next);
  return next;
}

export function pruneReviewDecisionsByAssistantIds(userId: string, sessionId: string, assistantIds: Iterable<string>): ReviewDecisionsMap {
  const drop = new Set([...assistantIds].filter(Boolean));
  if (drop.size === 0) {
    return getReviewDecisionsCache(userId, sessionId);
  }
  const current = getReviewDecisionsCache(userId, sessionId);
  const next: ReviewDecisionsMap = {};
  for (const [id, decision] of Object.entries(current)) {
    if (!drop.has(id)) {
      next[id] = decision;
    }
  }
  setReviewDecisionsCache(userId, sessionId, next);
  saveReviewDecisionsToLocalStorage(userId, sessionId, next);
  return next;
}

export function buildReviewDecisionStateDelta(decisions: ReviewDecisionsMap): Record<string, unknown> {
  return { [UI_REVIEW_DECISIONS_KEY]: decisions };
}

export async function persistReviewDecision(
  userId: string,
  sessionId: string,
  assistantMessageId: string | null | undefined,
  decision: ReviewDecision,
  syncSessionState: (userId: string, sessionId: string, delta: Record<string, unknown>) => Promise<{ success: boolean }>
): Promise<void> {
  const next = recordReviewDecision(userId, sessionId, assistantMessageId, decision);
  const result = await syncSessionState(userId, sessionId, buildReviewDecisionStateDelta(next));
  if (!result.success) {
    /* localStorage already updated as fallback */
  }
}
