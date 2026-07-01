"use client";

import { useEffect, useState } from "react";
import { UnimadLogo } from "@/components/unimad-logo";
import {
  MASTERCLASS_LEAD_SESSION_KEY,
  MASTERCLASS_WELCOME_AUTOREDIRECT_KEY,
  buildMasterclassNicheSignupUrl,
  buildMasterclassSignupUrl,
} from "@/constants/masterclass";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useRouter } from "next/navigation";

const GOLD_CONFETTI_COLORS = ["#FFD277", "#F5C842", "#F3E4A8", "#FCF6BA", "#FFF8DC", "#E3B55F", "#D4A24A", "#B8842E"];

const CONFETTI_SESSION_KEY = "masterclass_booking_confetti_fired";
const AUTO_REDIRECT_SECONDS = 10;

function getFirstName(fullName: string | undefined) {
  if (!fullName?.trim()) return null;
  return fullName.trim().split(/\s+/)[0] ?? null;
}

function fireGoldConfetti() {
  confetti({
    particleCount: 160,
    spread: 80,
    origin: { y: 0.45 },
    ticks: 260,
    disableForReducedMotion: true,
    colors: [...GOLD_CONFETTI_COLORS],
  });
}

function readLeadSession(): { firstName: string | null; leadUid: string | null; shouldAutoRedirect: boolean } {
  if (typeof window === "undefined") {
    return { firstName: null, leadUid: null, shouldAutoRedirect: false };
  }

  let firstName: string | null = null;
  let leadUid: string | null = null;

  try {
    const raw = sessionStorage.getItem(MASTERCLASS_LEAD_SESSION_KEY);
    if (raw) {
      const lead = JSON.parse(raw) as { name?: string; uid?: string; leadId?: string | number };
      firstName = getFirstName(lead.name);
      leadUid = lead.uid || (lead.leadId != null ? String(lead.leadId) : null);
    }
  } catch {
    // Ignore malformed session data.
  }

  return {
    firstName,
    leadUid,
    shouldAutoRedirect: sessionStorage.getItem(MASTERCLASS_WELCOME_AUTOREDIRECT_KEY) === "niche",
  };
}

export default function MasterclassBookingGatePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStatus();
  const [{ firstName, leadUid, shouldAutoRedirect }] = useState(readLeadSession);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    document.body.classList.add("masterclass-page");
    document.documentElement.classList.add("masterclass-page");

    if (typeof window !== "undefined" && !sessionStorage.getItem(CONFETTI_SESSION_KEY)) {
      sessionStorage.setItem(CONFETTI_SESSION_KEY, "1");
      fireGoldConfetti();
    }

    return () => {
      document.body.classList.remove("masterclass-page");
      document.documentElement.classList.remove("masterclass-page");
    };
  }, []);

  useEffect(() => {
    if (isLoading || !shouldAutoRedirect || !isAuthenticated) return;

    let remaining = AUTO_REDIRECT_SECONDS;
    const interval = window.setInterval(() => {
      setCountdown(remaining);
      if (remaining <= 0) {
        window.clearInterval(interval);
        sessionStorage.removeItem(MASTERCLASS_WELCOME_AUTOREDIRECT_KEY);
        router.push("/uniboard/unicoach?tab=niche");
        return;
      }
      remaining -= 1;
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isLoading, isAuthenticated, shouldAutoRedirect, router]);

  const signupPath = isAuthenticated
    ? "/uniboard/unicoach?tab=niche"
    : leadUid
      ? buildMasterclassNicheSignupUrl(leadUid)
      : buildMasterclassSignupUrl("discovery");

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden text-[#eaeaea] selection:bg-[#346de0]/30">
      <div className="masterclass-hero-glow" aria-hidden />
      <div className="masterclass-dot-grid-overlay" aria-hidden />

      <header className="relative z-10 border-b border-white/[0.05] bg-[#0a0a0a]/85 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-3.5 sm:px-6 sm:py-4">
          <Link href="/masterclass" className="shrink-0">
            <UnimadLogo className="h-[17px] w-auto text-white sm:h-[20px]" />
          </Link>
        </div>
      </header>

      <main className="relative z-[1] mx-auto flex min-h-[calc(100vh-58px)] max-w-3xl flex-col items-center justify-center px-6 py-12 text-center sm:min-h-[calc(100vh-66px)] sm:px-8">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8 sm:gap-10">
          <div className="space-y-5">
            <h1 className="text-balance text-[28px] font-medium leading-[1.35] tracking-[-0.55px] text-[#eaeaea] sm:text-[32px] sm:tracking-[-0.6px]">
              Hey{" "}
              {firstName ? (
                <span className="masterclass-gold-text font-semibold">{firstName}</span>
              ) : (
                <span className="masterclass-gold-text font-semibold">there</span>
              )}
              ,
            </h1>

            <p className="text-pretty text-[18px] leading-[1.55] tracking-[-0.34px] text-[#e7e7e7] sm:text-[20px] sm:tracking-[-0.38px]">
              Welcome to Unicoach. Complete your niche activity — then your discovery call unlocks on the Niche page.
            </p>
          </div>

          {shouldAutoRedirect && isAuthenticated && countdown != null ? (
            <p className="text-[14px] text-[#eaeaea]/70">Taking you to your Niche activity in {countdown}s…</p>
          ) : null}

          <button type="button" onClick={() => router.push(signupPath)} className="masterclass-gold-btn masterclass-gold-btn--lg w-full">
            <span className="relative z-10 px-2">
              {isAuthenticated ? "Go to your Niche activity" : "Sign up & complete your niche activity"}
            </span>
          </button>

          <div className="space-y-4">
            <p className="text-pretty text-[16px] leading-[1.5] tracking-[-0.3px] text-[#eaeaea]/75 sm:text-[17px]">
              The niche activity is a short exercise that nails down your target role before we meet.
            </p>
            <p className="text-pretty text-[16px] leading-[1.5] tracking-[-0.3px] text-[#eaeaea]/75 sm:text-[17px]">
              Your call booking link unlocks as soon as you complete your&nbsp;niche.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
