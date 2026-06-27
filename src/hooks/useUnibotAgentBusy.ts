"use client";

import { useEffect, useState } from "react";

export const UNIBOT_AGENT_LOADING_EVENT = "unibot-agent-loading";

export const UNIBOT_STREAM_ACTIVITY_EVENT = "unibot-stream-activity";

export type UnibotStreamActivityDetail = {
  loading?: boolean;
  activityLabel?: string | null;
  assistantMessageId?: string | null;
};

/** True while Unibot is streaming a response (dispatched from AdkChatProvider). */
export function useUnibotAgentBusy(): boolean {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onLoading = (e: Event) => {
      const loading = Boolean((e as CustomEvent<{ loading?: boolean }>).detail?.loading);
      setBusy(loading);
    };
    window.addEventListener(UNIBOT_AGENT_LOADING_EVENT, onLoading);
    return () => window.removeEventListener(UNIBOT_AGENT_LOADING_EVENT, onLoading);
  }, []);

  return busy;
}
