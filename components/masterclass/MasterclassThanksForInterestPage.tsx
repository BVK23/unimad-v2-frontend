"use client";

import { useEffect, useState } from "react";
import { UnimadLogo } from "@/components/unimad-logo";
import { MASTERCLASS_LEAD_SESSION_KEY, buildMasterclassUnicoachSignupUrl } from "@/constants/masterclass";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function readStoredLeadUid() {
  try {
    const raw = sessionStorage.getItem(MASTERCLASS_LEAD_SESSION_KEY);
    if (!raw) return null;
    const lead = JSON.parse(raw) as { uid?: string; leadId?: number | string };
    return lead.uid || (lead.leadId != null ? String(lead.leadId) : null);
  } catch {
    return null;
  }
}

export default function MasterclassThanksForInterestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uidFromUrl = searchParams.get("uid");
  const [storedUid, setStoredUid] = useState<string | null>(null);

  const leadUid = uidFromUrl || storedUid;

  useEffect(() => {
    document.body.classList.add("masterclass-page");
    document.documentElement.classList.add("masterclass-page");

    const frame = requestAnimationFrame(() => {
      const uid = readStoredLeadUid();
      if (uid) setStoredUid(uid);
    });

    return () => {
      cancelAnimationFrame(frame);
      document.body.classList.remove("masterclass-page");
      document.documentElement.classList.remove("masterclass-page");
    };
  }, []);

  const signupPath = buildMasterclassUnicoachSignupUrl(leadUid);

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
            <h1 className="text-balance text-[28px] font-medium leading-[1.35] tracking-[-0.55px] text-[#eaeaea] sm:text-[32px]">
              Thanks for your <span className="masterclass-gold-text font-semibold">interest</span>
            </h1>
            <p className="text-pretty text-[18px] leading-[1.55] tracking-[-0.34px] text-[#e7e7e7] sm:text-[20px]">
              We understand that you are not open for the guided programme. Please use Unimad for free and game up your job search.
            </p>
          </div>

          <button type="button" onClick={() => router.push(signupPath)} className="masterclass-gold-btn masterclass-gold-btn--lg w-full">
            <span className="relative z-10 px-2">Go to Unimad</span>
          </button>

          <p className="text-pretty text-[16px] leading-[1.5] tracking-[-0.3px] text-[#eaeaea]/75">
            Questions? Reach us at{" "}
            <a href="mailto:grow@unimad.ai" className="text-[#346de0] hover:underline">
              grow@unimad.ai
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
