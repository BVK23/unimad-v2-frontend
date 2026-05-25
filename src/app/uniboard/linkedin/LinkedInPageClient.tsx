"use client";

import LinkedInDashboard from "@/components/LinkedInDashboard";
import type { UnibotIncomingRequest } from "@/components/chat/unibot-incoming-request";
import type { GeneratorContext } from "@/types/jobs";
import { useRouter } from "next/navigation";

export default function LinkedInPageClient() {
  const router = useRouter();

  const handleImproveWithAI = (detail: Extract<UnibotIncomingRequest, { type: "improve" }>) => {
    window.dispatchEvent(new CustomEvent("open-unibot", { detail }));
  };

  const handleNavigateToStudio = (context: GeneratorContext) => {
    const params = new URLSearchParams();
    if (context.type) params.set("type", context.type);
    if (context.jobId) params.set("jobId", context.jobId);
    if (context.company) params.set("company", context.company);
    if (context.role) params.set("role", context.role);
    router.push(`/uniboard/studio?${params.toString()}`);
  };

  return <LinkedInDashboard onImprove={handleImproveWithAI} onNavigateToStudio={handleNavigateToStudio} />;
}
