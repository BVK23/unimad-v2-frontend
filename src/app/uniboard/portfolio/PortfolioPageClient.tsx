"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Portfolio from "@/components/Portfolio";
import PortfolioCreatingOverlay from "@/components/portfolio/PortfolioCreatingOverlay";
import { UniboardHelpFloater } from "@/components/uniboard/UniboardHelpFloater";
import { useOnboardingGate } from "@/features/onboarding/context/OnboardingGateContext";
import { needsProfileSetup, onboardingHref } from "@/features/onboarding/featureGates";
import { mapBackendPortfolioToFrontend } from "@/features/portfolio/api/mappers";
import { NEW_PORTFOLIO_DRAFT_ID, isPersistedPortfolioId } from "@/features/portfolio/constants/portfolioDraft";
import { usePortfolio, setLivePortfolioQueryData } from "@/features/portfolio/hooks/usePortfolio";
import {
  createInitialPortfolio,
  replacePortfolioTemplate,
  revertPortfolioGenerated,
} from "@/features/portfolio/server-actions/portfolio-actions";
import { usePortfolioGenerationStore, type PortfolioGenerationPendingAction } from "@/features/portfolio/store/usePortfolioGenerationStore";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { buildScratchPortfolio } from "@/features/portfolio/utils/buildScratchPortfolio";
import { useProfileData } from "@/features/user-profile/hooks/use-profile-data";
import type { PortfolioData } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type PortfolioCreationPhase = "idle" | "fetching" | "creating" | "ready" | "error";

const getFriendlyLoadError = (err: unknown) => {
  const message = err instanceof Error ? err.message : "Failed to load portfolio";
  if (message.toLowerCase().includes("unauthorized")) {
    return "Your session expired. Please sign in again.";
  }
  return message;
};

const POST_ONBOARDING_PROMPT_KEY = "portfolio-post-onboarding-generate-prompt-dismissed";
const INCOMPLETE_ONBOARDING_PROMPT_KEY = "portfolio-incomplete-onboarding-prompt-dismissed";

/** Soft "Generate?" modal stays until the user clearly invested in a scratch build. */
const GENERATE_NUDGE_MAX_ITEMS = 2;
const GENERATE_NUDGE_MAX_EDITS = 5;

/**
 * Single-portfolio UX: load persisted portfolio or show a local scratch draft immediately.
 * Backend portfolio creation happens on first save (or when user accepts Unibot generation).
 */
