import { ATS_COMPLETE_THRESHOLD } from "./atsConstants";

type WeakSectionHint = {
  name: string;
};

/** Short contextual copy shown under the ATS progress bar. */
export function getAtsScoreQuote(score: number, weakSections?: WeakSectionHint[]): string {
  const weakNames = (weakSections ?? []).map(s => s.name.toLowerCase());
  const focus = (): string => {
    if (weakNames.includes("experience")) return "experience bullets";
    if (weakNames.includes("skills")) return "skills";
    if (weakNames.includes("summary")) return "summary";
    if (weakNames.includes("education")) return "education";
    if (weakNames.length > 0) return weakSections![0].name.toLowerCase();
    return "wording and keywords";
  };

  if (score >= 80) {
    return "Strong resume. Fine-tune wording and keywords to stand out in competitive applicant pools.";
  }
  if (score >= ATS_COMPLETE_THRESHOLD) {
    return `You are close. Sharpen your ${focus()} to clear more ATS filters.`;
  }
  if (score >= 40) {
    const targets = ["experience", "skills", "education"].filter(name => weakNames.includes(name));
    if (targets.length > 0) {
      return `Recruiters may pass on this draft. Add depth to ${targets.join(", ")} first.`;
    }
    return "Recruiters may pass on this draft. Strengthen the weakest sections first.";
  }
  return "Foundational gaps remain. Build out core sections before optimizing for specific roles.";
}
