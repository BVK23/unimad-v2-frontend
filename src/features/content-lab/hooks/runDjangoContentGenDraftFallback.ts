import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import { CONTENT_GEN_EVENTS } from "@/features/content-lab/api/content-gen-events";
import { getFirstContentGenDraftFromHistory } from "@/features/content-lab/api/getFirstContentGenDraftFromHistory";
import {
  fetchContentGenAssets,
  fetchUnibotChatHistory,
  generateContentGenAsset,
  updateContentGenAsset,
} from "@/features/content-lab/server-actions/content-lab-actions";

export type DjangoContentGenDraftFallbackResult = {
  id: string;
  draft: string;
};

/**
 * Django Unibot draft generation when ADK draft stream fails or sync cannot extract a draft.
 */
export const runDjangoContentGenDraftFallback = async (
  topic: string,
  funnel: ContentGenFunnel | null
): Promise<DjangoContentGenDraftFallbackResult> => {
  const trimmedTopic = topic.trim();
  if (!trimmedTopic) {
    throw new Error("Add a topic before generating a draft.");
  }

  const { id, existing } = await generateContentGenAsset(trimmedTopic, {
    funnel: funnel ?? undefined,
  });

  const loadDraftOnce = async () => {
    const sectionName = `contentgen${id}`;
    const chatHistory = await fetchUnibotChatHistory(sectionName);
    return getFirstContentGenDraftFromHistory(chatHistory);
  };

  let draft = await loadDraftOnce();
  if (!draft.trim() && !existing) {
    await new Promise(r => setTimeout(r, 500));
    draft = await loadDraftOnce();
  }

  if (!draft.trim()) {
    const assets = await fetchContentGenAssets();
    const row = assets.find(a => String(a.id) === String(id));
    draft = row?.content?.trim() ?? "";
  }

  if (!draft.trim()) {
    throw new Error("Could not read the generated draft. Please try again.");
  }

  await updateContentGenAsset({ id, content: draft });

  window.dispatchEvent(
    new CustomEvent(CONTENT_GEN_EVENTS.draftReady, {
      detail: { assetId: id, draft },
    })
  );

  return { id, draft };
};
