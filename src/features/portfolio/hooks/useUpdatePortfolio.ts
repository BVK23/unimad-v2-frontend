import type { PortfolioData } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mapBackendPortfolioToFrontend, mapFrontendPortfolioToBackend } from "../api/mappers";
import { updatePortfolioContent } from "../server-actions/portfolio-actions";
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
    },
  });
}
