"use client";

import { generateUnibotChatTitleAction } from "./chat-title-actions";
import { isUntitledMainSessionTitle } from "./constants";
import { ensureMainSessionRegistered } from "./ensure-main-session-registered";
import { getRegistryRow, upsertRegistryRow } from "./session-registry";
import { listUnibotAdkSessionsAction } from "./unibot-adk-session-actions";

/**
 * Call once after the user sends a message from the Unibot composer (not Improve handoffs).
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

  await ensureMainSessionRegistered(sessionId);

  const result = await generateUnibotChatTitleAction(prompt, sessionId);
  if (!result.success || !result.title || isUntitledMainSessionTitle(result.title)) {
    if (result.error) {
      console.warn("[generateMainSessionTitleIfNeeded]", result.error);
    }
    return;
  }

  const generatedTitle = result.title.trim();
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
}
