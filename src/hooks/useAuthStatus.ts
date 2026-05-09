import { authCheck } from "@/lib/actions/authCheckAction";
import { useQuery } from "@tanstack/react-query";

export function useAuthStatus() {
  const {
    data: isAuthenticated,
    isLoading,
    refetch: refetchAuthStatus,
  } = useQuery({
    queryKey: ["authStatus"],
    queryFn: async () => {
      try {
        return await authCheck();
      } catch {
        return false;
      }
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 5 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  return { isAuthenticated: !!isAuthenticated, isLoading, refetchAuthStatus };
}
