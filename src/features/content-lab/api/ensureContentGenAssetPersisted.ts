import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import { createContentGenShell, updateContentGenAsset } from "@/features/content-lab/server-actions/content-lab-actions";

export async function ensureContentGenAssetPersisted(params: {
  assetId: string | null;
  topic: string;
  draft: string;
  funnel: ContentGenFunnel | null;
  images?: string[];
}): Promise<string> {
  const topic = params.topic.trim();
  const draft = params.draft.trim();
  if (!topic || !draft) {
    throw new Error("Add a topic and draft before saving.");
  }

  if (params.assetId) {
    const saveResult = await updateContentGenAsset({
      id: params.assetId,
      content: draft,
      status: "Draft",
      images: params.images,
    });
    if (!saveResult.success) {
      throw new Error(saveResult.error);
    }
    return params.assetId;
  }

  const { id } = await createContentGenShell(topic, { funnel: params.funnel ?? undefined });
  const saveResult = await updateContentGenAsset({
    id,
    content: draft,
    status: "Draft",
    images: params.images,
  });
  if (!saveResult.success) {
    throw new Error(saveResult.error);
  }
  return id;
}
