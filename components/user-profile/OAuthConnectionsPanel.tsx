"use client";

import React from "react";

type OAuthConnectionsPanelProps = {
  hasGoogle?: boolean;
  hasLinkedIn?: boolean;
  userId?: number;
  isLoading?: boolean;
};

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
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
  );
}

function LinkedInIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#0077B5"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

function ConnectedPill({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-500 bg-white px-4 py-2 text-sm font-medium text-slate-800 dark:bg-[#111] dark:text-slate-100">
      {icon}
      <span>{label}</span>
      <span className="text-emerald-600 text-xs font-bold">✓</span>
    </div>
  );
}

export function OAuthConnectionsPanel({ hasGoogle, hasLinkedIn, userId, isLoading }: OAuthConnectionsPanelProps) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

  const handleConnect = (provider: "google" | "linkedin") => {
    if (!userId) return;
    const base = backendUrl.replace(/\/+$/, "");
    if (provider === "google") {
      window.location.href = `${base}/google-login?redirect=profile&link=true&user_id=${userId}`;
    } else {
      window.location.href = `${base}/linkedin-login?redirect=profile&link=true&user_id=${userId}`;
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111]">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Connected accounts</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Link Google or LinkedIn to sign in faster and sync profile data.</p>
      {isLoading ? (
        <div className="mt-4 h-10 w-48 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          {hasGoogle ? (
            <ConnectedPill label="Google" icon={<GoogleIcon />} />
          ) : (
            <button type="button" onClick={() => handleConnect("google")} className={connectBtnClass}>
              <GoogleIcon />
              Connect Google
            </button>
          )}
          {hasLinkedIn ? (
            <ConnectedPill label="LinkedIn" icon={<LinkedInIcon />} />
          ) : (
            <button type="button" onClick={() => handleConnect("linkedin")} className={connectBtnClass}>
              <LinkedInIcon />
              Connect LinkedIn
            </button>
          )}
        </div>
      )}
    </section>
  );
}

const connectBtnClass =
  "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111] dark:text-slate-200 dark:hover:bg-slate-900/50";
