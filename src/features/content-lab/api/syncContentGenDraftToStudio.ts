import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import { CONTENT_GEN_EVENTS } from "@/features/content-lab/api/content-gen-events";
import { CONTENT_GEN_MIN_DRAFT_CHARS } from "@/features/content-lab/api/contentGenDraftConfig";
import { extractContentGenDraftFromBotMessage } from "@/features/content-lab/api/extractContentGenDraft";
import { createContentGenShell, updateContentGenAsset } from "@/features/content-lab/server-actions/content-lab-actions";

export type SyncContentGenDraftParams = {
  topic: string;
  funnel: ContentGenFunnel | null;
  botMessage: string;
  /** When set, persists this text instead of parsing `botMessage`. */
  draftText?: string;
  existingAssetId?: string | null;
};

export type SyncContentGenDraftResult = {
  assetId: string;
  draft: string;
};

/**
 * Push an agent-authored draft into the contentgen asset and notify Studio preview.
 */
export const syncContentGenDraftToStudio = async (params: SyncContentGenDraftParams): Promise<SyncContentGenDraftResult | null> => {
  const topic = params.topic.trim();
  const draft = params.draftText?.trim() || extractContentGenDraftFromBotMessage(params.botMessage);

  if (!topic || draft.length < CONTENT_GEN_MIN_DRAFT_CHARS) {
    return null;
  }

  let assetId = params.existingAssetId?.trim() || null;

  if (assetId) {
    const saveResult = await updateContentGenAsset({ id: assetId, content: draft });
    if (!saveResult.success) {
      throw new Error(saveResult.error);
    }
  } else {
    const { id } = await createContentGenShell(topic, {
      funnel: params.funnel ?? undefined,
    });
    assetId = id;
    const saveResult = await updateContentGenAsset({ id: assetId, content: draft });
    if (!saveResult.success) {
      throw new Error(saveResult.error);
    }
  }

  window.dispatchEvent(
    new CustomEvent(CONTENT_GEN_EVENTS.draftReady, {
      detail: { assetId, draft },
    })
  );

  return { assetId, draft };
};
