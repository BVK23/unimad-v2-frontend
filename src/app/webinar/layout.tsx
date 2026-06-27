import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masterclass - Stop Chasing Jobs. Make Recruiters DM You. | Unimad",
  description:
    "Join our free 60-min Masterclass for international students. Learn the AI-powered Unimad System to bypass rejection filters and land interviews in 30 days.",
  openGraph: {
    title: "Masterclass - Stop Chasing Jobs. Make Recruiters DM You. | Unimad",
    description:
      "Join our free 60-min Masterclass for international students. Learn the AI-powered Unimad System to bypass rejection filters and land interviews in 30 days.",
    type: "website",
    url: "https://unimad.ai/webinar",
  },
  alternates: {
    canonical: "/webinar",
  },
};

export default function WebinarLayout({ children }: { children: ReactNode }) {
  return <div className="font-sans">{children}</div>;
}
