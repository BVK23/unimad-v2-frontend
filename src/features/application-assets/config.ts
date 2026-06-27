/** When false, Studio uses ADK agent SSE path instead of one-shot generate endpoint. */
export const USE_ADK_STUDIO_ONE_SHOT = process.env.NEXT_PUBLIC_USE_ADK_STUDIO_ONE_SHOT !== "0";

/** When false, Studio may fall back to legacy Django generate (if still enabled server-side). */
export const USE_ADK_APPLICATION_ASSETS = process.env.NEXT_PUBLIC_USE_ADK_APPLICATION_ASSETS !== "0";
