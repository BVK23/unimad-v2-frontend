"use client";

import { inferAssetActionMetaFromUserText } from "@/features/application-assets/api/inferAssetActionMetaFromUserText";
import type { ChatMessage } from "@/types";

/** At or below this count, sub-thread toggles load expanded; above it, collapsed. */
export const SUB_THREAD_COLLAPSE_THRESHOLD = 2;

export function shouldCollapseTopicsOnLoad(topicCount: number): boolean {
  return topicCount > SUB_THREAD_COLLAPSE_THRESHOLD;
}

function enrichNestedMessages(messages: ChatMessage[] | undefined): ChatMessage[] | undefined {
  if (!messages?.length) return messages;
  return messages.map(sub => {
    if (sub.role !== "user" || sub.assetActionMeta || !sub.text?.trim()) return sub;
    const meta = inferAssetActionMetaFromUserText(sub.text);
    return meta ? { ...sub, assetActionMeta: meta } : sub;
  });
}

/** Restore RefineActionCard metadata; expand topic threads after history load when few subs. */
export function hydrateLoadedTopicMessages(messages: ChatMessage[]): ChatMessage[] {
  const topicCount = messages.filter(msg => msg.isTopic).length;
  const collapseOnLoad = shouldCollapseTopicsOnLoad(topicCount);

  return messages.map(msg => {
    if (!msg.isTopic) return msg;
    return {
      ...msg,
      isExpanded: collapseOnLoad ? false : true,
      messages: enrichNestedMessages(msg.messages),
    };
  });
}
