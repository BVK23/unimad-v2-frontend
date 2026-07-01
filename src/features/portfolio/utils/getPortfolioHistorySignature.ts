import type { PortfolioItem, UserProfile } from "@/types";

export type PortfolioHistorySnapshot = {
  items: PortfolioItem[];
  profile: UserProfile;
};

/** Lightweight signature for undo debounce change detection (items + profile only). */
export function getPortfolioHistorySignature(snapshot: PortfolioHistorySnapshot): string {
  return JSON.stringify(snapshot);
}
