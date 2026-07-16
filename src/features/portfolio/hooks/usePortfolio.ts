import { useEffect, useRef } from "react";
import { coachActAsQueryScope, useCoachActAsSession } from "@/contexts/CoachActAsContext";
import { mapBackendPortfolioToFrontend } from "@/features/portfolio/api/mappers";
import { fetchPortfolioContent } from "@/features/portfolio/server-actions/portfolio-actions";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { getPortfolioContentSignature } from "@/features/portfolio/utils/getPortfolioContentSignature";
import type { PortfolioData } from "@/types";
import { useQuery, type QueryClient } from "@tanstack/react-query";

export const portfolioQueryKey = ["portfolio"] as const;

export function portfolioQueryKeyFor(session: ReturnType<typeof useCoachActAsSession>) {
  return [...portfolioQueryKey, ...coachActAsQueryScope(session)] as const;
}

export const portfolioByIdQueryKey = (id: string) => ["portfolio", id] as const;

/**
 * Write the live portfolio into every React Query cache entry the editor actually reads.
 * `usePortfolio` keys are `["portfolio","self"]` or `["portfolio","coach-act-as",…]` —
 * writing only `["portfolio"]` leaves the UI on a stale Django snapshot after ADK mutators.
 */
export function setLivePortfolioQueryData(queryClient: QueryClient, portfolio: PortfolioData): void {
  queryClient.setQueryData(portfolioQueryKey, portfolio);
  queryClient.setQueriesData<PortfolioData | null>(
    {
      predicate: query => {
        const key = query.queryKey;
        if (!Array.isArray(key) || key[0] !== "portfolio") return false;
        return key[1] === "self" || key[1] === "coach-act-as";
      },
    },
    portfolio
  );
}

export function usePortfolio() {
  const actAs = useCoachActAsSession();
  const lastHydratedSnapshotRef = useRef<string>("");

  const query = useQuery({
    queryKey: portfolioQueryKeyFor(actAs),
    queryFn: async (): Promise<PortfolioData | null> => {
      const response = await fetchPortfolioContent();

      if (!response.assetData) {
        return null;
      }

      return mapBackendPortfolioToFrontend(response.assetData);
    },
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    if (!query.data?.id) return;

    const portfolioId = query.data.id;
    const nextSnapshot = `${portfolioId}:${getPortfolioContentSignature(query.data)}`;
    if (lastHydratedSnapshotRef.current === nextSnapshot) return;

    const current = usePortfolioStore.getState().getPortfolioData(portfolioId);
    if (current) {
      // Portfolio editor seeds the store on mount; never replace active in-memory edits from query cache.
      lastHydratedSnapshotRef.current = nextSnapshot;
      return;
    }

    usePortfolioStore.getState().setPortfolioData(portfolioId, query.data);
    lastHydratedSnapshotRef.current = nextSnapshot;
  }, [query.data]);

  return query;
}
