"use client";

import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { UNTITLED_THREAD_TITLE } from "./constants";
import { topicIdForSubSession } from "./improve-topic-helpers";
import { resolveApplicationAssetSubSession, resolveContentGenSubSession } from "./resolve-feature-sub-session";
import { getRegistryRow, upsertRegistryRow } from "./session-registry";
import { registerUnibotAdkSessionAction } from "./unibot-adk-session-actions";

export async function ensureMainSessionRegistered(mainAdkSessionId: string): Promise<void> {
  if (!mainAdkSessionId || getRegistryRow(mainAdkSessionId)) {
    return;
  }
  const reg = await registerUnibotAdkSessionAction({
    adk_session_id: mainAdkSessionId,
    kind: "main",
    title: UNTITLED_THREAD_TITLE,
    content_key: `general:${mainAdkSessionId}`,
  });
  if (reg.success && reg.session) {
    upsertRegistryRow(reg.session);
  }
}

export type ResolvedTopicSubSession = {
  subAdkSessionId: string;
  stableTopicId: string;
  title: string;
};

export async function ensureContentGenTopicSubSession(params: {
  userId: string;
  mainAdkSessionId: string;
  mode: "topic" | "draft";
  topic?: string;
  assetId?: string | null;
  title: string;
}): Promise<ResolvedTopicSubSession | null> {
  await ensureMainSessionRegistered(params.mainAdkSessionId);
  const resolved = await resolveContentGenSubSession({
    userId: params.userId,
    mainAdkSessionId: params.mainAdkSessionId,
    mode: params.mode,
    topic: params.topic,
    assetId: params.assetId,
    title: params.title,
  });
  if (!resolved.success || !resolved.adkSessionId) {
    return null;
  }
  return {
    subAdkSessionId: resolved.adkSessionId,
    stableTopicId: topicIdForSubSession(resolved.adkSessionId),
    title: resolved.title ?? params.title,
  };
}

export async function ensureApplicationAssetTopicSubSession(params: {
  userId: string;
  mainAdkSessionId: string;
  assetType: ApplicationAssetApiType;
  role: string;
  company: string;
  assetId?: string | null;
  title: string;
}): Promise<ResolvedTopicSubSession | null> {
  await ensureMainSessionRegistered(params.mainAdkSessionId);
  const resolved = await resolveApplicationAssetSubSession({
    userId: params.userId,
    mainAdkSessionId: params.mainAdkSessionId,
    assetType: params.assetType,
    role: params.role,
    company: params.company,
    assetId: params.assetId,
    title: params.title,
  });
  if (!resolved.success || !resolved.adkSessionId) {
    return null;
  }
  return {
    subAdkSessionId: resolved.adkSessionId,
    stableTopicId: topicIdForSubSession(resolved.adkSessionId),
    title: resolved.title ?? params.title,
  };
}
