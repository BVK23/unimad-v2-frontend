"use client";

import LinkedInDashboard from "@/components/LinkedInDashboard";

export default function LinkedInPageClient() {
  const handleImproveWithAI = (text: string) => {
    // Could be wired to ChatSidebar via context in a later iteration
    console.log("Improve with AI:", text);
  };
  return <LinkedInDashboard onImprove={handleImproveWithAI} />;
}
