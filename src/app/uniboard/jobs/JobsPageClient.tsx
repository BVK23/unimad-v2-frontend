"use client";

import { useRouter } from "next/navigation";
import JobsMain from "@/components/jobs/JobsMain";
import type { GeneratorContext } from "@/types/jobs";

export default function JobsPageClient() {
  const router = useRouter();

  const handleNavigateToStudio = (context: GeneratorContext) => {
    // Navigate to studio; context can be passed via searchParams or context in a later iteration
    const params = new URLSearchParams();
    if (context.jobId) params.set("jobId", context.jobId);
    if (context.company) params.set("company", context.company);
    if (context.role) params.set("role", context.role);
    if (context.type) params.set("type", context.type);
    router.push(`/uniboard/studio?${params.toString()}`);
  };

  return <JobsMain onNavigateToStudio={handleNavigateToStudio} />;
}
