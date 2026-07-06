"use client";

import { Suspense, useEffect, useRef } from "react";
import { OAuthSignInButtons, SigninNav } from "@/components/auth/OAuthSignInButtons";
import { claimUnicoachPurchase } from "@/features/unicoach/server-actions/unicoach-actions";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import "@/components/landing/landing.css";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

/** Default uniboard segment after OAuth / cookie redirect (must match a real route). */
const DEFAULT_UNIBOARD_REDIRECT = "resume";

function resolveUniboardPath(redirect: string): string {
  if (redirect === "unicoach") return "/uniboard/unicoach";
  if (redirect === "home" || redirect === "resume") return "/uniboard";
  return `/uniboard/${redirect}`;
}

function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") ?? DEFAULT_UNIBOARD_REDIRECT;
  const unicoachClaim = searchParams?.get("unicoach_claim");
  const masterclassIntent = searchParams?.get("masterclass_intent");
  const masterclassUid = searchParams?.get("uid");
  const redirectTab = searchParams?.get("tab");
  const from = searchParams?.get("from") ?? "";
  const errorMessage = searchParams?.get("message");
  const { isAuthenticated, isLoading } = useAuthStatus();
  const claimAttempted = useRef(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && unicoachClaim && !claimAttempted.current) {
      claimAttempted.current = true;
      claimUnicoachPurchase(unicoachClaim)
        .catch(() => {})
        .finally(() => {
          router.replace(resolveUniboardPath(redirect));
        });
      return;
    }

    if (!isLoading && isAuthenticated && !unicoachClaim) {
      if (redirectTab === "niche") {
        router.replace("/uniboard/unicoach?tab=niche");
      } else if (redirect === "unicoach") {
        router.replace("/uniboard/unicoach");
      } else if (masterclassIntent === "video") {
        router.replace("/masterclass?autoplay=1");
      } else if (from && from.startsWith("/uniboard")) {
        router.replace(from);
      } else {
        router.replace(resolveUniboardPath(redirect));
      }
    }
  }, [isAuthenticated, isLoading, redirect, from, router, unicoachClaim, masterclassIntent, redirectTab]);

  const handleOAuthLogin = (provider: "linkedin" | "google") => {
    const oauthRedirect = from && from.startsWith("/uniboard") ? from.replace("/uniboard/", "") : redirect;
    const params = new URLSearchParams({ redirect: oauthRedirect });
    if (unicoachClaim) {
      params.set("unicoach_claim", unicoachClaim);
    }
    if (masterclassIntent === "discovery" || masterclassIntent === "video") {
      params.set("masterclass_intent", masterclassIntent);
    }
    if (masterclassUid) {
      params.set("uid", masterclassUid);
      params.set("lead_id", masterclassUid);
    }
    if (redirectTab) {
      params.set("tab", redirectTab);
    }
    const query = params.toString();
    if (provider === "linkedin") {
      window.location.href = `${backendUrl}/linkedin-login?${query}`;
    } else {
      window.location.href = `${backendUrl}/google-login?${query}`;
    }
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#346DE0] border-t-transparent" />
      </div>
    );
  }

  let decodedMessage: string | null = null;
  if (errorMessage) {
    try {
      decodedMessage = atob(decodeURIComponent(errorMessage));
    } catch {
      decodedMessage = null;
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-5 py-14 md:px-8">
      <div className="w-full max-w-[420px]">
        <div className="mb-9 text-center">
          <h1 className="mb-2 text-[26px] font-semibold leading-tight tracking-tight text-[#1a1a1a] md:text-[28px]">
            Get started with Unimad
          </h1>
          <p className="text-[15px] font-light leading-relaxed text-[#666666]">
            {unicoachClaim
              ? "Sign in or create an account to access your Unicoach programme."
              : "Create your free account or sign in — your toolkit is ready when you are."}
          </p>
        </div>

        {decodedMessage ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
            {decodedMessage}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-9">
          <OAuthSignInButtons
            onLinkedIn={() => handleOAuthLogin("linkedin")}
            onGoogle={() => handleOAuthLogin("google")}
            disabled={!backendUrl}
          />

          <p className="mt-7 text-center text-[11px] leading-relaxed text-slate-400">
            By continuing, you agree to Unimad&apos;s{" "}
            <Link href="/tos" className="font-semibold text-[#346de0] hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="font-semibold text-[#346de0] hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-[18px] py-2 text-[13px] text-[#666666] transition-colors hover:border-[#346de0] hover:text-[#1a1a1a]"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SigninPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-slate-900 antialiased">
      <SigninNav />
      <main>
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#346DE0] border-t-transparent" />
            </div>
          }
        >
          <SigninForm />
        </Suspense>
      </main>
    </div>
  );
}
