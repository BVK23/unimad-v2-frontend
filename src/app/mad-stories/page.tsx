import { MadStoriesPage } from "@/components/landing/MadStoriesPage";
import type { Metadata } from "next";
import "@/components/landing/landing.css";

export const metadata: Metadata = {
  title: "MAD Stories: Real offers from real international students | Unimad",
  description:
    "Hundreds of rejections. Zero shortcuts. Read the mad stories of international students who stopped applying randomly, built a personal brand and landed the offer.",
  openGraph: {
    title: "MAD Stories | Unimad",
    description: "Real offers from real international students. Read the mad stories behind 10,000+ interviews.",
    type: "website",
    url: "https://unimad.ai/mad-stories",
  },
  alternates: {
    canonical: "/mad-stories",
  },
};

export default function MadStoriesRoute() {
  return <MadStoriesPage />;
}
