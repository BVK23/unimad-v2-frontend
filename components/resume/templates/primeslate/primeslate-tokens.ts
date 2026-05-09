/**
 * Prime Slate template — tokens for PDF (react-pdf) and Preview (Tailwind).
 * Accent and layout mirror legacy unimadai-frontendapp prime-slate.jsx.
 */
import { getTemplateConfig } from "../../config/constants";

export const PRIMESLATE_PAGE_PADDING_PT = 12 as const;

export const primeslatePtToPx = (pt: number) => Math.round((pt * 96) / 72);

const primeslatePdfCfg = getTemplateConfig("primeslate").pdf;

export const PRIMESLATE_TOKENS = {
  pagePaddingPt: PRIMESLATE_PAGE_PADDING_PT,
  colors: {
    accent: "#2D4B98",
    text: "#373737",
    muted: "#666666",
    border: "#000000",
    skillPillBorder: "#2D4B98",
  },
  layout: {
    /** Normalized from legacy 75% + 45% (120%) → 5:3 ratio */
    leftColumnWidth: "62.5%",
    rightColumnWidth: "37.5%",
    sectionShellWidth: "80%",
    photoSize: 70,
    photoRadius: 4,
  },
  spacing: {
    headerMarginBottom: 4,
    contactBarPaddingY: 4,
    contactBarGap: 8,
    sectionMarginBottom: 8,
    sectionContentGap: 8,
    skillPillPaddingX: 8,
    skillPillPaddingY: 4,
    skillPillGap: 4,
    categoryGap: 4,
  },
  sizes: {
    name: 28,
    /** Job / profile title under name (maps to `profile.title`) */
    profileTitle: 14,
    sectionHeading: 12,
    firstTitle: 12,
    subtitle: 11,
    contactBar: 11,
    slash: 12,
    body: 9,
    listItem: 9,
  },
  weights: {
    name: 600,
    profileTitle: 300,
    sectionHeading: 700,
    firstTitle: 600,
    subtitle: 500,
    contactBar: 500,
  },
  fontFamily: primeslatePdfCfg.fontFamily,
} as const;