export default function PortfolioPageClient() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { featureGates } = useOnboardingGate();
  const { data: profileData } = useProfileData();
  const [postOnboardingDismissed, setPostOnboardingDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(POST_ONBOARDING_PROMPT_KEY) === "1";
  });
  const [incompleteOnboardingDismissed, setIncompleteOnboardingDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(INCOMPLETE_ONBOARDING_PROMPT_KEY) === "1";
  });
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [showRevertDoubleConfirm, setShowRevertDoubleConfirm] = useState(false);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [generationOverlayVariant, setGenerationOverlayVariant] = useState<"ai_initial" | "ai_regenerate">("ai_initial");
  const [isReverting, setIsReverting] = useState(false);
  const [activePortfolioId, setActivePortfolioId] = useState<string | null>(null);
  const canAutoCreate = featureGates.portfolio_auto_create;
  const needsOnboarding = needsProfileSetup(featureGates);
  const portfolioQuery = usePortfolio();
  const scratchSeededRef = useRef(false);

  const hasPersistedRow = Boolean(portfolioQuery.data?.id && isPersistedPortfolioId(portfolioQuery.data.id));
  /** Do not decide which prompt to show until the portfolio row fetch has settled. */
  const promptsReady = portfolioQuery.isFetched;

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
    () => portfolioFromStore ?? portfolioQuery.data ?? scratchDraft ?? null,
    [portfolioFromStore, portfolioQuery.data, scratchDraft]
  );

  const editorPortfolioId = useMemo(() => {
    if (activePortfolioId) return activePortfolioId;
    if (portfolioQuery.data?.id) return portfolioQuery.data.id;
    return NEW_PORTFOLIO_DRAFT_ID;
  }, [activePortfolioId, portfolioQuery.data?.id]);

  const snap = displayPortfolio?.contextSnapshot;
  const hasGeneratedAt = Boolean(snap?.portfolio_generated_at);
  const canRevert = Boolean(snap?.can_revert);
  const editedSinceReplace = Boolean(snap?.edited_since_replace);
  const itemCount = displayPortfolio?.items?.length ?? 0;
  const editCount = snap?.number_of_edits ?? 0;
  // Invested scratch build → floater Generate only; otherwise keep soft "Generate?" nudge.
  const isEngagedScratchBuild = hasPersistedRow && itemCount > GENERATE_NUDGE_MAX_ITEMS && editCount > GENERATE_NUDGE_MAX_EDITS;

  // Generate = never AI-gen'd; Regenerate = already AI-gen'd
  const isRegenerate = hasGeneratedAt;

  // Derived prompts — never flash before gates + portfolio fetch are known.
  // Incomplete vs generate are mutually exclusive (`needsOnboarding` ⇔ `!canAutoCreate`).
  const showIncompleteOnboardingPrompt = promptsReady && needsOnboarding && !hasPersistedRow && !incompleteOnboardingDismissed;
  const showPostOnboardingPrompt =
    promptsReady &&
    canAutoCreate &&
    Boolean(displayPortfolio) &&
    !hasGeneratedAt &&
    !isEngagedScratchBuild &&
    !postOnboardingDismissed &&
    !showIncompleteOnboardingPrompt;

  const showGenerateCta = canAutoCreate && !showPostOnboardingPrompt && !showGenerateConfirm && !showIncompleteOnboardingPrompt;
  const showRevertCta = canAutoCreate && canRevert && !showPostOnboardingPrompt && !showGenerateConfirm;

  const handlePortfolioPersisted = useCallback(
    (id: string, portfolio: PortfolioData) => {
      setActivePortfolioId(id);
      setLivePortfolioQueryData(queryClient, portfolio);
    },
    [queryClient]
  );

  const phase: PortfolioCreationPhase = useMemo(() => {
    if (portfolioQuery.isError && !displayPortfolio) return "error";
    if (displayPortfolio) return "ready";
    return "idle";
  }, [displayPortfolio, portfolioQuery.isError]);

  const pendingGenerationAction = usePortfolioGenerationStore(s => s.pendingAction);

  const applyGeneratedResponse = useCallback(
    async (response: { assetData: Record<string, unknown> }) => {
      const portfolio = mapBackendPortfolioToFrontend(response.assetData);
      if (portfolio.id) {
        usePortfolioStore.getState().setPortfolioData(portfolio.id, portfolio);
        setActivePortfolioId(portfolio.id);
        setLivePortfolioQueryData(queryClient, portfolio);
      }
      await portfolioQuery.refetch();
    },
    [queryClient, portfolioQuery]
  );

  const runAiPortfolioJob = useCallback(
    async (action: PortfolioGenerationPendingAction) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(POST_ONBOARDING_PROMPT_KEY, "1");
      }
      setPostOnboardingDismissed(true);
      setShowGenerateConfirm(false);
      setGenerationOverlayVariant(action === "replace" ? "ai_regenerate" : "ai_initial");
      setIsGeneratingTemplate(true);
      try {
        const response = action === "replace" ? await replacePortfolioTemplate() : await createInitialPortfolio({ with_ai_template: true });
        await applyGeneratedResponse(response);
      } catch {
        // User can retry from floater
      } finally {
        setIsGeneratingTemplate(false);
      }
    },
    [applyGeneratedResponse]
  );

  useEffect(() => {
    if (!pendingGenerationAction) return;
    usePortfolioGenerationStore.getState().clearPendingAction();
    void runAiPortfolioJob(pendingGenerationAction);
  }, [pendingGenerationAction, runAiPortfolioJob]);

  const handleGeneratePersonalizedPortfolio = async () => {
    const action: PortfolioGenerationPendingAction = isPersistedPortfolioId(editorPortfolioId) ? "replace" : "create_initial";
    await runAiPortfolioJob(action);
  };

  const handleRevert = async () => {
    setShowRevertConfirm(false);
    setShowRevertDoubleConfirm(false);
    setIsReverting(true);
    try {
      const response = await revertPortfolioGenerated();
      await applyGeneratedResponse(response);
    } catch {
      // User can retry from floater
    } finally {
      setIsReverting(false);
    }
  };

  const requestGenerateFromFloater = () => {
    setShowGenerateConfirm(true);
  };

  const requestRevertFromFloater = () => {
    if (editedSinceReplace) {
      setShowRevertConfirm(true);
    } else {
      setShowRevertConfirm(true);
    }
  };

  const dismissPostOnboardingPrompt = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(POST_ONBOARDING_PROMPT_KEY, "1");
    }
    setPostOnboardingDismissed(true);
  };

  const dismissIncompleteOnboardingPrompt = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(INCOMPLETE_ONBOARDING_PROMPT_KEY, "1");
    }
    setIncompleteOnboardingDismissed(true);
  };

  const loadErrorMessage = portfolioQuery.isError ? getFriendlyLoadError(portfolioQuery.error) : null;

  if (isGeneratingTemplate) {
    return (
      <div className="relative h-full">
        <PortfolioCreatingOverlay variant={generationOverlayVariant} />
      </div>
    );
  }

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

        {showIncompleteOnboardingPrompt ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Set up your portfolio</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Finish onboarding so Unibot can generate a personalised portfolio for you — or explore the editor from scratch.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={dismissIncompleteOnboardingPrompt}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Start from scratch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dismissIncompleteOnboardingPrompt();
                    router.push(onboardingHref("profile_setup"));
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Finish onboarding
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
                  onClick={() => void handleGeneratePersonalizedPortfolio()}
                  disabled={isGeneratingTemplate}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Yes, generate draft
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showGenerateConfirm ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-[2px]">
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
              role="dialog"
              aria-modal="true"
              aria-labelledby="portfolio-generate-confirm-title"
            >
              <h2 id="portfolio-generate-confirm-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                {isRegenerate ? "Regenerate your portfolio?" : "Generate your portfolio?"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {isRegenerate
                  ? "This will replace your current portfolio with a newly generated draft. You can revert once afterward if you change your mind."
                  : "Are you sure you want Unibot to generate a personalised portfolio draft for you?"}
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowGenerateConfirm(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleGeneratePersonalizedPortfolio()}
                  disabled={isGeneratingTemplate}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {isRegenerate ? "Yes, regenerate" : "Yes, generate draft"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showRevertConfirm ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-[2px]">
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
              role="dialog"
              aria-modal="true"
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Revert portfolio?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {editedSinceReplace
                  ? "You have edited this portfolio since it was generated. Reverting will discard those edits and restore the version from before the last generation."
                  : "This will restore your portfolio to how it was before the last generation."}
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowRevertConfirm(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editedSinceReplace) {
                      setShowRevertConfirm(false);
                      setShowRevertDoubleConfirm(true);
                    } else {
                      void handleRevert();
                    }
                  }}
                  disabled={isReverting}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {editedSinceReplace ? "Continue" : "Yes, revert"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showRevertDoubleConfirm ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-6 backdrop-blur-[2px]">
            <div
              className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xl dark:border-red-900 dark:bg-slate-900"
              role="dialog"
              aria-modal="true"
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Are you really sure?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                You will lose all work you have done since the last generation. This cannot be undone after you confirm.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowRevertDoubleConfirm(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Keep my edits
                </button>
                <button
                  type="button"
                  onClick={() => void handleRevert()}
                  disabled={isReverting}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Yes, lose my work and revert
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isGeneratingTemplate || isReverting ? (
          <div className="absolute inset-0 z-50">
            <PortfolioCreatingOverlay variant={isReverting ? "ai_initial" : generationOverlayVariant} />
          </div>
        ) : null}

        <UniboardHelpFloater
          showPortfolioGenerate={showGenerateCta}
          portfolioGenerateLabel={isRegenerate ? "Regenerate portfolio with Unibot" : "Generate portfolio with Unibot"}
          onGeneratePortfolio={requestGenerateFromFloater}
          showPortfolioRevert={showRevertCta}
          onRevertPortfolio={requestRevertFromFloater}
        />
      </div>
    );
  }

  return <div className="relative flex h-full items-center justify-center text-sm text-slate-500">No portfolio available.</div>;
}
