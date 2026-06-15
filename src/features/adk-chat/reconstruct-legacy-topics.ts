"use client";

import {
  buildContentGenDraftBootstrap,
  buildContentGenTopicBootstrap,
  CONTENT_GEN_TOPIC_USER_DISPLAY,
} from "@/components/chat/content-gen-topic";
import { applicationAssetTopicTitle } from "@/features/application-assets/api/applicationAssetDraftBootstrap";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import type { ChatMessage } from "@/types";
import { applicationAssetFeatureId, contentGenFeatureId } from "./resolve-feature-sub-session";
import type { UnibotAdkSessionRow } from "./session-registry";

const APP_ASSET_BOOTSTRAP_PREFIX = /^Write the full (cover letter|cold email|referral)/i;
const CONTENT_GEN_DRAFT_BOOTSTRAP_PREFIX = /^Write the full LinkedIn post draft/i;
const CONTENT_GEN_TOPIC_BOOTSTRAP_PREFIX = /^Help me choose a LinkedIn post topic/i;
const REFINE_PREFIX = /^I want to refine a specific part of my /i;

export type LegacyTopicReconstruction = {
  topics: ChatMessage[];
  excludedMessageIds: Set<string>;
};

function registryHasContentGenSub(registry: UnibotAdkSessionRow[], mode: "topic" | "draft", topic?: string): boolean {
  const featureId = contentGenFeatureId(topic, mode);
  return registry.some(r => r.kind === "sub" && r.feature === "content_gen" && r.section === mode && (r.feature_id ?? "") === featureId);
}

function registryHasApplicationAssetSub(registry: UnibotAdkSessionRow[], assetType: string, role: string, company: string): boolean {
  const featureId = applicationAssetFeatureId(role, company);
  return registry.some(
    r => r.kind === "sub" && r.feature === "application_asset" && r.section === assetType && (r.feature_id ?? "") === featureId
  );
}

function inferAppAssetTypeFromBootstrap(text: string): ApplicationAssetApiType | null {
  const lower = text.toLowerCase();
  if (lower.includes("cover letter")) return "coverletter";
  if (lower.includes("cold email")) return "coldemail";
  if (lower.includes("referral")) return "referral";
  return null;
}

function parseAppAssetBootstrap(text: string): { assetType: ApplicationAssetApiType; role: string; company: string } | null {
  if (!APP_ASSET_BOOTSTRAP_PREFIX.test(text)) return null;
  const assetType = inferAppAssetTypeFromBootstrap(text);
  if (!assetType) return null;
  const roleMatch = text.match(/Role:\s*([^.]+)/i);
  const companyMatch = text.match(/Company:\s*([^.]+)/i);
  const role = roleMatch?.[1]?.trim() ?? "";
  const company = companyMatch?.[1]?.trim() ?? "";
  return { assetType, role, company };
}

function isContentGenTopicBootstrap(text: string): boolean {
  return CONTENT_GEN_TOPIC_BOOTSTRAP_PREFIX.test(text) || text.trim() === CONTENT_GEN_TOPIC_USER_DISPLAY;
}

function isContentGenDraftBootstrap(text: string): boolean {
  return CONTENT_GEN_DRAFT_BOOTSTRAP_PREFIX.test(text);
}

function isSegmentStart(msg: ChatMessage): "application_asset" | "content_gen_topic" | "content_gen_draft" | null {
  if (msg.role !== "user" || !msg.text?.trim()) return null;
  const text = msg.text.trim();
  if (APP_ASSET_BOOTSTRAP_PREFIX.test(text) || REFINE_PREFIX.test(text)) {
    return "application_asset";
  }
  if (isContentGenDraftBootstrap(text)) return "content_gen_draft";
  if (isContentGenTopicBootstrap(text)) return "content_gen_topic";
  return null;
}

function topicTitleForSegment(kind: ReturnType<typeof isSegmentStart>, firstUserText: string): string {
  if (kind === "application_asset") {
    const parsed = parseAppAssetBootstrap(firstUserText);
    if (parsed) {
      return applicationAssetTopicTitle(parsed.assetType, parsed.company, parsed.role);
    }
    return "Application draft";
  }
  if (kind === "content_gen_draft") {
    const match = firstUserText.match(/topic:\s*"([^"]+)"/i);
    return match?.[1]?.trim() ? `LinkedIn Draft · ${match[1].trim()}` : "LinkedIn Draft";
  }
  return "LinkedIn Topic";
}

/**
 * Rebuild topic cards from flat main-session messages for legacy sessions
 * (before content_gen / application_asset used registered sub-sessions).
 */
export function reconstructLegacyTopicsFromMain(
  mainMessages: ChatMessage[],
  registry: UnibotAdkSessionRow[] = []
): LegacyTopicReconstruction {
  const topics: ChatMessage[] = [];
  const excludedMessageIds = new Set<string>();

  let i = 0;
  while (i < mainMessages.length) {
    const msg = mainMessages[i];
    if (!msg || msg.isTopic) {
      i++;
      continue;
    }

    const segmentKind = isSegmentStart(msg);
    if (!segmentKind) {
      i++;
      continue;
    }

    const firstUserText = msg.text?.trim() ?? "";
    if (segmentKind === "application_asset") {
      const parsed = parseAppAssetBootstrap(firstUserText);
      if (parsed && registryHasApplicationAssetSub(registry, parsed.assetType, parsed.role, parsed.company)) {
        i++;
        continue;
      }
    } else if (segmentKind === "content_gen_draft") {
      const topicMatch = firstUserText.match(/topic:\s*"([^"]+)"/i);
      if (registryHasContentGenSub(registry, "draft", topicMatch?.[1])) {
        i++;
        continue;
      }
    } else if (registryHasContentGenSub(registry, "topic")) {
      i++;
      continue;
    }

    const nested: ChatMessage[] = [];
    const startIdx = i;
    nested.push(msg);
    excludedMessageIds.add(msg.id);
    i++;

    while (i < mainMessages.length) {
      const next = mainMessages[i];
      if (!next || next.isTopic) break;
      if (isSegmentStart(next)) break;
      nested.push(next);
      excludedMessageIds.add(next.id);
      i++;
    }

    if (nested.length === 0) continue;

    const topicKind = segmentKind === "application_asset" ? "application_asset" : "content_gen";
    const legacyId = `topic-legacy-${segmentKind}-${startIdx}`;
    topics.push({
      id: legacyId,
      role: "model",
      text: "",
      timestamp: nested[0]?.timestamp ?? new Date(),
      isTopic: true,
      topicKind,
      topicTitle: topicTitleForSegment(segmentKind, firstUserText),
      isExpanded: false,
      legacyTopic: true,
      messages: nested,
    });
  }

  return { topics, excludedMessageIds };
}

/** Merge legacy reconstructed topics with registry-backed sub topics. */
export function mergeLegacyAndSubTopics(subTopics: ChatMessage[], legacyTopics: ChatMessage[]): ChatMessage[] {
  const subSessionIds = new Set(subTopics.map(t => t.subSessionAdkId).filter(Boolean));
  const filteredLegacy = legacyTopics.filter(t => !t.subSessionAdkId || !subSessionIds.has(t.subSessionAdkId));
  return [...subTopics, ...filteredLegacy];
}

export function filterMessagesExcludingIds(messages: ChatMessage[], excluded: Set<string>): ChatMessage[] {
  return messages.filter(m => !excluded.has(m.id));
}
