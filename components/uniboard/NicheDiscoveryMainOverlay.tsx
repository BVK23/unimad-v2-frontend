"use client";

import { useNicheDiscoveryStore } from "@/features/onboarding/niche-discovery/useNicheDiscoveryStore";

export default function NicheDiscoveryMainOverlay() {
  const active = useNicheDiscoveryStore(s => s.active);

  if (!active) return null;

  return <div className="pointer-events-auto absolute inset-0 z-[110] bg-white/50 backdrop-blur-md dark:bg-slate-950/55" aria-hidden />;
}
