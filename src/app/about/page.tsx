import { AboutPage } from "@/components/landing/AboutPage";
import type { Metadata } from "next";
import "@/components/landing/landing.css";

export const metadata: Metadata = {
  title: "About Us: Built by international students, for international students | Unimad",
  description:
    "Unimad was built by international students who lived the job-search grind. One platform that brings resumes, LinkedIn, portfolios, cold emails, VPDs, interview prep and Unibot together, because no student should figure this journey out alone.",
  openGraph: {
    title: "About Unimad",
    description:
      "Built by international students, for international students. One platform that brings every part of the job search together.",
    type: "website",
    url: "https://unimad.ai/about",
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutRoute() {
  return <AboutPage />;
}
