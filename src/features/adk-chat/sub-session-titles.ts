import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { useResumeStore } from "@/features/resume/store/useResumeStore";
import type { UnibotAdkSessionRow } from "./session-registry";

const STUDIO_LABELS: Record<ApplicationAssetApiType, string> = {
  coverletter: "COVER LETTER",
  coldemail: "COLD EMAIL",
  referral: "REFERRAL",
};

const RESUME_SECTION_LABELS: Record<string, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  certifications: "Certifications",
  skills: "Skills",
  custom: "Custom",
};

const LINKEDIN_SECTION_SHORT: Record<string, string> = {
  headline: "Headline",
  about: "About",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  connection: "Connection",
  pic: "Profile Pic",
  cover: "Cover Pic",
};

export function truncateForSubThreadTitle(text: string, max = 52): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function buildStudioAssetDraftTitle(assetType: ApplicationAssetApiType, assetId?: string | null): string {
  const label = STUDIO_LABELS[assetType] ?? "DOCUMENT";
  const id = (assetId ?? "").trim();
  return id ? `${label} · ${id}` : label;
}

export function buildStudioAssetDraftSubtitle(company?: string, role?: string): string | undefined {
  const c = company?.trim();
  const r = role?.trim();
  if (c && r) {
    return `${r} · ${c}`;
  }
  if (c) {
    return c;
  }
  if (r) {
    return r;
  }
  return undefined;
}

export function buildStudioAssetImproveTitle(assetType: ApplicationAssetApiType, assetId?: string | null): string {
  return buildStudioAssetDraftTitle(assetType, assetId);
}

export function buildResumeImproveTitle(section: string): string {
  const label = RESUME_SECTION_LABELS[section.toLowerCase()] ?? section.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return `Improve ${label} · Resume`;
}

export function buildLinkedInImproveTitle(section: string, displayName?: string): string {
  const short = LINKEDIN_SECTION_SHORT[section.toLowerCase()] ?? displayName ?? section;
  return `Improve LN ${short}`;
}

function normalizeLegacyLinkedInPostTitle(title: string): string | null {
  const trimmed = title.trim();
  const fromLinkedIn = trimmed.match(/^LinkedIn\s*·\s*(.+)$/i)?.[1]?.trim();
  if (fromLinkedIn) return fromLinkedIn;
  const fromLnPost = trimmed.match(/^LN POST\s*·\s*(.+)$/i)?.[1]?.trim();
  if (fromLnPost) return fromLnPost;
  if (/^Improve LinkedIn Post$/i.test(trimmed)) return null;
  return null;
}

function normalizeStoredPostTitle(stored: string): string | null {
  const legacy = normalizeLegacyLinkedInPostTitle(stored);
  if (legacy) return buildLinkedInPostTitle(legacy);
  if (/^LN POST/i.test(stored.trim())) return stored.trim();
  return null;
}

function parseCompanyRoleScope(featureId: string): { company?: string; role?: string } {
  const fid = featureId.trim();
  if (!fid || /^\d+$/.test(fid) || !fid.includes("|")) {
    return {};
  }
  const pipe = fid.indexOf("|");
  return {
    company: fid.slice(0, pipe).trim(),
    role: fid.slice(pipe + 1).trim(),
  };
}

export function buildLinkedInPostTitle(topic: string): string {
  const legacy = normalizeLegacyLinkedInPostTitle(topic);
  const t = truncateForSubThreadTitle(legacy ?? topic);
  return t ? `LN POST · ${t}` : "LN POST";
}

export function buildLinkedInTopicPickerTitle(): string {
  return "Topic Picker";
}

const STUDIO_ASSET_FEATURES = new Set(["coverletter", "coldemail", "referral"]);

function isStudioAssetFeature(feature: string): feature is ApplicationAssetApiType {
  return STUDIO_ASSET_FEATURES.has(feature);
}

