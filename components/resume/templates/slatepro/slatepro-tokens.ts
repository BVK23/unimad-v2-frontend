/**
 * Slate Pro template — shared tokens for PDF (react-pdf) and Preview (Tailwind).
 * Layout and sizes mirror legacy unimadai-frontendapp slate-pro.jsx.
 */
import { getTemplateConfig } from "../../config/constants";

export const SLATEPRO_PAGE_PADDING_PT = 15 as const;

export const slateproPtToPx = (pt: number) => Math.round((pt * 96) / 72);

const slateproPdfCfg = getTemplateConfig("slatepro").pdf;

export const SLATEPRO_TOKENS = {
  pagePaddingPt: SLATEPRO_PAGE_PADDING_PT,
  colors: {
    text: "#373737",
    muted: "#666666",
    rule: "#373737",
    avatarBorder: "#000000",
  },
  layout: {
    leftColumnWidth: "65%",
    rightColumnWidth: "35%",
    leftColumnPaddingRight: 12,
    rightColumnPaddingLeft: 8,
    avatarSize: 70,
  },
  spacing: {
    headerGap: 10,
    headerBottom: 4,
    nameTitleGap: 4,
    sectionGap: 8,
    ruleGap: 0.5,
    sectionHeadingGap: 1,
    sectionContentGap: 0.5,
    contactBlockGap: 8,
    contactRowGap: 3,
    experienceGap: 2.5,
    educationBlockGap: 6,
    skillsCategoryGap: 4,
  },
  sizes: {
    name: 28,
    title: 14,
    sectionHeading: 12,
    firstTitle: 10,
    subtitle: 11,
    contactLabel: 11,
    contactValue: 11,
    body: 9,
    listItem: 9,
    avatarInitials: 25,
  },
  weights: {
    name: 600,
    titleLight: 300,
    sectionHeading: 700,
    firstTitle: 600,
    subtitle: 600,
    contactLabel: 600,
    contactValue: 500,
    bullet: 600,
  },
  fontFamily: slateproPdfCfg.fontFamily,
} as const;
