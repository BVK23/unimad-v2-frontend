"use client";

import type { ReviewDecision } from "@/features/adk-chat/review-decisions";

type AdkDraftReviewDecisionStatusProps = {
  decision: ReviewDecision;
};

const STATUS_COPY: Record<ReviewDecision, string> = {
  accepted: "Accepted",
  discarded: "Discarded",
};

export const AdkDraftReviewDecisionStatus = ({ decision }: AdkDraftReviewDecisionStatusProps) => {
  const isAccepted = decision === "accepted";

  return (
    <p
      role="status"
      aria-live="polite"
      className={`max-w-full text-[10px] font-medium leading-snug tracking-wide ${
        isAccepted ? "text-emerald-600/75 dark:text-emerald-400/70" : "text-slate-400 dark:text-slate-500"
      }`}
    >
      {STATUS_COPY[decision]}
    </p>
  );
};
