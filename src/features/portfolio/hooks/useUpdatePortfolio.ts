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
      const savedCoverPosition = variables.profile.coverPosition;
      const mergedPortfolio =
        savedCoverPosition && JSON.stringify(portfolio.profile.coverPosition) !== JSON.stringify(savedCoverPosition)
          ? { ...portfolio, profile: { ...portfolio.profile, coverPosition: savedCoverPosition } }
          : portfolio;

      queryClient.setQueryData(portfolioQueryKey, mergedPortfolio);
      if (mergedPortfolio.id) {
        usePortfolioStore.getState().setPortfolioData(mergedPortfolio.id, mergedPortfolio);
      }
    },
  });
}
