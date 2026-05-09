import type { ResumeData, SectionOrderItem } from "../../../../types";
import { isCustomSection, SECTIONS } from "../../config/constants";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";

/**
 * When `sectionOrder` has no `column` (typical for new editor / API without `left` flags),
 * use the same default 65/35 split as Nextgen so the wide column is not empty:
 * left: experience, projects, custom sections; right: profile, education, skills, certifications.
 *
 * Explicit `column: "left" | "right"` from the API always wins.
 */
const SLATEPRO_DEFAULT_COLUMN: Record<string, "left" | "right"> = {
  [SECTIONS.PROFILE]: "right",
  [SECTIONS.EDUCATION]: "right",
  [SECTIONS.SKILLS]: "right",
  [SECTIONS.EXPERIENCE]: "left",
  [SECTIONS.PROJECTS]: "left",
  [SECTIONS.CERTIFICATIONS]: "right",
};

const effectiveSlateproColumn = (sectionId: string, explicit?: SectionOrderItem["column"]): "left" | "right" => {
  if (explicit === "left" || explicit === "right") {
    return explicit;
  }
  if (isCustomSection(sectionId)) {
    return "left";
  }
  return SLATEPRO_DEFAULT_COLUMN[sectionId] ?? "left";
};

/**
 * Custom sections not in section_order: `column === "right"` → right; otherwise left
 * (including undefined), matching Nextgen orphan handling.
 */
export const buildSlateproColumns = (data: ResumeData) => {
  const visibleOrdered = deduplicateSectionOrder(data.sectionOrder).filter(s => !s.hidden);
  const visibleSet = new Set(visibleOrdered.map(s => s.id));

  const leftFromOrder = visibleOrdered.filter(s => effectiveSlateproColumn(s.id, s.column) === "left").map(s => s.id);
  const rightFromOrder = visibleOrdered.filter(s => effectiveSlateproColumn(s.id, s.column) === "right").map(s => s.id);

  const orphanLeft = data.customSections.filter(cs => !visibleSet.has(cs.id) && cs.column !== "right").map(cs => cs.id);
  const orphanRight = data.customSections.filter(cs => !visibleSet.has(cs.id) && cs.column === "right").map(cs => cs.id);

  return {
    leftColumnIds: [...leftFromOrder, ...orphanLeft],
    rightColumnIds: [...rightFromOrder, ...orphanRight],
  };
};
