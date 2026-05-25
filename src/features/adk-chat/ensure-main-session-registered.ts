"use client";

import { UNTITLED_THREAD_TITLE } from "./constants";
import { getRegistryRow, upsertRegistryRow } from "./session-registry";
import { registerUnibotAdkSessionAction } from "./unibot-adk-session-actions";

/** Ensure Django registry has a main row before title generation or other registry writes. */
export async function ensureMainSessionRegistered(mainSessionId: string): Promise<void> {
  if (!mainSessionId.trim()) return;
  if (getRegistryRow(mainSessionId)) return;

  const reg = await registerUnibotAdkSessionAction({
    adk_session_id: mainSessionId,
    kind: "main",
    title: UNTITLED_THREAD_TITLE,
  });
  if (reg.success && reg.session) {
    upsertRegistryRow(reg.session);
  }
}
