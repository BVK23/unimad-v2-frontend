"use client";

import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import type { ContentGenPlannerAction } from "@/features/content-lab/api/content-gen-events";
import { parsePlannerChipsWithFallback } from "@/features/content-lab/api/extractPlannerChips";

type ContentGenTopicChipsProps = {
  botMessage: string;
  topicId?: string;
  onAffirmationClick: (label: string, funnel: ContentGenFunnel | null) => void;
  onUseTopic: (topic: string, funnel: ContentGenFunnel | null) => void;
  onActionClick: (action: ContentGenPlannerAction, topicId?: string) => void;
  activeFunnel: ContentGenFunnel | null;
  /** When true, all chips on this message are hidden (user picked one). */
  chipsDismissed?: boolean;
};

export const ContentGenTopicChips = ({
  botMessage,
  topicId,
  onAffirmationClick,
  onUseTopic,
  onActionClick,
  activeFunnel,
  chipsDismissed,
}: ContentGenTopicChipsProps) => {
  if (chipsDismissed) {
    return null;
  }

  const { topics, affirmations, actions } = parsePlannerChipsWithFallback(botMessage, activeFunnel);

  if (topics.length === 0 && affirmations.length === 0 && actions.length === 0) {
    return null;
  }

  const compactChipClass = "text-left text-xs font-medium px-3.5 py-2 rounded-full transition-colors";

  return (
    <div className="mt-2 flex w-full max-w-full flex-col gap-2">
      {affirmations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {affirmations.map(label => (
            <button
              key={`aff-${label}`}
              type="button"
              onClick={() => onAffirmationClick(label, activeFunnel)}
              className={`${compactChipClass} border border-slate-200 bg-white text-slate-700 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      {topics.map(title => (
        <button
          key={`topic-${title}`}
          type="button"
          onClick={() => onUseTopic(title, activeFunnel)}
          className="w-full rounded-xl border border-brand-200/80 bg-brand-50 px-3.5 py-2.5 text-left text-xs font-medium leading-snug text-brand-800 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-100 dark:border-brand-800/50 dark:bg-brand-950/30 dark:text-brand-100 dark:hover:bg-brand-950/50"
          aria-label={`Use as topic: ${title}`}
        >
          <span className="block whitespace-normal">{title}</span>
        </button>
      ))}
      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actions.map(action => (
            <button
              key={`action-${action.id}-${action.label}`}
              type="button"
              onClick={() => onActionClick(action, topicId)}
              className={`${compactChipClass} bg-slate-900 text-white hover:opacity-90 dark:bg-slate-100 dark:text-slate-900`}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
