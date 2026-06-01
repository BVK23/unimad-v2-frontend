import type { ReactNode } from "react";
import type { PortfolioHighlightKind } from "@/features/adk-chat/adkPortfolioHighlightDiff";

type PortfolioAdkBlockHighlightProps = {
  kind?: PortfolioHighlightKind;
  children: ReactNode;
  className?: string;
};

export const PortfolioAdkBlockHighlight = ({ kind, children, className = "" }: PortfolioAdkBlockHighlightProps) => {
  if (!kind) {
    if (!className.trim()) {
      return <>{children}</>;
    }
    return <div className={className.trim()}>{children}</div>;
  }

  // box-shadow avoids ring-offset layout shifts that retrigger ResizeObserver → height loops
  const shadowClass =
    kind === "added"
      ? "shadow-[inset_0_0_0_2px_rgba(34,197,94,0.85)]"
      : kind === "removed"
        ? "shadow-[inset_0_0_0_2px_rgba(248,113,113,0.7)] opacity-60"
        : "shadow-[inset_0_0_0_2px_rgba(245,158,11,0.85)]";

  return <div className={`h-full w-full rounded-[2rem] ${shadowClass} ${className}`.trim()}>{children}</div>;
};
