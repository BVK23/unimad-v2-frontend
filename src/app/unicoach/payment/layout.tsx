import type { Metadata } from "next";
import { JetBrains_Mono, Onest } from "next/font/google";

const onest = Onest({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-onest",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unicoach — Start your programme",
  description: "Join the UniCoach programme. One-time payment, personal strategy calls, and a full career transformation system.",
};

export default function UnicoachPaymentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${onest.variable} ${jetbrainsMono.variable} ${onest.className} min-h-screen bg-[#FAF9F6] antialiased`}>{children}</div>
  );
}
