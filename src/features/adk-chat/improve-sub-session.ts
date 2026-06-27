"use client";

import { createSessionAction } from "./actions";
import { resolveAdkSessionOptionsForFeatureSection } from "./resolve-sub-session-adk-app";
import { upsertRegistryRow } from "./session-registry";
import { deriveSubSessionDisplayTitle } from "./sub-session-titles";
import { registerUnibotAdkSessionAction } from "./unibot-adk-session-actions";

export interface ResolveImproveSubSessionParams {
  userId: string;
  mainAdkSessionId: string;
  feature: string;
  featureId: string;
  section: string;
  entryId?: string;
  contentKey?: string;
  title?: string;
}

export interface ResolveImproveSubSessionResult {
  success: boolean;
  adkSessionId?: string;
  title?: string;
  reused?: boolean;
  error?: string;
}

/**
 * Find an existing improve sub-session for this entry/section, or create a new ADK
 * session and register it under the main chat.
 */
export async function resolveImproveSubSession(params: ResolveImproveSubSessionParams): Promise<ResolveImproveSubSessionResult> {
  const entryId = params.entryId?.trim() ?? "";

  const lookup = await registerUnibotAdkSessionAction({
    kind: "sub",
    parent_adk_session_id: params.mainAdkSessionId,
    feature: params.feature,
    feature_id: params.featureId,
    section: params.section,
    entry_id: entryId,
    content_key: params.contentKey ?? null,
    title: params.title ?? "",
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
    title: params.title ?? lookup.suggested_title ?? "",
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
