"use client";

import React, { useCallback, useSyncExternalStore } from "react";
import { useOnboardingUIStore } from "@/features/onboarding/store/useOnboardingUIStore";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const ONBOARDING_QUERY_KEY = ["onboardingSteps"] as const;

type CachedSteps = {
  currentStepIndex: number;
  history: number[];
  steps: unknown[];
};

/**
 * Read-only subscription to a query's cached data. Avoids the v5 requirement
 * to pass a queryFn just to read what `OnboardingFlow` has already cached.
 */
function useCachedQueryData<T>(queryClient: QueryClient, queryKey: readonly unknown[]): T | undefined {
  const subscribe = useCallback((onChange: () => void) => queryClient.getQueryCache().subscribe(onChange), [queryClient]);
  const getSnapshot = useCallback(
    () => queryClient.getQueryData<T>(queryKey),
    // queryKey is a stable readonly tuple in our usage
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, ...queryKey]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function BackButton() {
  const queryClient = useQueryClient();
  const data = useCachedQueryData<CachedSteps>(queryClient, ONBOARDING_QUERY_KEY);

  // Show Back only when the user actually has a previously-visited step to return to.
  // This keeps Back hidden on the very first screen and for "topping up" flows where the
  // earlier steps are already complete and were skipped by the server.
  const showBack = !!data && Array.isArray(data.history) && data.history.length > 0;
  if (!showBack || !data) return null;

  const handleBack = () => {
    const cached = queryClient.getQueryData<CachedSteps>(ONBOARDING_QUERY_KEY);
    if (!cached || !cached.history?.length) return;
    const nextHistory = [...cached.history];
    const previousIndex = nextHistory.pop() ?? 0;
    queryClient.setQueryData(ONBOARDING_QUERY_KEY, {
      ...cached,
      history: nextHistory,
      currentStepIndex: previousIndex,
    });
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#346DE0] hover:underline absolute top-4 left-4 md:top-6 md:left-8"
    >
      <ChevronLeft size={16} /> Back
    </button>
  );
}

const REQUIRED_STEP_NAMES = new Set(["welcome", "whatsapp", "linkedin"]);

function SkipLink() {
  const queryClient = useQueryClient();
  const data = useCachedQueryData<CachedSteps>(queryClient, ONBOARDING_QUERY_KEY);
  const currentStepName = data?.steps?.[data.currentStepIndex ?? -1] as { name?: string } | undefined;
  const showSkip = currentStepName?.name && !REQUIRED_STEP_NAMES.has(currentStepName.name);

  if (!showSkip) return null;

  return (
    <Link
      href="/uniboard/resume"
      className="inline-flex items-center text-sm font-medium text-[#346DE0] hover:underline absolute top-4 right-4 md:top-6 md:right-8"
      aria-label="Skip optional onboarding steps and go to resume"
    >
      Skip
    </Link>
  );
}

function OnboardingProgress() {
  const queryClient = useQueryClient();
  const data = useCachedQueryData<CachedSteps>(queryClient, ONBOARDING_QUERY_KEY);

  if (!data?.steps?.length || data.currentStepIndex < 0) return null;

  const currentStep = data.currentStepIndex + 1;
  const totalSteps = data.steps.length;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-[34rem]" role="status" aria-live="polite">
      <p className="text-sm font-medium text-[#4A5568]">
        Step {currentStep} of {totalSteps}
      </p>
      <div
        className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Onboarding progress: step ${currentStep} of ${totalSteps}`}
      >
        <div className="h-full rounded-full bg-[#346DE0] transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  );
}

function LoadingOverlay() {
  const message = useOnboardingUIStore(s => s.loadingMessage);
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-white/85 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="animate-spin text-[#346DE0]" />
        <span className="text-sm text-[#4A5568]">{message}</span>
      </div>
    </div>
  );
}

export default function OnboardingChrome({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex flex-col min-h-screen text-[#0C0F1A]"
      style={{ background: "#F8F9FB", fontFamily: "'Onest', system-ui, sans-serif" }}
    >
      <BackButton />
      <SkipLink />

      <div className="flex items-center justify-center min-h-screen px-4 py-10">
        <div className="flex flex-col items-center gap-5 w-full max-w-5xl">
          <Link href="/" className="text-[20px] font-bold tracking-tight text-[#0C0F1A] mb-1" aria-label="Unimad home">
            uni<span className="text-[#346DE0]">mad</span>
          </Link>
          <OnboardingProgress />
          {children}
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[40rem] left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] rounded-full"
        style={{
          background: "radial-gradient(closest-side, rgba(52,109,224,0.18), rgba(52,109,224,0))",
          filter: "blur(60px)",
          zIndex: -1,
        }}
      />

      <LoadingOverlay />
    </div>
  );
}
