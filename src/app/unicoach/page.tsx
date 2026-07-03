import { UnicoachPage } from "@/components/landing/UnicoachPage";
import type { Metadata } from "next";
import "@/components/landing/landing.css";

export const metadata: Metadata = {
  title: "Unicoach: The Unimad Career Positioning System | Unimad",
  description:
    "Unimad is free. Unicoach does it with you: four 1-on-1 calls where a coach finalises your niche, rebuilds your resume and LinkedIn, builds your portfolio and preps your interviews. 92% success rate, 4.9★ from 1,000+ students. First discovery call free.",
  openGraph: {
    title: "Unicoach: The Unimad Career Positioning System",
    description:
      "The system is free. Unicoach does it with you: a coach who fixes your niche, resume, LinkedIn, portfolio, applications and interviews, 1-on-1. First call free. Modules from £77, full system £199.",
    type: "website",
    url: "https://unimad.ai/unicoach",
  },
  alternates: {
    canonical: "/unicoach",
  },
};

export default function UnicoachRoute() {
  return <UnicoachPage />;
}
