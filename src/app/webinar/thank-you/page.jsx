"use client";

import { useEffect } from "react";
import { UnimadLogo } from "@/components/unimad-logo";
import confetti from "canvas-confetti";
import { ArrowRight, CalendarCheck, CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";

export default function WebinarThankYouPage() {
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.55 },
      colors: ["#2563EB", "#346DE0", "#ffffff", "#60A5FA"],
      disableForReducedMotion: true,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-center items-center">
          <Link href="/">
            <UnimadLogo className="h-8 sm:h-9 w-auto text-[#346DE0]" />
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-32 sm:pt-40 pb-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-100 text-blue-600 mb-6 sm:mb-8">
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={2} />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4 sm:mb-5 leading-tight">
          You&apos;re in!
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed mb-8 sm:mb-10 max-w-xl mx-auto">
          Your seat for the Unimad Masterclass is confirmed. We&apos;ve sent a calendar invite to your email with everything you need for
          Thursday, 18th June.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12 text-left max-w-md mx-auto">
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
            <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">Check your inbox for the confirmation email and calendar link.</p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
            <CalendarCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">Add the session to your calendar so you don&apos;t miss it.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl sm:rounded-[40px] border border-slate-200/60 p-8 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
            While you wait, log into Unimad and start building your Career Positioning System.
          </p>
          <Link
            href="/uniboard/portfolio"
            className="group inline-flex items-center justify-center gap-2 sm:gap-3 px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-full font-bold text-sm sm:text-base shadow-[0_20px_40px_rgba(37,99,235,0.35)] transition-all transform hover:-translate-y-1 w-full sm:w-auto"
          >
            Log into Unimad
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      <footer className="py-8 border-t border-slate-100 px-4 sm:px-6">
        <p className="text-slate-400 text-[10px] sm:text-xs font-normal text-center">
          © 2025 Unicoach. Empowering international students globally.
        </p>
      </footer>
    </div>
  );
}
