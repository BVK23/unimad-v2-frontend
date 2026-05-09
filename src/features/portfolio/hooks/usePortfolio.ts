import type { PortfolioData } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { mapBackendPortfolioToFrontend } from "../api/mappers";
import { fetchPortfolioContent } from "../server-actions/portfolio-actions";

export const portfolioQueryKey = ["portfolio"] as const;

export function usePortfolio() {
  return useQuery({
    queryKey: portfolioQueryKey,
    queryFn: async (): Promise<PortfolioData | null> => {
      const response = await fetchPortfolioContent();

      if (!response.assetData) {
        return null;
      }

      return mapBackendPortfolioToFrontend(response.assetData);
    },
    staleTime: 1000 * 60 * 2,
  });
}
