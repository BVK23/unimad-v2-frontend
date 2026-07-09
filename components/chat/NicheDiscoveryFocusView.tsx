"use client";

import UnibotNicheDiscoveryCard from "@/components/chat/UnibotNicheDiscoveryCard";
import { useNicheDiscoveryStore } from "@/features/onboarding/niche-discovery/useNicheDiscoveryStore";
import { useRouter } from "next/navigation";

export default function NicheDiscoveryFocusView() {
  const router = useRouter();
  const exit = useNicheDiscoveryStore(s => s.exit);

  const handleDone = () => {
    exit();
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-full px-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
        <p>Let&apos;s sharpen your target role so job matches, resume, and content feel more personal.</p>
      </div>
      <UnibotNicheDiscoveryCard onDismiss={handleDone} onSaved={handleDone} />
    </div>
  );
}
