"use client";

import type { ReactNode } from "react";

type UnibotActionItemHighlightProps = {
  active: boolean;
  messageId: string;
  children: ReactNode;
  className?: string;
};

export const UnibotActionItemHighlight = ({ active, messageId, children, className = "" }: UnibotActionItemHighlightProps) => {
  return (
    <div
      data-unibot-action-highlight={active ? messageId : undefined}
      className={`relative w-full self-stretch rounded-xl transition-shadow duration-300 ${active ? "unibot-action-item-highlight" : ""} ${className}`}
    >
      {active ? <div className="pointer-events-none absolute inset-0 rounded-xl bg-brand-500/[0.06]" aria-hidden /> : null}
      <div className="relative w-full">{children}</div>
    </div>
  );
};
