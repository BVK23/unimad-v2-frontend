"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Portfolio from "@/components/Portfolio";
import PortfolioCreatingOverlay from "@/components/portfolio/PortfolioCreatingOverlay";
import { UniboardHelpFloater } from "@/components/uniboard/UniboardHelpFloater";
import { useOnboardingGate } from "@/features/onboarding/context/OnboardingGateContext";
import { mapBackendPortfolioToFrontend } from "@/features/portfolio/api/mappers";
import { NEW_PORTFOLIO_DRAFT_ID, isPersistedPortfolioId } from "@/features/portfolio/constants/portfolioDraft";
import { usePortfolio, portfolioQueryKey } from "@/features/portfolio/hooks/usePortfolio";
import { createInitialPortfolio, replacePortfolioTemplate } from "@/features/portfolio/server-actions/portfolio-actions";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { buildScratchPortfolio } from "@/features/portfolio/utils/buildScratchPortfolio";
import { useProfileData } from "@/features/user-profile/hooks/use-profile-data";
import type { PortfolioData } from "@/types";
import { useQueryClient } from "@tanstack/react-query";

type PortfolioCreationPhase = "idle" | "fetching" | "creating" | "ready" | "error";

const getFriendlyLoadError = (err: unknown) => {
  const message = err instanceof Error ? err.message : "Failed to load portfolio";
  if (message.toLowerCase().includes("unauthorized")) {
    return "Your session expired. Please sign in again.";
  }
  return message;
};

const POST_ONBOARDING_PROMPT_KEY = "portfolio-post-onboarding-generate-prompt-dismissed";

/**
 * Single-portfolio UX: load persisted portfolio or show a local scratch draft immediately.
 * Backend portfolio creation happens on first save (or when user accepts Unibot generation).
 */
export default function PortfolioPageClient() {
  const queryClient = useQueryClient();
  const { featureGates } = useOnboardingGate();
  const { data: profileData } = useProfileData();
  const [showPostOnboardingPrompt, setShowPostOnboardingPrompt] = useState(false);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [activePortfolioId, setActivePortfolioId] = useState<string | null>(null);
  const canAutoCreate = featureGates.portfolio_auto_create;
  const portfolioQuery = usePortfolio();
  const scratchSeededRef = useRef(false);

  const scratchDraft = useMemo(() => {
    if (portfolioQuery.data) return null;
    const onboarding = profileData?.onboarding_data;
    const name = profileData?.name?.trim() || onboarding?.preferred_name?.trim() || onboarding?.first_name?.trim() || "";
    const email = profileData?.email?.trim() || "";
    return buildScratchPortfolio({ name, email });
  }, [portfolioQuery.data, profileData]);

  useEffect(() => {
    if (portfolioQuery.data || scratchSeededRef.current) return;
    if (!portfolioQuery.isFetched) return;

    scratchSeededRef.current = true;
    if (!scratchDraft) return;
    usePortfolioStore.getState().setPortfolioData(NEW_PORTFOLIO_DRAFT_ID, scratchDraft);
  }, [portfolioQuery.data, portfolioQuery.isFetched, scratchDraft]);

  const portfolioFromStore = usePortfolioStore(s => {
    const id = activePortfolioId ?? portfolioQuery.data?.id ?? NEW_PORTFOLIO_DRAFT_ID;
    return s.getPortfolioData(id);
  });

  const displayPortfolio = useMemo(
    () => portfolioQuery.data ?? portfolioFromStore ?? scratchDraft ?? null,
    [portfolioFromStore, portfolioQuery.data, scratchDraft]
  );

  const editorPortfolioId = useMemo(() => {
    if (activePortfolioId) return activePortfolioId;
    if (portfolioQuery.data?.id) return portfolioQuery.data.id;
    return NEW_PORTFOLIO_DRAFT_ID;
  }, [activePortfolioId, portfolioQuery.data?.id]);

  const handlePortfolioPersisted = useCallback(
    (id: string, portfolio: PortfolioData) => {
      setActivePortfolioId(id);
      queryClient.setQueryData(portfolioQueryKey, portfolio);
    },
    [queryClient]
  );

  useEffect(() => {
    if (!canAutoCreate || !displayPortfolio) return;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(POST_ONBOARDING_PROMPT_KEY) === "1") return;
    const isBlankish = (displayPortfolio.items?.length ?? 0) === 0;
    if (isBlankish) {
      setShowPostOnboardingPrompt(true);
    }
  }, [canAutoCreate, displayPortfolio]);

  const phase: PortfolioCreationPhase = useMemo(() => {
    if (portfolioQuery.isError && !displayPortfolio) return "error";
    if (displayPortfolio) return "ready";
    return "idle";
  }, [displayPortfolio, portfolioQuery.isError]);

  const handleGeneratePersonalizedPortfolio = async () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(POST_ONBOARDING_PROMPT_KEY, "1");
    }
    setShowPostOnboardingPrompt(false);
    setIsGeneratingTemplate(true);
    try {
      const response = isPersistedPortfolioId(editorPortfolioId)
        ? await replacePortfolioTemplate()
        : await createInitialPortfolio({ with_ai_template: true });
      const portfolio = mapBackendPortfolioToFrontend(response.assetData);
      if (portfolio.id) {
        usePortfolioStore.getState().setPortfolioData(portfolio.id, portfolio);
        setActivePortfolioId(portfolio.id);
        queryClient.setQueryData(portfolioQueryKey, portfolio);
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

  const loadErrorMessage = portfolioQuery.isError ? getFriendlyLoadError(portfolioQuery.error) : null;

  if (phase === "error" && !displayPortfolio) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#1a1a1a]"
          role="alert"
        >
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Unable to load portfolio</h2>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">{loadErrorMessage}</p>
          <button
            type="button"
            onClick={() => void portfolioQuery.refetch()}
            className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (displayPortfolio) {
    return (
      <div className="relative h-full transition-opacity duration-200">
        <Portfolio
          key={editorPortfolioId}
          portfolioId={editorPortfolioId}
          initialData={displayPortfolio}
          onPersisted={handlePortfolioPersisted}
        />

        {showPostOnboardingPrompt ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Generate your portfolio?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                You&apos;ve finished onboarding. Want Unibot to generate a personalised portfolio draft for you?
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
          showPortfolioGenerate={canAutoCreate && showPostOnboardingPrompt === false && (displayPortfolio.items?.length ?? 0) === 0}
          onGeneratePortfolio={handleGeneratePersonalizedPortfolio}
        />
      </div>
    );
  }

  return <div className="relative flex h-full items-center justify-center text-sm text-slate-500">No portfolio available.</div>;
}
