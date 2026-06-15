"use client";

import type { ApplicationAssetApiType } from "@/features/application-assets/types";
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

function normalizeScopeId(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function applicationAssetFeatureId(role: string, company: string): string {
  return normalizeScopeId(`${company}|${role}`);
}

export function contentGenFeatureId(topic: string | undefined, mode: "topic" | "draft"): string {
  const slug = topic?.trim() ? normalizeScopeId(topic).slice(0, 120) : "active";
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
}): Promise<ResolveFeatureSubSessionResult> {
  const entryId = params.entryId?.trim() ?? "";

  const lookup = await registerUnibotAdkSessionAction({
    kind: "sub",
    parent_adk_session_id: params.mainAdkSessionId,
    feature: params.feature,
    feature_id: params.featureId,
    section: params.section,
    entry_id: entryId,
  });

  if (!lookup.success) {
    return { success: false, error: lookup.error ?? "Sub-session lookup failed" };
  }

  if (lookup.reused && lookup.session) {
    upsertRegistryRow(lookup.session);
    return {
      success: true,
      adkSessionId: lookup.session.adk_session_id,
      title: lookup.session.title,
      reused: true,
    };
  }

  if (lookup.session?.adk_session_id) {
    upsertRegistryRow(lookup.session);
    return {
      success: true,
      adkSessionId: lookup.session.adk_session_id,
      title: lookup.session.title,
      reused: false,
    };
  }

  if (!lookup.needs_adk_session) {
    return { success: false, error: lookup.error ?? "Unexpected register response" };
  }

  const created = await createSessionAction(params.userId);
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
  });

  if (!reg.success || !reg.session) {
    return { success: false, error: reg.error ?? "Sub-session register failed" };
  }

  upsertRegistryRow(reg.session);
  return {
    success: true,
    adkSessionId: reg.session.adk_session_id,
    title: reg.session.title,
    reused: false,
  };
}

export async function resolveContentGenSubSession(params: {
  userId: string;
  mainAdkSessionId: string;
  mode: "topic" | "draft";
  topic?: string;
  title: string;
}): Promise<ResolveFeatureSubSessionResult> {
  return resolveFeatureSubSession({
    userId: params.userId,
    mainAdkSessionId: params.mainAdkSessionId,
    feature: "content_gen",
    section: params.mode,
    featureId: contentGenFeatureId(params.topic, params.mode),
    title: params.title,
  });
}

export async function resolveApplicationAssetSubSession(params: {
  userId: string;
  mainAdkSessionId: string;
  assetType: ApplicationAssetApiType;
  role: string;
  company: string;
  assetId?: string | null;
  title: string;
}): Promise<ResolveFeatureSubSessionResult> {
  return resolveFeatureSubSession({
    userId: params.userId,
    mainAdkSessionId: params.mainAdkSessionId,
    feature: "application_asset",
    section: params.assetType,
    featureId: applicationAssetFeatureId(params.role, params.company),
    entryId: params.assetId?.trim() || "",
    title: params.title,
  });
}
