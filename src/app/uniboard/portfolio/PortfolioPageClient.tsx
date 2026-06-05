"use client";

import { useEffect, useMemo, useRef } from "react";
import Portfolio from "@/components/Portfolio";
import PortfolioCreatingOverlay from "@/components/portfolio/PortfolioCreatingOverlay";
import type { PortfolioCreationVariant } from "@/features/portfolio/constants/portfolioCreationCopy";
import { defaultBootstrapCreateInput, useCreatePortfolio } from "@/features/portfolio/hooks/useCreatePortfolio";
import { usePortfolio } from "@/features/portfolio/hooks/usePortfolio";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";

type PortfolioCreationPhase = "idle" | "fetching" | "creating" | "ready" | "error";

const getFriendlyCreateError = (err: unknown) => {
  const message = err instanceof Error ? err.message : "Failed to create portfolio";
  if (message.toLowerCase().includes("failed to generate")) {
    return "We couldn't generate your portfolio right now. Please try again.";
  }
  return message;
};

/**
 * Single-portfolio UX: load (or bootstrap-create) the user's portfolio and open the editor directly.
 * No multi-portfolio dashboard or base-portfolio picker.
 */
export default function PortfolioPageClient() {
  const bootstrapAttemptedRef = useRef(false);
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

  useEffect(() => {
    if (portfolioQuery.isLoading || portfolioQuery.isFetching) {
      return;
    }
    if (portfolioQuery.data) {
      return;
    }
    if (bootstrapAttemptedRef.current || isCreatePending) {
      return;
    }

    bootstrapAttemptedRef.current = true;
    mutateCreatePortfolio(defaultBootstrapCreateInput);
  }, [isCreatePending, mutateCreatePortfolio, portfolioQuery.data, portfolioQuery.isFetching, portfolioQuery.isLoading]);

  const awaitingBootstrap = useMemo(
    () => portfolioQuery.isFetched && !portfolioQuery.data && !displayPortfolio?.id && !isCreateError,
    [displayPortfolio?.id, isCreateError, portfolioQuery.data, portfolioQuery.isFetched]
  );

  const phase: PortfolioCreationPhase = useMemo(() => {
    if (isCreateError && !displayPortfolio?.id) {
      return "error";
    }
    if (portfolioQuery.isLoading && !portfolioQuery.data) {
      return "fetching";
    }
    if (isCreatePending || awaitingBootstrap) {
      return "creating";
    }
    if (displayPortfolio?.id) {
      return "ready";
    }
    return "idle";
  }, [awaitingBootstrap, displayPortfolio?.id, isCreateError, isCreatePending, portfolioQuery.data, portfolioQuery.isLoading]);

  const activeOverlayVariant: PortfolioCreationVariant = phase === "fetching" ? "fetch" : "ai_initial";

  const handleRetryCreate = () => {
    createPortfolioMutation.reset();
    bootstrapAttemptedRef.current = true;
    mutateCreatePortfolio(defaultBootstrapCreateInput);
  };

  const showOverlay = (phase === "fetching" || phase === "creating") && !displayPortfolio?.id;
  const createErrorMessage = isCreateError ? getFriendlyCreateError(createPortfolioMutation.error) : null;

  if (phase === "error" && !displayPortfolio) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#1a1a1a]"
          role="alert"
        >
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Unable to create portfolio</h2>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">{createErrorMessage}</p>
          <button
            type="button"
            onClick={handleRetryCreate}
            className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (showOverlay) {
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
