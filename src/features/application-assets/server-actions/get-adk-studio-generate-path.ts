"use server";

import { shouldUseAgentEngine } from "@/features/adk-chat/config";
import { USE_ADK_STUDIO_ONE_SHOT } from "@/features/application-assets/config";

export type AdkStudioGeneratePath = "one_shot" | "sse";

/** Resolve Studio generate path: one-shot REST vs agent SSE fallback. */
export const getAdkStudioGeneratePathAction = async (): Promise<AdkStudioGeneratePath> => {
  if (USE_ADK_STUDIO_ONE_SHOT && !shouldUseAgentEngine()) {
    return "one_shot";
  }
  return "sse";
};
