import type { ApplicationAssetApiType } from "@/features/application-assets/types";

const STUDIO_ASSET_FEATURES = new Set(["coverletter", "coldemail", "referral", "linkedin_post"]);

export function normalizeScopePart(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function applicationAssetScopeFeatureId(role: string, company: string): string {
  return normalizeScopePart(`${company}|${role}`);
}

export function linkedInTopicSlug(topic: string | undefined): string {
  const slug = topic?.trim() ? normalizeScopePart(topic).slice(0, 120) : "active";
  return slug;
}

export function buildStudioAssetContentKey(params: {
  assetType: ApplicationAssetApiType | string;
  assetId?: string | null;
  role?: string | null;
  company?: string | null;
}): string {
  const assetType = (params.assetType ?? "").trim().toLowerCase();
  const assetId = (params.assetId ?? "").trim();
  if (assetId) {
    return `${assetType}:${assetId}`;
  }
  const scope = applicationAssetScopeFeatureId(params.role ?? "", params.company ?? "");
  return `${assetType}:scope:${scope || "active"}`;
}

export function buildLinkedInTopicContentKey(topic?: string): string {
  return `linkedin_topic:${linkedInTopicSlug(topic)}`;
}

export function buildLinkedInPostContentKey(params: { assetId?: string | null; topic?: string | null }): string {
  const assetId = (params.assetId ?? "").trim();
  if (assetId) {
    return `linkedin_post:${assetId}`;
  }
  return `linkedin_post:topic:${linkedInTopicSlug(params.topic ?? undefined)}`;
}

export function buildResumeImproveContentKey(resumeId: string, section: string, entryId?: string): string {
  const rid = resumeId.trim();
  const sec = section.trim().toLowerCase();
  const eid = (entryId ?? "").trim();
  if (sec && eid) {
    return `resume:${rid}:${sec}:${eid}`;
  }
  if (sec) {
    return `resume:${rid}:${sec}`;
  }
  return `resume:${rid}`;
}

export function buildLinkedInImproveContentKey(profileKey: string, section: string, entryId?: string): string {
  const sec = section.trim().toLowerCase();
  const eid = (entryId ?? "").trim();
  if (eid) {
    return `linkedin:${sec}:${eid}`;
  }
  return `linkedin:${sec}`;
}

/** Map legacy registry rows to canonical content keys for lookup. */
export function resolveRegistryContentKey(row: {
  feature?: string | null;
  feature_id?: string | null;
  section?: string | null;
  entry_id?: string | null;
  content_key?: string | null;
}): string {
  const existing = (row.content_key ?? "").trim();
  if (existing) {
    return existing;
  }

  const feature = (row.feature ?? "").trim().toLowerCase();
  const featureId = (row.feature_id ?? "").trim();
  const section = (row.section ?? "").trim();
  const entryId = (row.entry_id ?? "").trim();

  if (feature === "application_asset") {
    return buildStudioAssetContentKey({
      assetType: section || "coverletter",
      assetId: entryId && !entryId.includes("|") ? entryId : null,
      role: featureId.includes("|") ? featureId.split("|")[1] : "",
      company: featureId.includes("|") ? featureId.split("|")[0] : featureId,
    });
  }

  if (feature === "content_gen") {
    if (section === "topic") {
      return buildLinkedInTopicContentKey(featureId.replace(/^topic:/, ""));
    }
    const slug = featureId.replace(/^draft:/, "");
    if (/^\d+$/.test(slug)) {
      return buildLinkedInPostContentKey({ assetId: slug });
    }
    return buildLinkedInPostContentKey({ topic: slug });
  }

  if (STUDIO_ASSET_FEATURES.has(feature)) {
    return buildStudioAssetContentKey({
      assetType: feature,
      assetId: /^\d+$/.test(featureId) ? featureId : null,
      role: "",
      company: featureId.includes("|") ? featureId : "",
    });
  }

  if (feature === "linkedin_topic") {
    return buildLinkedInTopicContentKey(featureId);
  }

  if (feature === "linkedin_post") {
    return buildLinkedInPostContentKey({
      assetId: /^\d+$/.test(featureId) ? featureId : null,
      topic: featureId,
    });
  }

  if (feature === "resume") {
    return buildResumeImproveContentKey(featureId, section, entryId);
  }

  if (feature === "linkedin") {
    return buildLinkedInImproveContentKey(featureId, section, entryId);
  }

  return `${feature}:${featureId}:${section}:${entryId}`.replace(/:+$/, "");
}
