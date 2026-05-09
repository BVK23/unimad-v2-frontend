/**
 * Nextgen template — shared tokens for PDF (react-pdf) and Preview (Tailwind).
 * Page insets: Modern uses uniform 30pt; Nextgen uses a 40pt light name whose line box
 * reads as extra top/bottom whitespace, so top/bottom are slightly tighter than 30pt.
 */
export const NEXTGEN_PAGE_PADDING_PT = {
  top: 22,
  bottom: 22,
  horizontal: 0,
} as const;

export const nextgenPtToPx = (pt: number) => Math.round((pt * 96) / 72);

export const NEXTGEN_TOKENS = {
  pagePaddingPt: NEXTGEN_PAGE_PADDING_PT,
  colors: {
    text: "#373737",
    accent: "#346DE0",
    muted: "#666666",
  },
  spacing: {
    sectionContentMarginLeft: 28,
    sectionContentGap: 8,
    sectionMarginBottom: 8,
    entryGap: 6,
    sectionHeadingGap: 2.4,
    rightColumnGap: 10,
    headerBottomGap: 3,
    /** Match Basic / baseStyles: no extra top inside header; page padding handles top inset */
    personalPaddingTop: 0,
    personalPaddingBottom: 7,
  },
  sizes: {
    name: 40,
    contact: 11,
    pipe: 12,
    sectionHeading: 16,
    subtitle: 12,
    secondTitle: 12,
    body: 10,
    listItem: 9,
  },
  weights: {
    name: 200,
    sectionHeading: 700,
    subtitle: 600,
    secondTitle: 400,
    bullet: 600,
  },
  layout: {
    leftColumnWidth: "65%",
    rightColumnWidth: "35%",
    experienceLeftCol: "70%",
    experienceRightCol: "30%",
    sectionWidth: "95%",
  },
  fontFamily: "Outfit",
} as const;
