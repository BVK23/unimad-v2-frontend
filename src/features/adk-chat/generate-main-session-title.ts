"use client";

import { generateUnibotChatTitleAction } from "./chat-title-actions";
import { isUntitledMainSessionTitle, mainSessionNeedsTitleGeneration } from "./constants";
import { ensureMainSessionRegistered } from "./ensure-main-session-registered";
import { markMainSessionHasUserPrompt } from "./main-session-activity";
import { pickTitleSourcePromptFromHistory } from "./pick-title-source-prompt";
import { getRegistryRow, upsertRegistryRow } from "./session-registry";
import type { AgentMessage } from "./types";
import { listUnibotAdkSessionsAction } from "./unibot-adk-session-actions";

const titleGenInFlight = new Set<string>();

function isTitleGenerationFailure(result: { success: boolean; title?: string; error?: string }): boolean {
  return !result.success || !result.title || isUntitledMainSessionTitle(result.title);
}

async function refreshRegistryAfterTitle(
  sessionId: string,
  generatedTitle: string,
  onRegistryRefresh: () => void | Promise<void>
): Promise<void> {
  const prior = getRegistryRow(sessionId);
  upsertRegistryRow({
    adk_session_id: sessionId,
    kind: "main",
    parent_adk_session_id: prior?.parent_adk_session_id ?? null,
    title: generatedTitle,
    content_key: prior?.content_key ?? `general:${sessionId}`,
    feature: prior?.feature ?? null,
    feature_id: prior?.feature_id ?? null,
    section: prior?.section ?? null,
    entry_id: prior?.entry_id ?? "",
    created_at: prior?.created_at,
  });

  const list = await listUnibotAdkSessionsAction();
  if (list.success) {
    const { setSessionRegistry } = await import("./session-registry");
    setSessionRegistry(list.sessions);
  }

  await onRegistryRefresh();
}

/**
 * Fire-and-forget title generation (single backend call, no client retries).
 * Retries when still untitled or stuck on a Convo DD-MM-YY fallback.
 */
export async function generateMainSessionTitleIfNeeded(
  mainSessionId: string,
  userPrompt: string,
  onRegistryRefresh: () => void | Promise<void>,
  userId?: string
): Promise<void> {
  const sessionId = mainSessionId.trim();
  const prompt = userPrompt.trim();
  if (!sessionId || !prompt) return;

  if (userId) {
    markMainSessionHasUserPrompt(userId, sessionId);
  }

  const existing = getRegistryRow(sessionId);
  if (existing?.title && !mainSessionNeedsTitleGeneration(existing.title)) {
    return;
  }

  if (titleGenInFlight.has(sessionId)) return;
  titleGenInFlight.add(sessionId);

  try {
    await ensureMainSessionRegistered(sessionId);

    const result = await generateUnibotChatTitleAction(prompt, sessionId);
    if (isTitleGenerationFailure(result)) {
      if (result.error) {
        console.warn("[generateMainSessionTitleIfNeeded]", result.error);
      }
      return;
    }

    await refreshRegistryAfterTitle(sessionId, result.title!.trim(), onRegistryRefresh);
  } finally {
    titleGenInFlight.delete(sessionId);
  }
}

/** On reload: title from the first eligible user message in main ADK history if still untitled. */
export async function backfillMainSessionTitleFromHistory(
  mainSessionId: string,
  historicalMessages: AgentMessage[],
  onRegistryRefresh: () => void | Promise<void>,
  userId?: string
): Promise<void> {
  const sessionId = mainSessionId.trim();
  if (!sessionId || historicalMessages.length === 0) return;

  const existing = getRegistryRow(sessionId);
  if (existing?.title && !mainSessionNeedsTitleGeneration(existing.title)) {
    return;
  }

  const prompt = pickTitleSourcePromptFromHistory(historicalMessages);
  if (!prompt) return;

  if (userId) {
    markMainSessionHasUserPrompt(userId, sessionId);
  }

  await generateMainSessionTitleIfNeeded(sessionId, prompt, onRegistryRefresh, userId);
}
