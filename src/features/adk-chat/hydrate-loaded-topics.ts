"use client";

import { inferAssetActionMetaFromUserText } from "@/features/application-assets/api/inferAssetActionMetaFromUserText";
import type { ChatMessage } from "@/types";

function enrichNestedMessages(messages: ChatMessage[] | undefined): ChatMessage[] | undefined {
  if (!messages?.length) return messages;
  return messages.map(sub => {
    if (sub.role !== "user" || sub.assetActionMeta || !sub.text?.trim()) return sub;
    const meta = inferAssetActionMetaFromUserText(sub.text);
    return meta ? { ...sub, assetActionMeta: meta } : sub;
  });
}

/** Restore RefineActionCard metadata and expand topic threads after history load. */
export function hydrateLoadedTopicMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map(msg => {
    if (!msg.isTopic) return msg;
    return {
      ...msg,
      isExpanded: true,
      messages: enrichNestedMessages(msg.messages),
    };
  });
}