/** Canonical UI title from registry feature/section — ignores stale DB titles like "Resume · …". */
export function deriveSubSessionDisplayTitle(
  row: Pick<UnibotAdkSessionRow, "feature" | "section" | "feature_id" | "title" | "entry_id">
): string {
  const feature = (row.feature ?? "").trim().toLowerCase();
  const section = (row.section ?? "").trim();

  if (feature === "linkedin") {
    return buildLinkedInImproveTitle(section);
  }
  if (feature === "resume") {
    return buildResumeImproveTitle(section);
  }
  if (isStudioAssetFeature(feature)) {
    const assetId = /^\d+$/.test(row.feature_id ?? "") ? row.feature_id : row.entry_id || null;
    return buildStudioAssetDraftTitle(feature, assetId);
  }
  if (feature === "application_asset" && isStudioAssetFeature(section)) {
    const assetId = /^\d+$/.test(row.feature_id ?? "") ? row.feature_id : row.entry_id || null;
    return buildStudioAssetDraftTitle(section as ApplicationAssetApiType, assetId);
  }
  if (feature === "linkedin_post") {
    const topic = (row.feature_id ?? "").replace(/^draft:/, "").trim();
    if (topic && !/^\d+$/.test(topic)) {
      return buildLinkedInPostTitle(topic);
    }
    const stored = normalizeStoredPostTitle(row.title ?? "");
    if (stored) return stored;
    if (/^\d+$/.test(topic)) {
      return `LN POST · ${topic}`;
    }
    return buildLinkedInPostTitle("");
  }
  if (feature === "linkedin_topic") {
    return buildLinkedInTopicPickerTitle();
  }
  if (feature === "content_gen") {
    if (section === "topic") {
      return buildLinkedInTopicPickerTitle();
    }
    const topic = (row.feature_id ?? "").replace(/^draft:/, "").trim();
    return buildLinkedInPostTitle(topic || "Post");
  }

  const stored = row.title?.trim();
  if (stored && !/^Resume\s*·/i.test(stored)) {
    return stored;
  }
  if (section) {
    return buildResumeImproveTitle(section);
  }
  return stored || "Improve thread";
}

export function deriveSubSessionSubtitle(
  row: Pick<UnibotAdkSessionRow, "feature" | "section" | "feature_id" | "entry_id" | "content_key">
): string | undefined {
  const feature = (row.feature ?? "").trim().toLowerCase();
  const section = (row.section ?? "").trim().toLowerCase();

  const subtitleFromScope = (raw: string | null | undefined) => {
    const scope = parseCompanyRoleScope(raw ?? "");
    return buildStudioAssetDraftSubtitle(scope.company, scope.role);
  };

  const studioAssetSubtitle = (): string | undefined => {
    const fromFeatureId = subtitleFromScope(row.feature_id);
    if (fromFeatureId) return fromFeatureId;
    if (/^\d+$/.test((row.feature_id ?? "").trim())) {
      const fromEntry = subtitleFromScope(row.entry_id);
      if (fromEntry) return fromEntry;
    }
    const key = (row.content_key ?? "").trim();
    const scopeMatch = key.match(/^[^:]+:scope:(.+)$/);
    if (scopeMatch?.[1]) {
      return subtitleFromScope(scopeMatch[1]);
    }
    return undefined;
  };

  if (isStudioAssetFeature(feature)) {
    return studioAssetSubtitle();
  }
  if (feature === "application_asset" && isStudioAssetFeature(section)) {
    return studioAssetSubtitle();
  }
  if (feature === "linkedin") {
    return "LinkedIn profile";
  }
  if (feature === "resume") {
    const resumeId = (row.feature_id ?? "").trim();
    if (resumeId) {
      const title = useResumeStore.getState().resumeData[resumeId]?.title?.trim();
      if (title) {
        return truncateForSubThreadTitle(title, 40);
      }
      return `Resume ${resumeId}`;
    }
    return "Resume";
  }
  if (feature === "linkedin_topic") {
    return "Topic ideas";
  }
  return undefined;
}

export function displayTitleForSubSession(
  row: Pick<UnibotAdkSessionRow, "feature" | "section" | "feature_id" | "title" | "entry_id"> | undefined,
  preferredTitle?: string
): string {
  const preferred = preferredTitle?.trim();
  const legacyPreferred = preferred ? normalizeLegacyLinkedInPostTitle(preferred) : null;
  if (legacyPreferred) {
    return buildLinkedInPostTitle(legacyPreferred);
  }
  if (preferred && !/^Improve LinkedIn Post$/i.test(preferred)) {
    if (/^LN POST/i.test(preferred) || /^COVER LETTER/i.test(preferred) || /^COLD EMAIL/i.test(preferred) || /^REFERRAL/i.test(preferred)) {
      return preferred;
    }
    if (row?.feature === "linkedin_post" || row?.feature === "content_gen") {
      return buildLinkedInPostTitle(preferred);
    }
  }
  if (row) {
    return deriveSubSessionDisplayTitle(row);
  }
  return preferred || "Improve thread";
}
