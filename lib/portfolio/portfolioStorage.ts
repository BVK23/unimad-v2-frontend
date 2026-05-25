import type { PortfolioData } from "@/types";

const PUBLISHED_PREFIX = "unimad-portfolio-published:";
const DRAFT_PREFIX = "unimad-portfolio-draft:";

export function loadPublishedUrl(portfolioId: string): string | null {
  if (typeof window === "undefined" || !portfolioId) return null;
  try {
    return localStorage.getItem(`${PUBLISHED_PREFIX}${portfolioId}`);
  } catch {
    return null;
  }
}

export function savePublishedUrl(portfolioId: string, url: string): void {
  if (typeof window === "undefined" || !portfolioId) return;
  try {
    localStorage.setItem(`${PUBLISHED_PREFIX}${portfolioId}`, url);
  } catch {
    /* ignore */
  }
}

export function savePortfolioDraft(portfolioId: string, data: PortfolioData): void {
  if (typeof window === "undefined" || !portfolioId) return;
  try {
    localStorage.setItem(`${DRAFT_PREFIX}${portfolioId}`, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}
