import { normalizeTemplateSpans } from "@/features/portfolio/constants/portfolioLayout";
import { resolvePortfolioBlockType } from "@/features/portfolio/utils/normalizePortfolioBlockType";
import { reconcileHeroProfileContacts } from "@/features/portfolio/utils/reconcileHeroProfileContacts";
import type { ContactButton, PortfolioData, PortfolioItem, UserProfile } from "@/types";
import { resolveMediaDisplayUrl } from "@/utils/resolve-media-url";

function safeObject<T extends Record<string, unknown>>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  return value as T;
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function readMediaUrl(value: unknown): string {
  let raw = "";
  if (typeof value === "string") {
    raw = value;
  } else if (value && typeof value === "object" && !Array.isArray(value)) {
    const url = (value as Record<string, unknown>).url;
    raw = typeof url === "string" ? url : "";
  }
  return resolveMediaDisplayUrl(raw);
}

const V2_UNSUPPORTED_ITEM_TYPES = new Set(["divider"]);

function filterV2PortfolioItems(items: PortfolioItem[]): PortfolioItem[] {
  return items.filter(item => item?.type && !V2_UNSUPPORTED_ITEM_TYPES.has(item.type));
}

function toDate(value: unknown): Date {
  if (typeof value === "string" || value instanceof Date || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

const CONTACT_BUTTON_ICONS = new Set<ContactButton["icon"]>(["phone", "mail", "link", "location"]);

const CONTACT_ICON_TO_BACKEND_TYPE: Record<ContactButton["icon"], string> = {
  phone: "phone",
  mail: "email",
  link: "link",
  location: "location",
};

function mapContactButtonIcon(type: unknown, label: unknown): ContactButton["icon"] {
  const normalized = String(type ?? label ?? "").toLowerCase();

  if (normalized.includes("phone")) return "phone";
  if (normalized.includes("mail") || normalized.includes("email")) return "mail";
  if (normalized.includes("location")) return "location";
  return "link";
}

/** Prefer stored `icon`; fall back to `type` / label inference (API often omits `type`). */
function resolveContactButtonIcon(button: Record<string, unknown>): ContactButton["icon"] {
  const rawIcon = button.icon;
  if (typeof rawIcon === "string" && CONTACT_BUTTON_ICONS.has(rawIcon as ContactButton["icon"])) {
    return rawIcon as ContactButton["icon"];
  }

  return mapContactButtonIcon(button.type, button.label);
}

function mapContactButtonFromDto(button: Record<string, unknown>, index: number): ContactButton {
  return {
    id: String(button.id ?? `${button.type ?? "contact"}-${index}`),
    label: String(button.label ?? ""),
    url: String(button.url ?? button.value ?? ""),
    icon: resolveContactButtonIcon(button),
    isVisible: button.isVisible !== false,
  };
}

function mapContactButtonToBackend(button: ContactButton): Record<string, unknown> {
  return {
    id: button.id,
    label: button.label,
    url: button.url,
    icon: button.icon,
    type: CONTACT_ICON_TO_BACKEND_TYPE[button.icon] ?? "link",
    isVisible: button.isVisible,
  };
}

function readItemsAboveProfileCount(dto: Record<string, unknown>): number {
  const raw = dto.itemsAboveProfileCount;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  return Math.max(0, Math.floor(raw));
}

function readCoverPosition(dto: Record<string, unknown>): UserProfile["coverPosition"] {
  const raw = safeObject<Record<string, unknown>>(dto.coverPosition, {});
  const x = typeof raw.x === "number" && Number.isFinite(raw.x) ? raw.x : 50;
  const y = typeof raw.y === "number" && Number.isFinite(raw.y) ? raw.y : 50;
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}

function readProfileLayoutFields(
  dto: Record<string, unknown>
): Pick<UserProfile, "showProfileSection" | "itemsAboveProfileCount" | "coverPosition"> {
  return {
    showProfileSection: dto.showProfileSection !== false,
    itemsAboveProfileCount: readItemsAboveProfileCount(dto),
    coverPosition: readCoverPosition(dto),
  };
}

function mapProfile(dto: Record<string, unknown>): UserProfile {
  const contactButtonsRaw = safeArray<Record<string, unknown>>(dto.contactButtons);

  return reconcileHeroProfileContacts({
    name: String(dto.name ?? ""),
    tagline: String(dto.tagline ?? ""),
    bio: String(dto.bio ?? ""),
    location: String(dto.location ?? ""),
    email: String(dto.email ?? ""),
    phone: String(dto.phone ?? ""),
    website: String(dto.website ?? ""),
    websiteLabel: String(dto.websiteLabel ?? ""),
    avatarUrl: readMediaUrl(dto.avatarUrl),
    coverUrl: readMediaUrl(dto.coverUrl),
    experience: safeArray(dto.experience),
    education: safeArray(dto.education),
    layout: dto.layout === "centered" ? "centered" : "standard",
    profileAlignment:
      dto.profileAlignment === "left" || dto.profileAlignment === "right" || dto.profileAlignment === "center"
        ? dto.profileAlignment
        : "center",
    infoAlignment:
      dto.infoAlignment === "left" || dto.infoAlignment === "right" || dto.infoAlignment === "center" ? dto.infoAlignment : "left",
    showAvatar: dto.showAvatar !== false,
    showCover: dto.showCover !== false,
    ...readProfileLayoutFields(dto),
    contactButtons: contactButtonsRaw.map(mapContactButtonFromDto),
  });
}

function mapLegacyProfile(dto: Record<string, unknown>): UserProfile {
  const contactButtonsRaw = safeArray<Record<string, unknown>>(dto.contactButtons);

  return reconcileHeroProfileContacts({
    name: String(dto.name ?? ""),
    tagline: String(dto.tagline ?? ""),
    bio: String(dto.bio ?? ""),
    location: String(dto.location ?? ""),
    email: String(dto.email ?? ""),
    phone: String(dto.phone ?? ""),
    website: String(dto.website ?? ""),
    websiteLabel: String(dto.websiteLabel ?? ""),
    avatarUrl: readMediaUrl(dto.profile_pic),
    coverUrl: readMediaUrl(dto.cover_pic),
    experience: safeArray(dto.experience),
    education: safeArray(dto.education),
    layout: dto.layout === "centered" ? "centered" : "standard",
    profileAlignment:
      dto.profileAlignment === "left" || dto.profileAlignment === "right" || dto.profileAlignment === "center"
        ? dto.profileAlignment
        : "center",
    infoAlignment:
      dto.infoAlignment === "left" || dto.infoAlignment === "right" || dto.infoAlignment === "center" ? dto.infoAlignment : "left",
    showAvatar: dto.showAvatar !== false,
    showCover: dto.showCover !== false,
    ...readProfileLayoutFields(dto),
    contactButtons: contactButtonsRaw.map(mapContactButtonFromDto),
  });
}

function normalizePortfolioItemMedia(item: PortfolioItem): PortfolioItem {
  return {
    ...item,
    content: readMediaUrl(item.content),
    canvasCover: item.canvasCover ? readMediaUrl(item.canvasCover) : item.canvasCover,
    linkIcon: item.linkIcon ? readMediaUrl(item.linkIcon) : item.linkIcon,
    detailedBlocks: item.detailedBlocks?.map(normalizePortfolioItemMedia),
  };
}

export function mapBackendPortfolioToFrontend(dto: Record<string, unknown>): PortfolioData {
  const document = safeObject<Record<string, unknown>>(dto.document, {});
  const documentProfile = safeObject<Record<string, unknown>>(document.profile, {});
  const fallbackProfile = safeObject<Record<string, unknown>>(dto.profile, {});

  const rawItems = safeArray<PortfolioItem>(document.items).length
    ? safeArray<PortfolioItem>(document.items)
    : safeArray<PortfolioItem>(dto.items);
  const items = normalizeTemplateSpans(
    filterV2PortfolioItems(
      rawItems.map(item =>
        normalizePortfolioItemMedia({
          ...item,
          type: resolvePortfolioBlockType(item),
        })
      )
    )
  );

  const profileBase = Object.keys(documentProfile).length ? mapProfile(documentProfile) : mapLegacyProfile(fallbackProfile);
  const profile =
    documentProfile.coverPosition === undefined && fallbackProfile.coverPosition !== undefined
      ? { ...profileBase, coverPosition: readCoverPosition(fallbackProfile) }
      : profileBase;

  return {
    id: String(dto.portfolio_id ?? dto.id ?? ""),
    title: profile.name,
    lastModified: toDate(dto.updated_at),
    slug: typeof dto.slug === "string" && dto.slug.trim() ? dto.slug.trim() : undefined,
    isBase: dto.is_base === true || dto.isBase === true,
    themeMode: dto.themeMode === "dark" ? "dark" : "light",
    profile,
    items,
  };
}

export function mapFrontendPortfolioToBackend(portfolio: PortfolioData): Record<string, unknown> {
  const syncedProfile = reconcileHeroProfileContacts(portfolio.profile);

  return {
    portfolio_id: portfolio.id,
    id: portfolio.id,
    name: syncedProfile.name,
    is_base: Boolean(portfolio.isBase),
    profile: {
      name: syncedProfile.name,
      tagline: syncedProfile.tagline,
      bio: syncedProfile.bio,
      location: syncedProfile.location,
      email: syncedProfile.email,
      phone: syncedProfile.phone,
      website: syncedProfile.website,
      websiteLabel: syncedProfile.websiteLabel ?? "",
      profile_pic: syncedProfile.avatarUrl,
      cover_pic: syncedProfile.coverUrl,
      experience: syncedProfile.experience,
      education: syncedProfile.education,
      layout: syncedProfile.layout,
      profileAlignment: syncedProfile.profileAlignment ?? "center",
      infoAlignment: syncedProfile.infoAlignment ?? "left",
      showAvatar: syncedProfile.showAvatar ?? true,
      showCover: syncedProfile.showCover ?? true,
      coverPosition: syncedProfile.coverPosition ?? { x: 50, y: 50 },
      showProfileSection: syncedProfile.showProfileSection !== false,
      itemsAboveProfileCount: Math.max(0, syncedProfile.itemsAboveProfileCount ?? 0),
      contactButtons: syncedProfile.contactButtons?.map(mapContactButtonToBackend) ?? [],
    },
    schemaVersion: 2,
    items: filterV2PortfolioItems(portfolio.items),
  };
}

// ---------------------------------------------------------------------------
// ADK session state (frontend ↔ session PATCH)
// ---------------------------------------------------------------------------

export type PortfolioAdkStateDeltaPayload = {
  active_context: "portfolio";
  current_portfolio: string;
  portfolio_data: Record<string, Record<string, unknown>>;
};

/** Full ADK session state for portfolio context. */
export function buildAdkPortfolioStateDelta(portfolio: PortfolioData): PortfolioAdkStateDeltaPayload {
  const backendPortfolio = mapFrontendPortfolioToBackend(portfolio);
  return {
    active_context: "portfolio",
    current_portfolio: portfolio.id,
    portfolio_data: {
      [portfolio.id]: backendPortfolio,
    },
  };
}

export function buildAdkPortfolioDataMap(portfolios: Record<string, PortfolioData>): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const [id, portfolio] of Object.entries(portfolios)) {
    if (!id || !portfolio) continue;
    out[id] = mapFrontendPortfolioToBackend(portfolio);
  }
  return out;
}

/** Convert ADK session state portfolio_data back to frontend PortfolioData map. */
export function mapAdkPortfolioDataMapToFrontend(rawPortfolioData: unknown): Record<string, PortfolioData> {
  if (!rawPortfolioData || typeof rawPortfolioData !== "object") {
    return {};
  }

  const result: Record<string, PortfolioData> = {};
  for (const [portfolioId, rawPortfolio] of Object.entries(rawPortfolioData as Record<string, unknown>)) {
    if (!portfolioId || !rawPortfolio || typeof rawPortfolio !== "object") {
      continue;
    }

    const normalized = {
      ...(rawPortfolio as Record<string, unknown>),
      portfolio_id: String((rawPortfolio as Record<string, unknown>).portfolio_id ?? portfolioId),
      id: String((rawPortfolio as Record<string, unknown>).id ?? portfolioId),
    };

    result[portfolioId] = mapBackendPortfolioToFrontend(normalized);
  }

  return result;
}
