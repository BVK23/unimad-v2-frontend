"use client";

import { useSyncExternalStore } from "react";
import {
  getReviewDecisionsCache,
  getReviewDecisionsServerSnapshot,
  subscribeReviewDecisionsChanged,
  type ReviewDecisionsMap,
} from "@/features/adk-chat/review-decisions";

export const useReviewDecisions = (userId: string, sessionId: string): ReviewDecisionsMap =>
  useSyncExternalStore(subscribeReviewDecisionsChanged, () => getReviewDecisionsCache(userId, sessionId), getReviewDecisionsServerSnapshot);
