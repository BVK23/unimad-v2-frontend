import type { PortfolioData } from "@/types";

type PortfolioContentSnapshot = {
  id: string;
  title: string;
  slug: string;
  themeMode: PortfolioData["themeMode"];
  isBase: boolean;
  profile: PortfolioData["profile"];
  items: PortfolioData["items"];
};

export function getPortfolioContentSignature(portfolio: PortfolioData): string {
  const snapshot: PortfolioContentSnapshot = {
    id: portfolio.id,
    title: portfolio.title,
    slug: portfolio.slug?.trim() ?? "",
    themeMode: portfolio.themeMode,
    isBase: Boolean(portfolio.isBase),
    profile: portfolio.profile,
    items: portfolio.items,
  };

  return JSON.stringify(snapshot);
}
