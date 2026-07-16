"use client";

import { inferAssetActionMetaFromUserText } from "@/features/application-assets/api/inferAssetActionMetaFromUserText";
import type { ChatMessage } from "@/types";

/** Sub-threads always load collapsed; expand only via toggle or History → Reply. */
export function shouldCollapseTopicsOnLoad(_topicCount: number): boolean {
  return true;
}

function enrichNestedMessages(messages: ChatMessage[] | undefined): ChatMessage[] | undefined {
  if (!messages?.length) return messages;
  return messages.map(sub => {
    if (sub.role !== "user" || sub.assetActionMeta || !sub.text?.trim()) return sub;
    const meta = inferAssetActionMetaFromUserText(sub.text);
    return meta ? { ...sub, assetActionMeta: meta } : sub;
  });
}

/** Restore RefineActionCard metadata; keep all topic threads collapsed after history load. */
export function hydrateLoadedTopicMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map(msg => {
    if (!msg.isTopic) return msg;
    return {
      ...msg,
      isExpanded: false,
      messages: enrichNestedMessages(msg.messages),
    };
  });
}
