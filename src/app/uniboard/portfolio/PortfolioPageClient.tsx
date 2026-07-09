"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Portfolio from "@/components/Portfolio";
import PortfolioCreatingOverlay from "@/components/portfolio/PortfolioCreatingOverlay";
import { UniboardHelpFloater } from "@/components/uniboard/UniboardHelpFloater";
import { useOnboardingGate } from "@/features/onboarding/context/OnboardingGateContext";
import { onboardingHref } from "@/features/onboarding/featureGates";
import { mapBackendPortfolioToFrontend } from "@/features/portfolio/api/mappers";
import type { PortfolioCreationVariant } from "@/features/portfolio/constants/portfolioCreationCopy";
import { blankPortfolioCreateInput, defaultBootstrapCreateInput, useCreatePortfolio } from "@/features/portfolio/hooks/useCreatePortfolio";
import { usePortfolio } from "@/features/portfolio/hooks/usePortfolio";
import { replacePortfolioTemplate } from "@/features/portfolio/server-actions/portfolio-actions";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import Link from "next/link";

type PortfolioCreationPhase = "idle" | "fetching" | "creating" | "ready" | "error";

const getFriendlyCreateError = (err: unknown) => {
  const message = err instanceof Error ? err.message : "Failed to create portfolio";
  if (message.toLowerCase().includes("failed to generate")) {
    return "We couldn't generate your portfolio right now. Please try again.";
  }
  return message;
};

const getFriendlyLoadError = (err: unknown) => {
  const message = err instanceof Error ? err.message : "Failed to load portfolio";
  if (message.toLowerCase().includes("unauthorized")) {
    return "Your session expired. Please sign in again.";
  }
  return message;
};

const POST_ONBOARDING_PROMPT_KEY = "portfolio-post-onboarding-generate-prompt-dismissed";

/**
 * Single-portfolio UX: load (or bootstrap-create) the user's portfolio and open the editor directly.
 */
