/**
 * ADK is the default draft writer. Set NEXT_PUBLIC_CONTENT_GEN_FORCE_DJANGO=1 to use Django Unibot only.
 */
export const shouldForceDjangoContentGenDraft = (): boolean => {
  if (typeof process === "undefined") {
    return false;
  }
  return process.env.NEXT_PUBLIC_CONTENT_GEN_FORCE_DJANGO === "1";
};

export const shouldUseAdkContentGenDraft = (): boolean => !shouldForceDjangoContentGenDraft();

export const CONTENT_GEN_MIN_DRAFT_CHARS = 80;
