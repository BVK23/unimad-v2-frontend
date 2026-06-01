import type { PortfolioData, PortfolioItem, UserProfile } from "@/types";

export type PortfolioHighlightKind = "added" | "modified" | "removed";

/** Keys: `hero`, `block:<itemId>`, `page:<pageId>:block:<nestedId>` */
export type PortfolioHighlightMap = Partial<Record<string, PortfolioHighlightKind>>;

export const EMPTY_PORTFOLIO_HIGHLIGHT_MAP: PortfolioHighlightMap = {};

function profileSig(profile: UserProfile): string {
  return JSON.stringify({
    name: profile.name,
    tagline: profile.tagline,
    bio: profile.bio,
    location: profile.location,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    websiteLabel: profile.websiteLabel,
    avatarUrl: profile.avatarUrl,
    coverUrl: profile.coverUrl,
    contactButtons: profile.contactButtons,
    experience: profile.experience,
    education: profile.education,
    profileAlignment: profile.profileAlignment,
    showAvatar: profile.showAvatar,
    showCover: profile.showCover,
  });
}

function blockSig(item: PortfolioItem): string {
  return JSON.stringify({
    type: item.type,
    title: item.title,
    content: item.content,
    description: item.description,
    linkUrl: item.linkUrl,
    span: item.span,
    fontSize: item.fontSize,
    fontWeight: item.fontWeight,
  });
}

function nestedBlockSig(item: PortfolioItem): string {
  return JSON.stringify({
    type: item.type,
    title: item.title,
    content: item.content,
    description: item.description,
    linkUrl: item.linkUrl,
    span: item.span,
    fontSize: item.fontSize,
    fontWeight: item.fontWeight,
    detailedBlocks: (item.detailedBlocks ?? []).map(nestedBlockSig),
  });
}

function isPageLikeBlock(item: PortfolioItem): boolean {
  return item.type === "page-card" || item.type === "project";
}

export function derivePortfolioBannerTitle(highlights: PortfolioHighlightMap): string {
  const keys = Object.keys(highlights);
  if (keys.length === 0) return "Portfolio updated";

  if (highlights.hero) {
    if (highlights.hero === "added") return "Hero section added";
    return "Hero section updated";
  }

  const blockKeys = keys.filter(k => k.startsWith("block:"));
  const added = blockKeys.filter(k => highlights[k] === "added").length;
  const modified = blockKeys.filter(k => highlights[k] === "modified").length;
  const removed = blockKeys.filter(k => highlights[k] === "removed").length;

  if (added && !modified && !removed) {
    return added === 1 ? "Block added" : `${added} blocks added`;
  }
  if (removed && !added && !modified) {
    return removed === 1 ? "Block removed" : `${removed} blocks removed`;
  }
  if (modified && blockKeys.length === 1 && !added && !removed) {
    return "Block updated";
  }

  return "Portfolio updated";
}

export function computeAdkPortfolioReviewFromDiff(
  prev: PortfolioData | undefined,
  next: PortfolioData | undefined
): {
  highlights: PortfolioHighlightMap;
  bannerTitle: string;
} {
  if (!prev || !next || prev.id !== next.id) {
    return { highlights: {}, bannerTitle: "Portfolio updated" };
  }

  const highlights: PortfolioHighlightMap = {};

  if (profileSig(prev.profile) !== profileSig(next.profile)) {
    highlights.hero = "modified";
  }

  const prevIds = new Set(prev.items.map(i => i.id));
  const nextIds = new Set(next.items.map(i => i.id));

  for (const item of next.items) {
    const key = `block:${item.id}`;
    if (!prevIds.has(item.id)) {
      highlights[key] = "added";
      continue;
    }
    const oldItem = prev.items.find(x => x.id === item.id);
    if (oldItem && blockSig(oldItem) !== blockSig(item)) {
      highlights[key] = "modified";
    }

    if (!oldItem || !isPageLikeBlock(item)) {
      continue;
    }
    const prevNested = oldItem.detailedBlocks ?? [];
    const nextNested = item.detailedBlocks ?? [];
    const prevNestedIds = new Set(prevNested.map(n => n.id));
    const nextNestedIds = new Set(nextNested.map(n => n.id));

    for (const nested of nextNested) {
      const nestedKey = `page:${item.id}:block:${nested.id}`;
      if (!prevNestedIds.has(nested.id)) {
        highlights[nestedKey] = "added";
        continue;
      }
      const oldNested = prevNested.find(x => x.id === nested.id);
      if (oldNested && nestedBlockSig(oldNested) !== nestedBlockSig(nested)) {
        highlights[nestedKey] = "modified";
      }
    }

    for (const nestedId of prevNestedIds) {
      if (!nextNestedIds.has(nestedId)) {
        highlights[`page:${item.id}:block:${nestedId}`] = "removed";
      }
    }
  }

  for (const id of prevIds) {
    if (!nextIds.has(id)) {
      highlights[`block:${id}`] = "removed";
    }
  }

  const bannerTitle = derivePortfolioBannerTitle(highlights);
  return { highlights, bannerTitle };
}
