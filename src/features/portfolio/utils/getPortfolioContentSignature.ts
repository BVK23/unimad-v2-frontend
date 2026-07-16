import type { PortfolioData, PortfolioItem } from "@/types";

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

/** Strip layout-only fields so ADK Accept/Discard hold isn't broken by colStart/height settle. */
function stripLayoutFields(item: PortfolioItem): Record<string, unknown> {
  const {
    colStart: _colStart,
    height: _height,
    ...rest
  } = item as PortfolioItem & {
    colStart?: unknown;
    height?: unknown;
  };
  const nested = (rest as { detailedBlocks?: PortfolioItem[] }).detailedBlocks;
  if (Array.isArray(nested)) {
    return {
      ...rest,
      detailedBlocks: nested.map(stripLayoutFields),
    };
  }
  return rest as Record<string, unknown>;
}

/**
 * Editorial signature for ADK review hold: content/profile only.
 * Ignores grid layout settle (colStart/height) that happens after Unibot inserts blocks.
 */
export function getPortfolioEditorialSignature(portfolio: PortfolioData): string {
  return JSON.stringify({
    id: portfolio.id,
    title: portfolio.title,
    slug: portfolio.slug?.trim() ?? "",
    themeMode: portfolio.themeMode,
    isBase: Boolean(portfolio.isBase),
    profile: portfolio.profile,
    items: (portfolio.items ?? []).map(stripLayoutFields),
  });
}
