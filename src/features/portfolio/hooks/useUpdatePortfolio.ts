import { mapBackendPortfolioToFrontend, mapFrontendPortfolioToBackend } from "@/features/portfolio/api/mappers";
import { NEW_PORTFOLIO_DRAFT_ID, isPersistedPortfolioId } from "@/features/portfolio/constants/portfolioDraft";
import { updatePortfolioContent } from "@/features/portfolio/server-actions/portfolio-actions";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { getPortfolioContentSignature } from "@/features/portfolio/utils/getPortfolioContentSignature";
import { mergeSavedPortfolioLayout } from "@/features/portfolio/utils/mergePortfolioLayoutAfterSave";
import type { PortfolioData } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setLivePortfolioQueryData } from "./usePortfolio";

export type SavePortfolioResult = {
  created: boolean;
  id: string;
  portfolio: PortfolioData;
};

function mergeSavedCoverPosition(saved: PortfolioData, response: PortfolioData): PortfolioData {
  const savedCoverPosition = saved.profile?.coverPosition;
  if (response?.profile && savedCoverPosition && JSON.stringify(response.profile.coverPosition) !== JSON.stringify(savedCoverPosition)) {
    return { ...response, profile: { ...response.profile, coverPosition: savedCoverPosition } };
  }
  return response;
}

function removeDraftFromStore() {
  usePortfolioStore.setState(state => {
    if (!(NEW_PORTFOLIO_DRAFT_ID in state.portfolioData)) return state;
    const nextPortfolioData = { ...state.portfolioData };
    delete nextPortfolioData[NEW_PORTFOLIO_DRAFT_ID];
    const nextFocused = { ...state.focusedPageCardByPortfolioId };
    delete nextFocused[NEW_PORTFOLIO_DRAFT_ID];
    return {
      portfolioData: nextPortfolioData,
      focusedPageCardByPortfolioId: nextFocused,
    };
  });
}

function getStorePortfolio(portfolioId: string, draftId?: string): PortfolioData | undefined {
  const store = usePortfolioStore.getState();
  return store.getPortfolioData(portfolioId) ?? (draftId ? store.getPortfolioData(draftId) : undefined);
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PortfolioData): Promise<SavePortfolioResult> => {
      const isNew = !isPersistedPortfolioId(data.id);
      const payload = mapFrontendPortfolioToBackend(isNew ? { ...data, id: "" } : data);
      const response = await updatePortfolioContent(payload);
      const portfolio = mapBackendPortfolioToFrontend(response.portfolio);

      return {
        created: Boolean(response.created) || isNew,
        id: portfolio.id,
        portfolio,
      };
    },
    onSuccess: (result, variables) => {
      const withLayout = mergeSavedPortfolioLayout(variables, result.portfolio);
      const mergedPortfolio = mergeSavedCoverPosition(variables, withLayout);

      if (!mergedPortfolio?.profile) {
        console.error("[portfolio-save] backend response missing profile", {
          portfolioId: result.id,
          portfolioKeys: mergedPortfolio ? Object.keys(mergedPortfolio) : [],
        });
      }

      const savedSnapshot = getPortfolioContentSignature(variables);
      const draftId = isPersistedPortfolioId(variables.id) ? undefined : variables.id || NEW_PORTFOLIO_DRAFT_ID;
      const current = getStorePortfolio(result.id, draftId);
      const currentSnapshot = current ? getPortfolioContentSignature(current) : savedSnapshot;
      const storeDiverged = currentSnapshot !== savedSnapshot;

      if (result.created) {
        if (storeDiverged && current) {
          const migrated = { ...current, id: result.id };
          setLivePortfolioQueryData(queryClient, migrated);
          usePortfolioStore.getState().setPortfolioData(result.id, migrated);
        } else {
          setLivePortfolioQueryData(queryClient, mergedPortfolio);
          usePortfolioStore.getState().setPortfolioData(result.id, mergedPortfolio);
        }
        removeDraftFromStore();
        return;
      }

      if (storeDiverged) {
        if (current) {
          setLivePortfolioQueryData(queryClient, current);
        }
        return;
      }

      setLivePortfolioQueryData(queryClient, mergedPortfolio);
      usePortfolioStore.getState().setPortfolioData(result.id, mergedPortfolio);
    },
  });
}
