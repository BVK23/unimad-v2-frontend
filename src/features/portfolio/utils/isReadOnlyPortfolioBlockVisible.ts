import { resolvePortfolioLinkHref } from "@/features/portfolio/utils/external-url";
import { resolvePortfolioBlockType } from "@/features/portfolio/utils/normalizePortfolioBlockType";
import type { PortfolioItem } from "@/types";

/**
 * Empty media / link-box blocks must not mount in read-only views (preview, published).
 * Returning null from the renderer alone still leaves grid-cell height/gap.
 */
export function isReadOnlyPortfolioBlockVisible(item: PortfolioItem): boolean {
  const type = resolvePortfolioBlockType(item);
  if (type === "media") {
    return Boolean(item.content?.trim());
  }
  if (type === "link-box") {
    return Boolean(resolvePortfolioLinkHref(item.linkUrl ?? ""));
  }
  return true;
}
