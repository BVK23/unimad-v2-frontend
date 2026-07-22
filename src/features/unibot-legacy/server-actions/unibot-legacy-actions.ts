"use server";

import type { UnibotLegacyChatMessage, UnibotLegacyHomeChat } from "@/features/unibot-legacy/types";
import { authedFetch } from "@/lib/authed-fetch";

/**
 * GET `/api/unibot-home-data/` — legacy V1 home chat list (UnibotHomeChat).
 */
export async function fetchUnibotLegacyHomeChats(): Promise<UnibotLegacyHomeChat[]> {
  const res = await authedFetch(`/api/unibot-home-data/`, { method: "GET" });
  const data = (await res.json().catch(() => ({}))) as {
    home_unibot_data?: UnibotLegacyHomeChat[];
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load legacy home chats");
  }

  return Array.isArray(data.home_unibot_data) ? data.home_unibot_data : [];
}

/**
 * GET `/api/unibot-history/?sectionName=...` — flat list of user/bot messages.
 * Used only for home chat sections listed in UnibotHomeChat.
 */
export async function fetchUnibotLegacyHistory(sectionName: string): Promise<UnibotLegacyChatMessage[]> {
  const q = encodeURIComponent(sectionName);
  const res = await authedFetch(`/api/unibot-history/?sectionName=${q}`, { method: "GET" });
  const data = (await res.json().catch(() => ({}))) as {
    chat_history?: UnibotLegacyChatMessage[];
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load chat history");
  }

  return Array.isArray(data.chat_history) ? data.chat_history : [];
}
