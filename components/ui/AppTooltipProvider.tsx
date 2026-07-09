"use client";

import { TooltipProvider } from "@/components/ui/tooltip";

/** App-wide tooltip provider — zero delay for instant hover feedback. */
export function AppTooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      {children}
    </TooltipProvider>
  );
}
