import type { ContactButton, PortfolioData, PortfolioItem, UserProfile } from "@/types";

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
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const url = (value as Record<string, unknown>).url;
    return typeof url === "string" ? url : "";
  }

  return "";
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

function mapContactButtonIcon(type: unknown, label: unknown): ContactButton["icon"] {
  const normalized = String(type ?? label ?? "").toLowerCase();

  if (normalized.includes("phone")) return "phone";
  if (normalized.includes("mail") || normalized.includes("email")) return "mail";
  if (normalized.includes("location")) return "location";
  return "link";
}

function mapProfile(dto: Record<string, unknown>): UserProfile {
  const contactButtonsRaw = safeArray<Record<string, unknown>>(dto.contactButtons);

  return {
    name: String(dto.name ?? ""),
    tagline: String(dto.tagline ?? ""),
    bio: String(dto.bio ?? ""),
    location: String(dto.location ?? ""),
    email: String(dto.email ?? ""),
    phone: String(dto.phone ?? ""),
    website: String(dto.website ?? ""),
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
    contactButtons: contactButtonsRaw.map((button, index) => ({
      id: String(button.id ?? `${button.type ?? "contact"}-${index}`),
      label: String(button.label ?? ""),
      url: String(button.url ?? ""),
      icon: mapContactButtonIcon(button.type, button.label),
      isVisible: button.isVisible !== false,
    })),
  };
}

function mapLegacyProfile(dto: Record<string, unknown>): UserProfile {
  const contactButtonsRaw = safeArray<Record<string, unknown>>(dto.contactButtons);

  return {
    name: String(dto.name ?? ""),
    tagline: String(dto.tagline ?? ""),
    bio: String(dto.bio ?? ""),
    location: String(dto.location ?? ""),
    email: String(dto.email ?? ""),
    phone: String(dto.phone ?? ""),
    website: String(dto.website ?? ""),
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
    contactButtons: contactButtonsRaw.map((button, index) => ({
      id: String(button.id ?? `${button.type ?? "contact"}-${index}`),
      label: String(button.label ?? ""),
      url: String(button.url ?? ""),
      icon: mapContactButtonIcon(button.type, button.label),
      isVisible: button.isVisible !== false,
    })),
  };
}

export function mapBackendPortfolioToFrontend(dto: Record<string, unknown>): PortfolioData {
  const document = safeObject<Record<string, unknown>>(dto.document, {});
  const documentProfile = safeObject<Record<string, unknown>>(document.profile, {});
  const fallbackProfile = safeObject<Record<string, unknown>>(dto.profile, {});

  const items = safeArray<PortfolioItem>(document.items).length
    ? safeArray<PortfolioItem>(document.items)
    : safeArray<PortfolioItem>(dto.items);

  return {
    id: String(dto.portfolio_id ?? dto.id ?? ""),
    title: String(dto.name ?? "Untitled Portfolio"),
    lastModified: toDate(dto.updated_at),
    slug: typeof dto.slug === "string" && dto.slug.trim() ? dto.slug.trim() : undefined,
    isBase: dto.is_base === true || dto.isBase === true,
    themeMode: dto.themeMode === "dark" ? "dark" : "light",
    profile: Object.keys(documentProfile).length ? mapProfile(documentProfile) : mapLegacyProfile(fallbackProfile),
    items,
  };
}

export function mapFrontendPortfolioToBackend(portfolio: PortfolioData): Record<string, unknown> {
  return {
    portfolio_id: portfolio.id,
    name: portfolio.title,
    is_base: Boolean(portfolio.isBase),
    profile: {
      name: portfolio.profile.name,
      tagline: portfolio.profile.tagline,
      bio: portfolio.profile.bio,
      location: portfolio.profile.location,
      email: portfolio.profile.email,
      phone: portfolio.profile.phone,
      website: portfolio.profile.website,
      profile_pic: portfolio.profile.avatarUrl,
      cover_pic: portfolio.profile.coverUrl,
      experience: portfolio.profile.experience,
      education: portfolio.profile.education,
      layout: portfolio.profile.layout,
      profileAlignment: portfolio.profile.profileAlignment ?? "center",
      infoAlignment: portfolio.profile.infoAlignment ?? "left",
      showAvatar: portfolio.profile.showAvatar ?? true,
      showCover: portfolio.profile.showCover ?? true,
      contactButtons: portfolio.profile.contactButtons ?? [],
    },
    schemaVersion: 2,
    items: portfolio.items,
  };
}
