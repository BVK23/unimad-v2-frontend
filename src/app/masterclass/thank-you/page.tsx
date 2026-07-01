"use client";

import { useEffect } from "react";
import { UnimadLogo } from "@/components/unimad-logo";
import confetti from "canvas-confetti";
import { ArrowRight, CalendarCheck, ListChecks, Mail } from "lucide-react";
import Link from "next/link";

export default function MasterclassThankYouPage() {
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.55 },
      colors: ["#2563EB", "#00BA00", "#ffffff", "#60A5FA"],
      disableForReducedMotion: true,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F6F8FD] to-white text-slate-900">
      <header className="flex justify-center px-4 py-6 sm:px-6">
        <Link href="/">
          <UnimadLogo className="h-8 w-auto text-primary-blue sm:h-9" />
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 sm:py-20">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 sm:mb-8 sm:h-20 sm:w-20">
          <CalendarCheck className="h-8 w-8 sm:h-10 sm:w-10" />
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:mb-5 sm:text-4xl md:text-5xl">
          You&apos;re in. See you at the Masterclass.
        </h1>

        <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-600 sm:mb-10 sm:text-lg">
          Your seat is confirmed. Check your email for the session link and a short prep checklist.
        </p>

        <div className="mb-8 space-y-4 rounded-2xl border border-slate-200/70 bg-white p-6 text-left shadow-sm sm:mb-10 sm:space-y-5 sm:rounded-3xl sm:p-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900 sm:text-base">Check your email</p>
              <p className="mt-1 text-sm text-slate-600 sm:text-base">
                Your confirmation email has the calendar invite and meeting link. Check spam if you don&apos;t see it in a few minutes.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 sm:gap-4">
            <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900 sm:text-base">Do the prep tasks in the email</p>
              <p className="mt-1 text-sm text-slate-600 sm:text-base">
                The email includes a few quick tasks to complete before the session. That&apos;s your prep for the Masterclass.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-[#346DE0] px-6 py-3 text-sm font-semibold text-white transition-all hover:shadow-[0_0_4px_0_rgba(52,109,224,0.60)] sm:px-8 sm:py-3.5 sm:text-base"
        >
          Back to Unimad
          <ArrowRight className="h-4 w-4" />
        </Link>
      </main>
    </div>
  );
}
