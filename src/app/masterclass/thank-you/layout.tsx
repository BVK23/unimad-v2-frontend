import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're booked | Unimad Masterclass",
  description: "Your free Unimad Masterclass seat is confirmed. Check your email for the calendar invite.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/masterclass/thank-you" },
};

export default function MasterclassThankYouLayout({ children }: { children: ReactNode }) {
  return children;
}
