"use client";

import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { resolveAdkSessionOptionsForFeatureSection } from "@/src/features/adk-chat/resolve-sub-session-adk-app";
import {
  applicationAssetScopeFeatureId,
  buildLinkedInPostContentKey,
  buildLinkedInTopicContentKey,
  buildStudioAssetContentKey,
  linkedInTopicSlug,
} from "@/src/features/adk-chat/sub-session-content-key";
import {
  buildLinkedInPostTitle,
  buildLinkedInTopicPickerTitle,
  buildStudioAssetDraftTitle,
  deriveSubSessionDisplayTitle,
} from "@/src/features/adk-chat/sub-session-titles";
import { createSessionAction } from "./actions";
import { upsertRegistryRow } from "./session-registry";
import { registerUnibotAdkSessionAction } from "./unibot-adk-session-actions";

export interface ResolveFeatureSubSessionResult {
  success: boolean;
  adkSessionId?: string;
  title?: string;
  reused?: boolean;
  error?: string;
}

/** @deprecated Use applicationAssetScopeFeatureId from sub-session-content-key */
export function applicationAssetFeatureId(role: string, company: string): string {
  return applicationAssetScopeFeatureId(role, company);
}

/** @deprecated Legacy content_gen id shape */
export function contentGenFeatureId(topic: string | undefined, mode: "topic" | "draft"): string {
  const slug = linkedInTopicSlug(topic);
  return `${mode}:${slug}`;
}

async function resolveFeatureSubSession(params: {
  userId: string;
  mainAdkSessionId: string;
  feature: string;
  section: string;
  featureId: string;
  entryId?: string;
  title: string;
  contentKey?: string;
}): Promise<ResolveFeatureSubSessionResult> {
  const entryId = params.entryId?.trim() ?? "";

  const lookup = await registerUnibotAdkSessionAction({
    kind: "sub",
    parent_adk_session_id: params.mainAdkSessionId,
    feature: params.feature,
    feature_id: params.featureId,
    section: params.section,
    entry_id: entryId,
    content_key: params.contentKey ?? null,
    title: params.title,
  });

  if (!lookup.success) {
    return { success: false, error: lookup.error ?? "Sub-session lookup failed" };
  }

  if (lookup.reused && lookup.session) {
    upsertRegistryRow(lookup.session);
    return {
      success: true,
      adkSessionId: lookup.session.adk_session_id,
      title: params.title?.trim() || deriveSubSessionDisplayTitle(lookup.session),
      reused: true,
    };
  }

  if (lookup.session?.adk_session_id) {
    upsertRegistryRow(lookup.session);
    return {
      success: true,
      adkSessionId: lookup.session.adk_session_id,
      title: params.title?.trim() || deriveSubSessionDisplayTitle(lookup.session),
      reused: false,
    };
  }

  if (!lookup.needs_adk_session) {
    return { success: false, error: lookup.error ?? "Unexpected register response" };
  }

  const adkSessionOptions = resolveAdkSessionOptionsForFeatureSection(params.feature, params.section);

  const created = await createSessionAction(params.userId, adkSessionOptions);
  if (!created.success || !created.sessionId) {
    return { success: false, error: created.error ?? "ADK session creation failed" };
  }

  const reg = await registerUnibotAdkSessionAction({
    adk_session_id: created.sessionId,
    kind: "sub",
    parent_adk_session_id: params.mainAdkSessionId,
    feature: params.feature,
    feature_id: params.featureId,
    section: params.section,
    entry_id: entryId,
    title: params.title,
    content_key: params.contentKey ?? null,
  });

  if (!reg.success || !reg.session) {
    return { success: false, error: reg.error ?? "Sub-session register failed" };
  }

  upsertRegistryRow(reg.session);
  return {
    success: true,
    adkSessionId: reg.session.adk_session_id,
    title: params.title?.trim() || deriveSubSessionDisplayTitle(reg.session),
    reused: false,
  };
}

export async function resolveContentGenSubSession(params: {
  userId: string;
  mainAdkSessionId: string;
  mode: "topic" | "draft";
  topic?: string;
  assetId?: string | null;
  title?: string;
}): Promise<ResolveFeatureSubSessionResult> {
  if (params.mode === "topic") {
    const slug = linkedInTopicSlug(params.topic);
    return resolveFeatureSubSession({
      userId: params.userId,
      mainAdkSessionId: params.mainAdkSessionId,
      feature: "linkedin_topic",
      section: "",
      featureId: slug,
      title: params.title ?? buildLinkedInTopicPickerTitle(),
      contentKey: buildLinkedInTopicContentKey(params.topic),
    });
  }

  const assetId = params.assetId?.trim();
  const topic = params.topic?.trim() ?? "";
  return resolveFeatureSubSession({
    userId: params.userId,
    mainAdkSessionId: params.mainAdkSessionId,
    feature: "linkedin_post",
    section: "",
    featureId: assetId || linkedInTopicSlug(topic),
    title: params.title ?? buildLinkedInPostTitle(topic),
    contentKey: buildLinkedInPostContentKey({ assetId, topic }),
  });
}

export async function resolveApplicationAssetSubSession(params: {
  userId: string;
  mainAdkSessionId: string;
  assetType: ApplicationAssetApiType;
  role: string;
  company: string;
  assetId?: string | null;
  title?: string;
}): Promise<ResolveFeatureSubSessionResult> {
  const assetId = params.assetId?.trim();
  const scopeFeatureId = applicationAssetScopeFeatureId(params.role, params.company);
  const featureId = assetId || scopeFeatureId;

  return resolveFeatureSubSession({
    userId: params.userId,
    mainAdkSessionId: params.mainAdkSessionId,
    feature: params.assetType,
    section: "",
    featureId,
    entryId: assetId ? `${params.company.trim()}|${params.role.trim()}` : "",
    title: params.title ?? buildStudioAssetDraftTitle(params.assetType, assetId),
    contentKey: buildStudioAssetContentKey({
      assetType: params.assetType,
      assetId,
      role: params.role,
      company: params.company,
    }),
  });
}
