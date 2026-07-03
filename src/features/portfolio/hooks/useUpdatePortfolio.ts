import { mapBackendPortfolioToFrontend, mapFrontendPortfolioToBackend } from "@/features/portfolio/api/mappers";
import { updatePortfolioContent } from "@/features/portfolio/server-actions/portfolio-actions";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import type { PortfolioData } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioQueryKey } from "./usePortfolio";

export function useUpdatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PortfolioData) => {
      const response = await updatePortfolioContent(mapFrontendPortfolioToBackend(data));
      return mapBackendPortfolioToFrontend(response.portfolio);
    },
    onSuccess: (portfolio, variables) => {
      if (!portfolio?.profile) {
        console.error("[portfolio-save] backend response missing profile", {
          portfolioId: variables.id,
          portfolioKeys: portfolio ? Object.keys(portfolio) : [],
        });
      }

      const savedCoverPosition = variables.profile?.coverPosition;
      const mergedPortfolio =
        portfolio?.profile && savedCoverPosition && JSON.stringify(portfolio.profile.coverPosition) !== JSON.stringify(savedCoverPosition)
          ? { ...portfolio, profile: { ...portfolio.profile, coverPosition: savedCoverPosition } }
          : portfolio;

      queryClient.setQueryData(portfolioQueryKey, mergedPortfolio);
      if (mergedPortfolio.id) {
        usePortfolioStore.getState().setPortfolioData(mergedPortfolio.id, mergedPortfolio);
      }
    },
  });
}
