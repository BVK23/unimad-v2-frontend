import { QueryClient, isServer } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Avoid immediate client refetch of SSR/hydrated data
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Shared QueryClient for App Router.
 * - Browser: singleton (survives Suspense/HMR without throwing away the provider client)
 * - Server: new client per call site; ReactQueryProvider should be the only caller per request tree
 *
 * Prefer importing this from the same module that wraps QueryClientProvider so Turbopack
 * cannot split provider context vs hooks across duplicate package instances.
 */
export function getQueryClient() {
  if (isServer || typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
