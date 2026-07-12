/**
 * Detects freeform prompts that should run on the main resume agent (Prepare Application
 * improve footer), not inside a section sub-thread (e.g. IMPROVE SUMMARY).
 */
export const isResumeWholeDocumentJdImprovePrompt = (text: string): boolean => {
  const t = text.trim().toLowerCase();
  if (!t) return false;

  const jdSignals =
    /\b(jd|job description|ats[- ]?friendly|ats score|keyword|keywords|tailor|optimi[sz]e|match the jd|match the role|role requirements)\b/.test(
      t
    );
  if (!jdSignals) return false;

  const sectionHits = ["experience", "bullet", "skills", "summary", "projects", "education"].filter(s => t.includes(s));
  const multiSection = sectionHits.length >= 2;
  const wholeResume =
    /\b(entire|whole|full resume|every bullet|all sections|all relevant|rewrite every|across my)\b/.test(t) ||
    (t.includes("resume") && (t.includes("section") || t.includes("bullet")));

  return multiSection || wholeResume || t.includes("without keyword stuffing");
};
