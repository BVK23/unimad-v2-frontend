import type { Metadata } from "next";

import { UniLandingPage } from "@/components/uni-landing/UniLandingPage";

export const metadata: Metadata = {
  title: "Unimad — The platform behind 200+ job offers",
  description:
    "Stop getting ghosted by recruiters. A completely free toolkit to build a personal brand that gets you noticed — resumes, LinkedIn, portfolio, tailored applications. No paywalls. No catch.",
  openGraph: {
    title: "Unimad — The platform behind 200+ job offers",
    description:
      "A completely free toolkit to build a personal brand that gets you noticed — resumes, LinkedIn, portfolio, tailored applications.",
  },
};

export default function HomePage() {
  return <UniLandingPage />;
}
