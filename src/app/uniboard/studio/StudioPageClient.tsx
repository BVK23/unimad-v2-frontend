"use client";

import { useSearchParams } from "next/navigation";
import StudioMainV2 from "@/components/studio/StudioMainV2";
import type { GeneratorContext, ContentGeneratorType } from "@/types/jobs";

export default function StudioPageClient() {
  const searchParams = useSearchParams();

  const initialContext: GeneratorContext | null =
    searchParams.get("type") || searchParams.get("jobId")
      ? {
          type: (searchParams.get("type") as ContentGeneratorType) ?? "cover-letter",
          jobId: searchParams.get("jobId") ?? undefined,
          company: searchParams.get("company") ?? undefined,
          role: searchParams.get("role") ?? undefined,
          description: searchParams.get("description") ?? undefined,
          recipientName: searchParams.get("recipientName") ?? undefined,
        }
      : null;

  return <StudioMainV2 initialContext={initialContext} />;
}
