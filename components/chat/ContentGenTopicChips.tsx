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

  return (
    <div className="flex flex-wrap gap-2 mt-2 max-w-full">
      {affirmations.map(label => (
        <button
          key={`aff-${label}`}
          type="button"
          onClick={() => onAffirmationClick(label, activeFunnel)}
          className="text-left text-[11px] font-medium px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          {label}
        </button>
      ))}
      {topics.map(title => (
        <button
          key={`topic-${title}`}
          type="button"
          onClick={() => onUseTopic(title, activeFunnel)}
          className="text-left text-[11px] font-semibold px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors"
          aria-label={`Use as topic: ${title}`}
          title={title}
        >
          {title.length > 56 ? `${title.slice(0, 56)}…` : title}
        </button>
      ))}
      {actions.map(action => (
        <button
          key={`action-${action.id}-${action.label}`}
          type="button"
          onClick={() => onActionClick(action, topicId)}
          className="text-left text-[11px] font-semibold px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};
