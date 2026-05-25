"use client";

import { createSessionAction } from "./actions";
import { upsertRegistryRow } from "./session-registry";
import { registerUnibotAdkSessionAction } from "./unibot-adk-session-actions";

export interface ResolveImproveSubSessionParams {
  userId: string;
  mainAdkSessionId: string;
  feature: string;
  featureId: string;
  section: string;
  entryId?: string;
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
    title: lookup.suggested_title ?? "",
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
