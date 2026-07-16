import type { ReactNode } from "react";
import type { PortfolioHighlightKind } from "@/features/adk-chat/adkPortfolioHighlightDiff";

type PortfolioAdkBlockHighlightProps = {
  kind?: PortfolioHighlightKind;
  children: ReactNode;
  className?: string;
};

/**
 * Resume-style ADK gutter: a thin absolute stripe inside the block padding.
 * Does not change layout/padding (no border, no inset ring) so hover UX stays intact.
 */
export const PortfolioAdkBlockHighlight = ({ kind, children, className = "" }: PortfolioAdkBlockHighlightProps) => {
  if (!kind) {
    if (!className.trim()) {
      return <>{children}</>;
    }
    return <div className={className.trim()}>{children}</div>;
  }

  const stripeClass = kind === "added" ? "bg-emerald-500" : kind === "removed" ? "bg-red-400" : "bg-amber-500";

  return (
    <div className={`relative h-full w-full ${className}`.trim()}>
      <div aria-hidden className={`pointer-events-none absolute left-3 top-4 bottom-4 z-20 w-0.5 rounded-full ${stripeClass}`} />
      {children}
    </div>
  );
};
