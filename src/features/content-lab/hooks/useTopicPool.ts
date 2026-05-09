"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { extractPlannerTopics } from "@/features/content-lab/api/extractPlannerTopics";
import { fetchPlannerTopicsFromUnibot } from "@/features/content-lab/server-actions/content-lab-actions";

type UseTopicPoolParams = {
  currentTopic: string;
  onApplyTopic: (topic: string) => void;
};

/**
 * Client-side topic pool: rotate through suggestions from the planner Unibot.
 * Refetch only when the pool is empty. First request uses message ""; later requests use "Continue".
 */
export const useTopicPool = ({ currentTopic, onApplyTopic }: UseTopicPoolParams) => {
  const poolRef = useRef<string[]>([]);
  const hasCompletedInitialPlannerRequest = useRef(false);
  const currentTopicRef = useRef(currentTopic);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [topicPoolError, setTopicPoolError] = useState<string | null>(null);

  useEffect(() => {
    currentTopicRef.current = currentTopic;
  }, [currentTopic]);

  const refillPool = useCallback(async () => {
    const message = hasCompletedInitialPlannerRequest.current ? "Continue" : "";
    const { response } = await fetchPlannerTopicsFromUnibot(message);
    hasCompletedInitialPlannerRequest.current = true;

    const topics = extractPlannerTopics(response);
    const trimmedCurrent = currentTopicRef.current.trim().toLowerCase();
    const seen = new Set(poolRef.current.map(t => t.toLowerCase()));
    for (const t of topics) {
      const key = t.toLowerCase();
      if (!key || key === trimmedCurrent || seen.has(key)) continue;
      seen.add(key);
      poolRef.current.push(t);
    }
  }, []);

  const applyNextTopicFromPool = useCallback(async () => {
    setTopicPoolError(null);
    setIsLoadingTopics(true);
    try {
      if (poolRef.current.length === 0) {
        await refillPool();
      }

      let next = poolRef.current.shift();
      if (next) {
        onApplyTopic(next);
        return;
      }

      await refillPool();
      next = poolRef.current.shift();
      if (next) {
        onApplyTopic(next);
        return;
      }

      setTopicPoolError("No topic suggestions returned. Try again in a moment.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load topics";
      setTopicPoolError(msg);
    } finally {
      setIsLoadingTopics(false);
    }
  }, [onApplyTopic, refillPool]);

  return {
    applyNextTopicFromPool,
    isLoadingTopics,
    topicPoolError,
    setTopicPoolError,
  };
};
