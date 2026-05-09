import type { ResumeData, SectionOrderItem } from "../../../../types";
import { isCustomSection, SECTIONS } from "../../config/constants";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";

/**
 * Default two-column split for Nextgen when `sectionOrder` has no explicit `column`
 * (or for rows that only come from the editor without API `left` flags).
 *
 * Right (35%): summary, education, skills — plus certifications as supporting material.
 * Left (65%): experience, projects, and all custom section ids.
 */
const NEXTGEN_DEFAULT_MAIN_COLUMN: Record<string, "left" | "right"> = {
  [SECTIONS.PROFILE]: "right",
  [SECTIONS.EDUCATION]: "right",
  [SECTIONS.SKILLS]: "right",
  [SECTIONS.EXPERIENCE]: "left",
  [SECTIONS.PROJECTS]: "left",
  [SECTIONS.CERTIFICATIONS]: "right",
};

const effectiveNextgenColumn = (sectionId: string, explicit?: SectionOrderItem["column"]): "left" | "right" => {
  if (explicit === "left" || explicit === "right") {
    return explicit;
  }
  if (isCustomSection(sectionId)) {
    return "left";
  }
  return NEXTGEN_DEFAULT_MAIN_COLUMN[sectionId] ?? "left";
};

export const buildNextgenColumns = (data: ResumeData) => {
  const visibleOrdered = deduplicateSectionOrder(data.sectionOrder).filter(s => !s.hidden);
  const visibleSet = new Set(visibleOrdered.map(s => s.id));

  const leftFromOrder = visibleOrdered.filter(s => effectiveNextgenColumn(s.id, s.column) === "left").map(s => s.id);
  const rightFromOrder = visibleOrdered.filter(s => effectiveNextgenColumn(s.id, s.column) === "right").map(s => s.id);

  const orphanLeft = data.customSections.filter(cs => !visibleSet.has(cs.id) && cs.column !== "right").map(cs => cs.id);
  const orphanRight = data.customSections.filter(cs => !visibleSet.has(cs.id) && cs.column === "right").map(cs => cs.id);

  return {
    leftColumnIds: [...leftFromOrder, ...orphanLeft],
    rightColumnIds: [...rightFromOrder, ...orphanRight],
  };
};
