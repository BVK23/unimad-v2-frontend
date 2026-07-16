"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "./get-query-client";

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // Avoid useState for QueryClient when children may suspend — React can discard
  // the client on the initial render if there is no Suspense boundary below us.
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
