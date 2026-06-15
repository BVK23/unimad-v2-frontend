import {
  extractActionLabelFromRefineMessage,
  IMPROVE_WITH_UNIBOT_ACTION_LABEL,
} from "@/features/application-assets/api/asset-action-message";
import { APPLICATION_ASSET_SELECTION_PRESETS } from "@/features/application-assets/config/selection-presets";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import type { AssetActionMeta } from "@/types";

const REFINE_PREFIX = /^I want to refine a specific part of my /i;

function docLabelToAssetType(label: string): ApplicationAssetApiType | null {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes("cover letter")) return "coverletter";
  if (normalized.includes("cold email")) return "coldemail";
  if (normalized.includes("referral")) return "referral";
  return null;
}

function extractInstruction(text: string): string {
  const importantIdx = text.indexOf("IMPORTANT:");
  const body = importantIdx > 0 ? text.slice(0, importantIdx) : text;
  const parts = body.split(/\n>\s*"[^"]+"\s*\n/);
  return parts[1]?.trim() ?? "";
}

function matchPreset(assetType: ApplicationAssetApiType, instruction: string) {
  const presets = APPLICATION_ASSET_SELECTION_PRESETS[assetType];
  const normalized = instruction.trim();
  return presets.find(p => p.instruction.trim() === normalized) ?? null;
}

/** Rebuild selection refine UI metadata from persisted user message text. */
export function inferAssetActionMetaFromUserText(text: string): AssetActionMeta | undefined {
  const { label: persistedLabel, textWithoutMarker } = extractActionLabelFromRefineMessage(text.trim());
  const trimmed = textWithoutMarker.trim();
  if (!REFINE_PREFIX.test(trimmed)) return undefined;

  const docMatch = trimmed.match(/^I want to refine a specific part of my ([^.]+)\./im);
  const assetType = docMatch?.[1] ? docLabelToAssetType(docMatch[1]) : null;
  if (!assetType) return undefined;

  const quoteMatch = trimmed.match(/Here is the section I selected:\s*\n>\s*"([^"]+)"/i);
  const selectedText = quoteMatch?.[1]?.trim() ?? "";
  if (!selectedText) return undefined;

  const instruction = extractInstruction(trimmed);
  const preset = instruction ? matchPreset(assetType, instruction) : null;

  if (persistedLabel) {
    const isFreeformImprove = persistedLabel.toLowerCase() === IMPROVE_WITH_UNIBOT_ACTION_LABEL.toLowerCase();
    return {
      kind: isFreeformImprove ? "freeform" : "preset",
      assetType,
      presetLabel: persistedLabel,
      selectedText,
      prompt: trimmed,
    };
  }

  if (preset) {
    return {
      kind: "preset",
      assetType,
      presetLabel: preset.label,
      selectedText,
      prompt: trimmed,
    };
  }

  return {
    kind: "freeform",
    assetType,
    selectedText,
    prompt: trimmed,
  };
}
