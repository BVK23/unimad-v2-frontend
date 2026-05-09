"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuthStatus } from "@/hooks/useAuthStatus";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

/** Default uniboard segment after OAuth / cookie redirect (must match a real route). */
const DEFAULT_UNIBOARD_REDIRECT = "resume";

function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? DEFAULT_UNIBOARD_REDIRECT;
  const from = searchParams.get("from") ?? "";
  const errorMessage = searchParams.get("message");
  const { isAuthenticated, isLoading } = useAuthStatus();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const target = from && from.startsWith("/uniboard") ? from : `/uniboard/${redirect}`;
      router.replace(target);
    }
  }, [isAuthenticated, isLoading, redirect, from, router]);

  const handleOAuthLogin = (provider: "linkedin" | "google") => {
    const oauthRedirect =
      from && from.startsWith("/uniboard") ? from.replace("/uniboard/", "") : redirect;
    if (provider === "linkedin") {
      window.location.href = `${backendUrl}/linkedin-login?redirect=${encodeURIComponent(oauthRedirect)}`;
    } else {
      window.location.href = `${backendUrl}/google-login?redirect=${encodeURIComponent(oauthRedirect)}`;
    }
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "#346DE0", borderTopColor: "transparent" }}
        />
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
          <h1 className="mb-2 text-[26px] font-bold leading-tight tracking-tight text-[#0C0F1A] md:text-[28px]">
            Sign in to{" "}
            <span className="inline">
              uni<span className="text-[#346DE0]">mad</span>
            </span>
          </h1>
          <p className="text-[15px] font-light leading-relaxed text-[#4A5568]">
            Sign in or create an account — your toolkit is free.
          </p>
        </div>

        {decodedMessage ? (
          <div
            className="mb-6 rounded-[10px] border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="alert"
          >
            {decodedMessage}
          </div>
        ) : null}

        <div
          className="rounded-[14px] border p-8 md:p-9"
          style={{
            background: "#FFFFFF",
            borderColor: "rgba(12,15,26,0.07)",
            boxShadow: "0 8px 32px rgba(52,109,224,0.07)",
          }}
        >
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handleOAuthLogin("linkedin")}
              className="flex w-full items-center justify-center gap-3 rounded-[9px] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
              style={{ background: "#0077B5" }}
              disabled={!backendUrl}
            >
              <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Continue with LinkedIn
            </button>

            <div className="my-1 flex items-center gap-3">
              <div className="h-px flex-1 bg-[rgba(12,15,26,0.07)]" />
              <span className="text-[11px] font-medium text-[#8896A8]">or</span>
              <div className="h-px flex-1 bg-[rgba(12,15,26,0.07)]" />
            </div>

            <button
              type="button"
              onClick={() => handleOAuthLogin("google")}
              className="flex w-full items-center justify-center gap-3 rounded-[9px] border bg-[#F8F9FB] px-6 py-3.5 text-sm font-semibold text-[#0C0F1A] transition-colors hover:border-[rgba(52,109,224,0.2)] hover:bg-[#F0F3F8] active:scale-[0.98] disabled:opacity-50"
              style={{ borderColor: "rgba(12,15,26,0.07)" }}
              disabled={!backendUrl}
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="mt-7 text-center text-[11px] leading-relaxed text-[#8896A8]">
            By continuing, you agree to Unimad&apos;s{" "}
            <Link href="/tos" className="font-semibold text-[#346DE0] hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="font-semibold text-[#346DE0] hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-[7px] border px-[18px] py-2 text-[13px] text-[#4A5568] transition-colors hover:border-[#346DE0]"
            style={{ borderColor: "rgba(12,15,26,0.07)" }}
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
    <div
      className="min-h-screen antialiased"
      style={{
        fontFamily: "'Onest', system-ui, sans-serif",
        background: "#F8F9FB",
        color: "#0C0F1A",
      }}
    >
      <nav
        className="sticky top-0 z-[200] flex items-center justify-between border-b px-5 py-4 md:px-[60px]"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(14px)",
          borderColor: "rgba(12,15,26,0.07)",
        }}
      >
        <Link href="/" className="text-[18px] font-bold tracking-tight text-[#0C0F1A]">
          uni<span className="text-[#346DE0]">mad</span>
        </Link>
        <span className="text-[13px] text-[#4A5568]">Sign in</span>
      </nav>

      <main>
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: "#346DE0", borderTopColor: "transparent" }}
              />
            </div>
          }
        >
          <SigninForm />
        </Suspense>
      </main>
    </div>
  );
}
