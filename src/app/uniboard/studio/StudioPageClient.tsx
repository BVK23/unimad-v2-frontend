"use client";

import StudioMainV2 from "@/components/studio/StudioMainV2";
import { parseStudioSearchParams } from "@/lib/jobs/prepare-application-url";
import type { GeneratorContext } from "@/types/jobs";
import { useSearchParams } from "next/navigation";

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
