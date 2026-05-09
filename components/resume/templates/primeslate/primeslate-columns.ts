import type { ResumeData, SectionOrderItem } from "../../../../types";
import { isCustomSection, SECTIONS } from "../../config/constants";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";

/**
 * Prime Slate: summary lives only in the header — never in left/right columns.
 * Same default split as Slate Pro when `column` is omitted.
 */
const PRIMESLATE_DEFAULT_COLUMN: Record<string, "left" | "right"> = {
  [SECTIONS.PROFILE]: "right",
  [SECTIONS.EDUCATION]: "right",
  [SECTIONS.SKILLS]: "right",
  [SECTIONS.EXPERIENCE]: "left",
  [SECTIONS.PROJECTS]: "left",
  [SECTIONS.CERTIFICATIONS]: "right",
};

const effectivePrimeslateColumn = (sectionId: string, explicit?: SectionOrderItem["column"]): "left" | "right" => {
  if (explicit === "left" || explicit === "right") {
    return explicit;
  }
  if (isCustomSection(sectionId)) {
    return "left";
  }
  return PRIMESLATE_DEFAULT_COLUMN[sectionId] ?? "left";
};

export const buildPrimeslateColumns = (data: ResumeData) => {
  const visibleOrdered = deduplicateSectionOrder(data.sectionOrder)
    .filter(s => !s.hidden)
    .filter(s => s.id !== SECTIONS.PROFILE);

  const visibleSet = new Set(visibleOrdered.map(s => s.id));

  const leftFromOrder = visibleOrdered.filter(s => effectivePrimeslateColumn(s.id, s.column) === "left").map(s => s.id);
  const rightFromOrder = visibleOrdered.filter(s => effectivePrimeslateColumn(s.id, s.column) === "right").map(s => s.id);

  const orphanLeft = data.customSections.filter(cs => !visibleSet.has(cs.id) && cs.column !== "right").map(cs => cs.id);
  const orphanRight = data.customSections.filter(cs => !visibleSet.has(cs.id) && cs.column === "right").map(cs => cs.id);

  return {
    leftColumnIds: [...leftFromOrder, ...orphanLeft],
    rightColumnIds: [...rightFromOrder, ...orphanRight],
  };
};