export default function PortfolioPageClient() {
  const bootstrapAttemptedRef = useRef(false);
  const { featureGates } = useOnboardingGate();
  const [onboardingModalDismissed, setOnboardingModalDismissed] = useState(false);
  const [showPostOnboardingPrompt, setShowPostOnboardingPrompt] = useState(false);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const canAutoCreate = featureGates.portfolio_auto_create;
  const portfolioQuery = usePortfolio();
  const createPortfolioMutation = useCreatePortfolio();

  const portfolioFromStore = usePortfolioStore(s => {
    const id = portfolioQuery.data?.id ?? createPortfolioMutation.data?.id;
    return id ? s.getPortfolioData(id) : undefined;
  });

  const displayPortfolio = useMemo(
    () => portfolioFromStore ?? portfolioQuery.data ?? createPortfolioMutation.data ?? null,
    [createPortfolioMutation.data, portfolioFromStore, portfolioQuery.data]
  );

  const { mutate: mutateCreatePortfolio, isPending: isCreatePending, isError: isCreateError } = createPortfolioMutation;

  const createInput = canAutoCreate ? defaultBootstrapCreateInput : blankPortfolioCreateInput;

  useEffect(() => {
    if (portfolioQuery.isLoading || portfolioQuery.isFetching) return;
    if (portfolioQuery.isError) return;
    if (portfolioQuery.data) return;
    if (bootstrapAttemptedRef.current || isCreatePending) return;

    bootstrapAttemptedRef.current = true;
    mutateCreatePortfolio(createInput);
  }, [
    createInput,
    isCreatePending,
    mutateCreatePortfolio,
    portfolioQuery.data,
    portfolioQuery.isError,
    portfolioQuery.isFetching,
    portfolioQuery.isLoading,
  ]);

  useEffect(() => {
    if (!canAutoCreate || !displayPortfolio?.id) return;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(POST_ONBOARDING_PROMPT_KEY) === "1") return;
    const items = displayPortfolio.items ?? [];
    const isBlankish = items.length <= 1;
    if (isBlankish) {
      setShowPostOnboardingPrompt(true);
    }
  }, [canAutoCreate, displayPortfolio?.id, displayPortfolio?.items]);

  const awaitingBootstrap = useMemo(
    () => portfolioQuery.isFetched && !portfolioQuery.data && !displayPortfolio?.id && !isCreateError,
    [displayPortfolio?.id, isCreateError, portfolioQuery.data, portfolioQuery.isFetched]
  );

  const phase: PortfolioCreationPhase = useMemo(() => {
    if ((isCreateError || portfolioQuery.isError) && !displayPortfolio?.id) return "error";
    if (portfolioQuery.isLoading && !portfolioQuery.data) return "fetching";
    if (isCreatePending || awaitingBootstrap) return "creating";
    if (displayPortfolio?.id) return "ready";
    return "idle";
  }, [
    awaitingBootstrap,
    displayPortfolio?.id,
    isCreateError,
    isCreatePending,
    portfolioQuery.data,
    portfolioQuery.isError,
    portfolioQuery.isLoading,
  ]);

  const activeOverlayVariant: PortfolioCreationVariant = phase === "fetching" ? "fetch" : canAutoCreate ? "ai_initial" : "blank";

  const handleRetryCreate = () => {
    createPortfolioMutation.reset();
    bootstrapAttemptedRef.current = true;
    mutateCreatePortfolio(createInput);
  };

  const handleGeneratePersonalizedPortfolio = async () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(POST_ONBOARDING_PROMPT_KEY, "1");
    }
    setShowPostOnboardingPrompt(false);
    setIsGeneratingTemplate(true);
    try {
      const response = await replacePortfolioTemplate();
      const portfolio = mapBackendPortfolioToFrontend(response.assetData);
      if (portfolio.id) {
        usePortfolioStore.getState().setPortfolioData(portfolio.id, portfolio);
      }
      await portfolioQuery.refetch();
    } catch {
      // User can retry from floater
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const dismissPostOnboardingPrompt = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(POST_ONBOARDING_PROMPT_KEY, "1");
    }
    setShowPostOnboardingPrompt(false);
  };

  const showCreatingOverlay = (phase === "fetching" || phase === "creating") && !displayPortfolio?.id;
  const loadErrorMessage = portfolioQuery.isError ? getFriendlyLoadError(portfolioQuery.error) : null;
  const createErrorMessage = isCreateError ? getFriendlyCreateError(createPortfolioMutation.error) : null;
  const errorMessage = loadErrorMessage ?? createErrorMessage;

  const handleRetry = () => {
    if (portfolioQuery.isError) {
      void portfolioQuery.refetch();
      return;
    }
    handleRetryCreate();
  };

  const showOnboardingGateModal = !canAutoCreate && displayPortfolio?.id && !onboardingModalDismissed;

  if (phase === "error" && !displayPortfolio) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#1a1a1a]"
          role="alert"
        >
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
            {portfolioQuery.isError ? "Unable to load portfolio" : "Unable to create portfolio"}
          </h2>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (showCreatingOverlay) {
    return (
      <div className="relative h-full">
        <PortfolioCreatingOverlay variant={activeOverlayVariant} />
      </div>
    );
  }

  if (displayPortfolio?.id) {
    return (
      <div className="relative h-full transition-opacity duration-200">
        <Portfolio key={displayPortfolio.id} portfolioId={displayPortfolio.id} initialData={displayPortfolio} />

        {showOnboardingGateModal ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Personalise your portfolio</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Complete your onboarding and discover and finalize your niche, so Unibot can help you create a portfolio draft personalised
                for you.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setOnboardingModalDismissed(true)}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Start from scratch
                </button>
                <Link
                  href={onboardingHref("niche")}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Complete onboarding
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {showPostOnboardingPrompt ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Generate your portfolio?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                You&apos;ve finished onboarding — want Unibot to generate a personalised portfolio draft for you?
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={dismissPostOnboardingPrompt}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Explore on my own
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePersonalizedPortfolio}
                  disabled={isGeneratingTemplate}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Yes, generate draft
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isGeneratingTemplate ? (
          <div className="absolute inset-0 z-50">
            <PortfolioCreatingOverlay variant="ai_initial" />
          </div>
        ) : null}

        <UniboardHelpFloater
          showPortfolioGenerate={canAutoCreate && showPostOnboardingPrompt === false && (displayPortfolio.items?.length ?? 0) <= 1}
          onGeneratePortfolio={handleGeneratePersonalizedPortfolio}
        />
      </div>
    );
  }

  if (portfolioQuery.isLoading || isCreatePending) {
    return (
      <div className="relative h-full">
        <PortfolioCreatingOverlay variant={activeOverlayVariant} />
      </div>
    );
  }

  return <div className="relative flex h-full items-center justify-center text-sm text-slate-500">No portfolio available.</div>;
}
