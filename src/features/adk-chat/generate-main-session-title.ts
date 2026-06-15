"use client";

import { generateUnibotChatTitleAction } from "./chat-title-actions";
import { isUntitledMainSessionTitle } from "./constants";
import { ensureMainSessionRegistered } from "./ensure-main-session-registered";
import { pickTitleSourcePromptFromHistory } from "./pick-title-source-prompt";
import { getRegistryRow, upsertRegistryRow } from "./session-registry";
import type { AgentMessage } from "./types";
import { listUnibotAdkSessionsAction } from "./unibot-adk-session-actions";

const TITLE_RETRY_DELAY_MS = 1500;
const titleGenInFlight = new Set<string>();

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isTitleGenerationFailure(result: { success: boolean; title?: string; error?: string }): boolean {
  return !result.success || !result.title || isUntitledMainSessionTitle(result.title);
}

/**
 * Generate a title from a user prompt when the main session is still untitled.
 * Used after live composer sends and on reload backfill from ADK history.
 * POST session_id + user_input → Django replaces Untitled Thread with a generated title.
 */
export async function generateMainSessionTitleIfNeeded(
  mainSessionId: string,
  userPrompt: string,
  onRegistryRefresh: () => void | Promise<void>
): Promise<void> {
  const sessionId = mainSessionId.trim();
  const prompt = userPrompt.trim();
  if (!sessionId || !prompt) return;

  const existing = getRegistryRow(sessionId);
  if (existing?.title && !isUntitledMainSessionTitle(existing.title)) {
    return;
  }

  if (titleGenInFlight.has(sessionId)) return;
  titleGenInFlight.add(sessionId);

  try {
    await ensureMainSessionRegistered(sessionId);

    let result = await generateUnibotChatTitleAction(prompt, sessionId);

    if (isTitleGenerationFailure(result)) {
      if (result.error) {
        console.warn("[generateMainSessionTitleIfNeeded]", result.error);
      }

      const rowBeforeRetry = getRegistryRow(sessionId);
      const stillUntitled = !rowBeforeRetry?.title || isUntitledMainSessionTitle(rowBeforeRetry.title);

      if (stillUntitled && !result.success) {
        await sleep(TITLE_RETRY_DELAY_MS);
        const rowAfterWait = getRegistryRow(sessionId);
        if (rowAfterWait?.title && !isUntitledMainSessionTitle(rowAfterWait.title)) {
          return;
        }
        result = await generateUnibotChatTitleAction(prompt, sessionId);
        if (isTitleGenerationFailure(result)) {
          if (result.error) {
            console.warn("[generateMainSessionTitleIfNeeded] retry failed:", result.error);
          }
          return;
        }
      } else {
        return;
      }
    }

    const generatedTitle = result.title!.trim();
    const prior = getRegistryRow(sessionId);
    upsertRegistryRow({
      adk_session_id: sessionId,
      kind: "main",
      parent_adk_session_id: prior?.parent_adk_session_id ?? null,
      title: generatedTitle,
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
  } finally {
    titleGenInFlight.delete(sessionId);
  }
}

/** On reload: title from the first eligible user message in main ADK history if still untitled. */
export async function backfillMainSessionTitleFromHistory(
  mainSessionId: string,
  historicalMessages: AgentMessage[],
  onRegistryRefresh: () => void | Promise<void>
): Promise<void> {
  const sessionId = mainSessionId.trim();
  if (!sessionId || historicalMessages.length === 0) return;

  const existing = getRegistryRow(sessionId);
  if (existing?.title && !isUntitledMainSessionTitle(existing.title)) {
    return;
  }

  const prompt = pickTitleSourcePromptFromHistory(historicalMessages);
  if (!prompt) return;

  await generateMainSessionTitleIfNeeded(sessionId, prompt, onRegistryRefresh);
}
