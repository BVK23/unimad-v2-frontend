"use client";

import StudioMainV2 from "@/components/studio/StudioMainV2";
import type { GeneratorContext, ContentGeneratorType } from "@/types/jobs";
import { useSearchParams } from "next/navigation";

export default function StudioPageClient() {
  const searchParams = useSearchParams();
  const initialAssetId = searchParams.get("id");

  const initialContext: GeneratorContext | null =
    searchParams.get("type") || searchParams.get("jobId")
      ? {
          type: (searchParams.get("type") as ContentGeneratorType) ?? "cover-letter",
          jobId: searchParams.get("jobId") ?? undefined,
          company: searchParams.get("company") ?? undefined,
          role: searchParams.get("role") ?? undefined,
          description: searchParams.get("description") ?? undefined,
          recipientName: searchParams.get("recipientName") ?? undefined,
          fromInterviewVpd: searchParams.get("interviewVpd") === "1",
        }
      : null;

  return <StudioMainV2 initialContext={initialContext} initialAssetId={initialAssetId} />;
}
