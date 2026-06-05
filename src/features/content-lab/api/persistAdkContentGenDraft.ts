import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import { syncContentGenDraftToStudio } from "@/features/content-lab/api/syncContentGenDraftToStudio";

export const persistAdkContentGenDraft = async (
  topic: string,
  funnel: ContentGenFunnel | null,
  botMessage: string
): Promise<{ assetId: string; draft: string } | null> => {
  return syncContentGenDraftToStudio({
    topic,
    funnel,
    botMessage,
    existingAssetId: null,
  });
};
