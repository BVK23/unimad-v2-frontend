"use client";

import { parseStudioSearchParams } from "@/lib/jobs/prepare-application-url";
import type { GeneratorContext } from "@/types/jobs";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const StudioMainV2 = dynamic(() => import("@/components/studio/StudioMainV2"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-50 text-sm text-slate-400 dark:bg-slate-950 dark:text-slate-500">
      Loading studio…
    </div>
  ),
});

export default function StudioPageClient() {
  const searchParams = useSearchParams();
  const parsed = parseStudioSearchParams(searchParams);

  const initialContext: GeneratorContext | null =
    parsed.id || parsed.jobId || parsed.type
      ? {
          type: parsed.type ?? "cover-letter",
          jobId: parsed.jobId,
          assetId: parsed.id,
          fromPrepareApplication: parsed.fromPrepareApplication,
          navigate: parsed.navigate,
          openImproveMode: parsed.improve,
          fromInterviewVpd: parsed.interviewVpd,
        }
      : null;

  return <StudioMainV2 initialContext={initialContext} initialAssetId={parsed.id ?? null} />;
}
