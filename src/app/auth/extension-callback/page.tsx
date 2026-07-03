"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ExtensionCallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!code) {
      setStatus("error");
      setMessage("No authorization code provided");
      return;
    }

    const exchangeTokens = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!backendUrl) {
          throw new Error("Backend URL is not configured");
        }

        const response = await fetch(`${backendUrl}/api/extension/token-exchange/?code=${code}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(errorData.error || "Failed to exchange code for tokens");
        }

        const tokens = await response.json();
        const authPayload = { type: "UNIMAD_EXTENSION_AUTH", tokens };

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(authPayload, "*");
        } else {
          window.postMessage(authPayload, window.location.origin);
        }

        setStatus("success");
        setMessage("Authentication successful! You can close this window.");

        window.setTimeout(() => {
          if (window.opener) {
            window.close();
          }
        }, 2000);
      } catch (error) {
        console.error("Token exchange error:", error);
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Failed to complete authentication. Please try again.");
      }
    };

    void exchangeTokens();
  }, [code]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <p className="mt-4 text-slate-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <h2 className="mb-2 text-2xl font-semibold text-slate-900">
          {status === "success" ? "Authentication successful" : "Authentication failed"}
        </h2>
        <p className="mb-4 text-slate-600">{message}</p>
        {status === "success" ? (
          <p className="text-sm text-slate-500">This window will close automatically...</p>
        ) : (
          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200"
          >
            Close window
          </button>
        )}
        <p className="mt-6">
          <Link href="/" className="text-sm font-medium text-brand-600 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ExtensionCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      }
    >
      <ExtensionCallbackContent />
    </Suspense>
  );
}
