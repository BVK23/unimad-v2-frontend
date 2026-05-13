import type { ResumeData } from "@/types";

export type PdfHighlightKind = "added" | "modified";

/** Keys match BasicPDF / future templates: section id or `experience:<id>` etc. */
export type PdfHighlightMap = Partial<Record<string, PdfHighlightKind>>;

/** Stable fallback for Zustand/React selectors — never use inline `{}` as default highlights. */
export const EMPTY_PDF_HIGHLIGHT_MAP: PdfHighlightMap = {};

function normSummary(html: string | undefined): string {
  return (html ?? "").replace(/\s+/g, " ").trim();
}

function shallowExperienceSig(e: ResumeData["experience"][number]): string {
  return JSON.stringify({
    company: e.company,
    role: e.role,
    startDate: e.startDate,
    endDate: e.endDate,
    current: e.current,
    location: e.location,
    description: e.description,
    hidden: e.hidden,
  });
}

function shallowEducationSig(e: ResumeData["education"][number]): string {
  return JSON.stringify({
    school: e.school,
    degree: e.degree,
    startDate: e.startDate,
    endDate: e.endDate,
    current: e.current,
    location: e.location,
    description: e.description,
    hidden: e.hidden,
  });
}

function shallowProjectSig(p: ResumeData["projects"][number]): string {
  return JSON.stringify({
    title: p.title,
    url: p.url,
    description: p.description,
    hidden: p.hidden,
  });
}

function shallowCertSig(c: ResumeData["certifications"][number]): string {
  return JSON.stringify({
    title: c.title,
    issuer: c.issuer,
    description: c.description,
    hidden: c.hidden,
  });
}

function skillsSig(skills: ResumeData["skills"]): string {
  return JSON.stringify(
    skills.map(s => ({ id: s.id, name: s.name, categoryId: s.categoryId, hidden: (s as { hidden?: boolean }).hidden }))
  );
}

export function deriveBannerTitle(highlights: PdfHighlightMap): string {
  const keys = Object.keys(highlights);
  if (keys.length === 0) return "Resume updated";

  const hasProfile = keys.some(k => k === "profile");
  if (hasProfile) {
    if (highlights.profile === "added") return "Added Summary";
    if (highlights.profile === "modified") return "Edited Summary";
  }

  const hasExp = keys.some(k => k.startsWith("experience:"));
  const hasEdu = keys.some(k => k.startsWith("education:"));
  const hasProj = keys.some(k => k.startsWith("projects:"));
  const hasSkills = keys.includes("skills");

  if (hasExp && keys.length === keys.filter(k => k.startsWith("experience:")).length) {
    const kinds = keys.map(k => highlights[k]);
    if (kinds.every(k => k === "added")) return "Experience added";
    if (kinds.every(k => k === "modified")) return "Experience edited";
    return "Experience updated";
  }
  if (hasEdu) return keys.some(k => highlights[k] === "added") ? "Education added" : "Education edited";
  if (hasProj) return keys.some(k => highlights[k] === "added") ? "Project added" : "Project edited";
  if (hasSkills) return keys.some(k => highlights[k] === "added") ? "Skills added" : "Skills edited";

  return "Resume updated";
}

/**
 * Compare two resume snapshots (same id) and produce PDF highlight keys + a chat banner label.
 */
export function computeAdkReviewFromDiff(
  prev: ResumeData | undefined,
  next: ResumeData | undefined
): {
  highlights: PdfHighlightMap;
  bannerTitle: string;
} {
  if (!prev || !next || prev.id !== next.id) {
    return { highlights: {}, bannerTitle: "Resume updated" };
  }

  const highlights: PdfHighlightMap = {};

  const prevSum = normSummary(prev.profile?.summary);
  const nextSum = normSummary(next.profile?.summary);
  if (prevSum !== nextSum) {
    highlights.profile = prevSum.length === 0 && nextSum.length > 0 ? "added" : "modified";
  }

  const prevExpIds = new Set(prev.experience.map(e => e.id));
  const nextExpIds = new Set(next.experience.map(e => e.id));
  for (const e of next.experience) {
    if (e.hidden) continue;
    const key = `experience:${e.id}`;
    if (!prevExpIds.has(e.id)) {
      highlights[key] = "added";
    } else {
      const oldE = prev.experience.find(x => x.id === e.id);
      if (oldE && oldE.hidden === e.hidden && shallowExperienceSig(oldE) !== shallowExperienceSig(e)) {
        highlights[key] = "modified";
      }
    }
  }

  for (const e of next.education) {
    if (e.hidden) continue;
    const key = `education:${e.id}`;
    if (!prev.education.some(x => x.id === e.id)) {
      highlights[key] = "added";
    } else {
      const oldE = prev.education.find(x => x.id === e.id);
      if (oldE && shallowEducationSig(oldE) !== shallowEducationSig(e)) {
        highlights[key] = "modified";
      }
    }
  }

  for (const p of next.projects) {
    if (p.hidden) continue;
    const key = `projects:${p.id}`;
    if (!prev.projects.some(x => x.id === p.id)) {
      highlights[key] = "added";
    } else {
      const oldP = prev.projects.find(x => x.id === p.id);
      if (oldP && shallowProjectSig(oldP) !== shallowProjectSig(p)) {
        highlights[key] = "modified";
      }
    }
  }

  for (const c of next.certifications) {
    if (c.hidden) continue;
    const key = `certifications:${c.id}`;
    if (!prev.certifications.some(x => x.id === c.id)) {
      highlights[key] = "added";
    } else {
      const oldC = prev.certifications.find(x => x.id === c.id);
      if (oldC && shallowCertSig(oldC) !== shallowCertSig(c)) {
        highlights[key] = "modified";
      }
    }
  }

  if (skillsSig(prev.skills) !== skillsSig(next.skills)) {
    const prevN = prev.skills.filter(s => !(s as { hidden?: boolean }).hidden).length;
    const nextN = next.skills.filter(s => !(s as { hidden?: boolean }).hidden).length;
    highlights.skills = nextN > prevN ? "added" : "modified";
  }

  const prevCustom = JSON.stringify(prev.customSections);
  const nextCustom = JSON.stringify(next.customSections);
  if (prevCustom !== nextCustom) {
    highlights.customSections = "modified";
  }

  return {
    highlights,
    bannerTitle: deriveBannerTitle(highlights),
  };
}
