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
    onSuccess: portfolio => {
      queryClient.setQueryData(portfolioQueryKey, portfolio);
      if (portfolio.id) {
        usePortfolioStore.getState().setPortfolioData(portfolio.id, portfolio);
      }
    },
  });
}
