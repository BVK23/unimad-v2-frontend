import { LandingPage } from "@/components/landing/LandingPage";
import type { Metadata } from "next";
import "@/components/landing/landing.css";

export const metadata: Metadata = {
  title: "Unimad: The platform behind 10,000+ interviews",
  description:
    "Free AI tools for international students: résumé builder, LinkedIn audit, job tracker, portfolio and more. Coach-led Career Positioning System when you're ready to go faster.",
  openGraph: {
    title: "Unimad: The platform behind 10,000+ interviews",
    description: "Free AI tools for international students: résumé builder, LinkedIn audit, job tracker, portfolio and more.",
  },
};

export default function HomePage() {
  return <LandingPage />;
}
