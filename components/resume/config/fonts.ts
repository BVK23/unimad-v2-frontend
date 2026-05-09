import { Font } from "@react-pdf/renderer";

/**
 * Central font registration for all resume PDF templates.
 * Import this file once in ResumePDF.tsx (or the PDF entry point).
 * Templates reference fonts by family name string.
 */

// Register Onest font (primary font for Modern template)
Font.register({
  family: "Onest",
  fonts: [
    { src: "https://fonts.gstatic.com/s/onest/v9/gNMZW3F-SZuj7zOT0IfSjTS16cPh9R-Zsg.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/onest/v9/gNMZW3F-SZuj7zOT0IfSjTS16cPhxx-Zsg.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/onest/v9/gNMZW3F-SZuj7zOT0IfSjTS16cPhKxiZsg.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/onest/v9/gNMZW3F-SZuj7zOT0IfSjTS16cPhEhiZsg.ttf", fontWeight: 700 },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCM3FwrK3iLTcvneQg7Ca725JhhKnNqk4j1ebLhAm8SrXTc2dthjQ.ttf",
      fontWeight: 400,
      fontStyle: "italic",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCM3FwrK3iLTcvneQg7Ca725JhhKnNqk4j1ebLhAm8SrXTcPtxhjQ.ttf",
      fontWeight: 700,
      fontStyle: "italic",
    },
  ],
});

// Outfit — Nextgen template (legacy unimad-frontend default PDF body font)
Font.register({
  family: "Outfit",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4bC1C4E.ttf",
      fontWeight: 200,
    },
    {
      src: "https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1C4E.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4e6yC4E.ttf",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4deyC4E.ttf",
      fontWeight: 700,
    },
  ],
});

// Font family constants — use these in template StyleSheets
export const FONT_FAMILIES = {
  ONEST: "Onest",
  OUTFIT: "Outfit",
} as const;

export type FontFamily = (typeof FONT_FAMILIES)[keyof typeof FONT_FAMILIES];
