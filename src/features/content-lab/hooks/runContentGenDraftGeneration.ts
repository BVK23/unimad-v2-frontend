import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import { CONTENT_GEN_EVENTS } from "@/features/content-lab/api/content-gen-events";
import { shouldUseAdkContentGenDraft } from "@/features/content-lab/api/contentGenDraftConfig";
import { getFirstContentGenDraftFromHistory } from "@/features/content-lab/api/getFirstContentGenDraftFromHistory";
import {
  fetchContentGenAssets,
  fetchUnibotChatHistory,
  generateContentGenAsset,
  updateContentGenAsset,
} from "@/features/content-lab/server-actions/content-lab-actions";

export type ContentGenPendingMedia = {
  file: File;
  objectUrl: string;
};

export type RunContentGenDraftParams = {
  topic: string;
  funnel: ContentGenFunnel | null;
  mood?: string | null;
  pendingMedia: ContentGenPendingMedia[];
  existingImages: string[];
  uploadContentGenMedia: (file: File, category: "linkedin-post") => Promise<{ url: string }>;
};

export type RunContentGenDraftResult = {
  id: string;
  draft: string;
  mergedImageUrls: string[];
};

export const ADK_DRAFT_PENDING_ERROR = "ADK_DRAFT_PENDING";

const runDjangoContentGenDraftWithMedia = async (params: RunContentGenDraftParams): Promise<RunContentGenDraftResult> => {
  const trimmedTopic = params.topic.trim();
  if (!trimmedTopic) {
    throw new Error("Add a topic or use the wand to suggest one.");
  }

  const { id, existing } = await generateContentGenAsset(trimmedTopic, {
    funnel: params.funnel ?? undefined,
  });

  const assetsFresh = await fetchContentGenAssets();
  const existingAsset = assetsFresh.find(a => String(a.id) === String(id));
  const baseImageUrls = Array.isArray(existingAsset?.images) ? [...existingAsset.images] : [];

  const sectionName = `contentgen${id}`;
  const loadDraftOnce = async () => {
    const chatHistory = await fetchUnibotChatHistory(sectionName);
    return getFirstContentGenDraftFromHistory(chatHistory);
  };

  let draft = await loadDraftOnce();
  if (!draft.trim() && !existing) {
    await new Promise(r => setTimeout(r, 500));
    draft = await loadDraftOnce();
  }
  if (!draft.trim()) {
    throw new Error("Could not read the generated draft. Please try again.");
  }

  let mergedImageUrls = baseImageUrls;
  if (params.pendingMedia.length > 0) {
    const uploaded = await Promise.all(params.pendingMedia.map(entry => params.uploadContentGenMedia(entry.file, "linkedin-post")));
    mergedImageUrls = Array.from(new Set([...baseImageUrls, ...uploaded.map(u => u.url)]));
    params.pendingMedia.forEach(p => URL.revokeObjectURL(p.objectUrl));
  }

  await updateContentGenAsset({ id, content: draft, images: mergedImageUrls });

  window.dispatchEvent(
    new CustomEvent(CONTENT_GEN_EVENTS.draftReady, {
      detail: { assetId: id, draft },
    })
  );

  return { id, draft, mergedImageUrls };
};

/** ADK-first: opens LinkedIn Draft thread; Studio stays loading until draftReady or draftFailed. */
export const runContentGenDraftGeneration = async (params: RunContentGenDraftParams): Promise<RunContentGenDraftResult> => {
  if (shouldUseAdkContentGenDraft()) {
    window.dispatchEvent(
      new CustomEvent(CONTENT_GEN_EVENTS.openDraft, {
        detail: { topic: params.topic, funnel: params.funnel, mood: params.mood },
      })
    );
    throw new Error(ADK_DRAFT_PENDING_ERROR);
  }

  return runDjangoContentGenDraftWithMedia(params);
};
