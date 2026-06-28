import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Masterclass is Ready | Unimad",
  description:
    "The exact playbook 5000+ international students used to land interviews. Join the Unimad Career Positioning System masterclass.",
  openGraph: {
    title: "Your Masterclass is Ready | Unimad",
    description:
      "The exact playbook 5000+ international students used to land interviews. Join the Unimad Career Positioning System masterclass.",
    type: "website",
    url: "https://unimad.ai/masterclass",
  },
  alternates: {
    canonical: "/masterclass",
  },
};

export default function MasterclassLayout({ children }: { children: ReactNode }) {
  return <div className="masterclass-page-bg min-h-screen overflow-x-hidden font-sans">{children}</div>;
}
