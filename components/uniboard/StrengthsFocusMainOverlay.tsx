"use client";

import { useStrengthsFocusStore } from "@/src/features/onboarding/strengths-focus/useStrengthsFocusStore";

export default function StrengthsFocusMainOverlay() {
  const active = useStrengthsFocusStore(s => s.active);

  if (!active) return null;

  return <div className="pointer-events-auto absolute inset-0 z-[110] bg-white/50 backdrop-blur-md dark:bg-slate-950/55" aria-hidden />;
}
