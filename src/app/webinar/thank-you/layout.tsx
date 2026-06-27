import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're Registered | Unimad Masterclass",
  description: "Your Masterclass seat is confirmed. Log into Unimad to start building your career positioning system.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/webinar/thank-you",
  },
};

export default function WebinarThankYouLayout({ children }: { children: ReactNode }) {
  return <div className="font-sans">{children}</div>;
}
