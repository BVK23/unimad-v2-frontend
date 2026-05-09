import { StyleSheet } from "@react-pdf/renderer";

/**
 * Shared base styles for all PDF templates.
 * Template-specific styles should compose with these using spread syntax.
 *
 * @example
 * const styles = StyleSheet.create({
 *   page: { ...baseStyles.page, fontFamily: 'Garamond' },
 *   myCustomHeader: { ...baseStyles.flexRowBetween, borderBottom: 2 },
 * });
 */

// Spacing scale (inspired by Tailwind / old repo's pdf-styles.js)
export const spacing = {
  0: 0,
  0.5: "1pt",
  1: "3pt",
  2: "6pt",
  3: "9pt",
  4: "12pt",
  5: "15pt",
  6: "18pt",
  8: "24pt",
  10: "30pt",
  12: "36pt",
} as const;

// Brand colors used across templates
export const colors = {
  brand500: "#346de0",
  brand600: "#2553d0",
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  white: "#ffffff",
} as const;

export const baseStyles = StyleSheet.create({
  // A4 page defaults
  page: {
    flexDirection: "column",
    backgroundColor: colors.white,
    padding: 30,
    fontWeight: 400,
  },

  // Common flex utilities
  flexRow: {
    flexDirection: "row",
  },
  flexRowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  flexCol: {
    flexDirection: "column",
  },
  flexCenter: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Section container
  section: {
    marginBottom: 15,
  },

  // Item container (experience, education, etc.)
  item: {
    marginBottom: 10,
  },

  // Description text (shared across all section types)
  description: {
    fontSize: 10,
    color: colors.slate700,
    lineHeight: 1.4,
    marginTop: 2,
  },

  // Date text
  date: {
    fontSize: 9,
    color: colors.slate500,
  },

  // Location text
  location: {
    fontSize: 9,
    color: colors.slate400,
  },
});
