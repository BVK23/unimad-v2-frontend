/**
 * Professional template — shared tokens for PDF (react-pdf) and Preview (Tailwind).
 * Values match legacy unimad-frontend professional.jsx + PROFESSIONALS page padding 24pt.
 */
export const PROFESSIONAL_PAGE_PADDING_PT = 24 as const;

export const professionalPtToPx = (pt: number) => Math.round((pt * 96) / 72);

export const PROFESSIONAL_TOKENS = {
  pagePaddingPt: PROFESSIONAL_PAGE_PADDING_PT,
  colors: {
    text: "#373737",
    muted: "#666666",
    sectionBar: "#F5F8FD",
  },
  layout: {
    leftColumnWidth: "40%",
    rightColumnWidth: "60%",
  },
  spacing: {
    /** Section stack gap (mainSection) */
    sectionGap: 11,
    sectionContentGap: 8,
    rowMarginBottom: 5,
    mainSectionTop: 2,
    personalHeadingGap: 2.4,
    personalHeadingMarginBottom: 12,
    subHeaderMarginBottom: 10,
    headerDetailsPaddingY: 10,
    headerDetailsGap: 10,
    headerDetailsMarginBottom: 20,
    skillsGap: 4,
    skillHeaderGap: 2,
    certItemGap: 3,
    certTitleMarginBottom: 3,
    listWrapperGap: 5,
    listWrapperMarginLeft: 8,
    listItemGap: 3,
    customRowGap: 4,
  },
  sizes: {
    name: 26,
    title: 16,
    contact: 11,
    sectionHeading: 18,
    sectionTitle: 14,
    leftDate: 11,
    leftBody: 11,
    rightHeader: 11,
    rightBody: 10,
    listItem: 9,
    certRow: 9,
    certSubtitle: 8,
    customRowFont: 11,
  },
  weights: {
    name: 600,
    title: 200,
    sectionHeading: 600,
    sectionTitle: 600,
    leftDate: 700,
    leftBody: 400,
    leftMuted: 200,
    rightHeader: 700,
    rightBody: 400,
    listBullet: 600,
    listText: 400,
    certTitle: 600,
    customTitle: 600,
  },
  /** Legacy page font; Google Fonts CSS does not ship separate Outfit italic TTFs — PDF/preview rely on synthetic italic for <em> via HtmlRenderer. */
  fontFamily: "Outfit",
} as const;
