import React from "react";
import { ResumeTemplateId } from "../../../types";

/**
 * Central template configuration.
 * All template metadata, settings, and registration live here.
 */

// Section ID constants
export const SECTIONS = {
  PROFILE: "profile",
  EXPERIENCE: "experience",
  EDUCATION: "education",
  SKILLS: "skills",
  PROJECTS: "projects",
  CERTIFICATIONS: "certifications",
} as const;

export type SectionId = (typeof SECTIONS)[keyof typeof SECTIONS];

/** Check if a section ID belongs to a custom (user-created) section */
export const isCustomSection = (id: string): boolean => {
  return !Object.values(SECTIONS).includes(id as SectionId);
};

/** Template layout types */
export type TemplateLayout = "single-column" | "two-column";

/** Per-template configuration */
export interface TemplateConfig {
  id: ResumeTemplateId;
  name: string;
  description: string;
  layout: TemplateLayout;
  available: boolean;
  /** When false, template still renders for existing resumes but is hidden from the picker */
  showInPicker: boolean;

  // Visual metadata for template picker
  accentColor: string;
  previewBg?: string;

  // PDF settings
  pdf: {
    fontFamily: string;
    baseFontSize: number;
    pagePadding: number;
  };
}

/** Template registry — add entries here when adding new templates */
export const TEMPLATE_CONFIGS: Record<ResumeTemplateId, TemplateConfig> = {
  modern: {
    id: "modern",
    name: "Modern",
    description: "Clean, professional layout with brand color accents",
    layout: "single-column",
    available: true,
    showInPicker: true,
    accentColor: "#346de0",
    pdf: {
      fontFamily: "Onest",
      baseFontSize: 10,
      pagePadding: 30,
    },
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Centered header with two-column content layout",
    layout: "two-column",
    available: true,
    showInPicker: true,
    accentColor: "#64748b",
    pdf: {
      fontFamily: "Onest",
      baseFontSize: 10,
      pagePadding: 30,
    },
  },
  classic: {
    id: "classic",
    name: "Classic",
    description: "Traditional serif layout, perfect for academia",
    layout: "single-column",
    available: true,
    showInPicker: false,
    accentColor: "#1e293b",
    pdf: {
      fontFamily: "Onest",
      baseFontSize: 10,
      pagePadding: 30,
    },
  },
  us: {
    id: "us",
    name: "American Template",
    description: "Standard US formatting with Times New Roman",
    layout: "single-column",
    available: true,
    showInPicker: true,
    accentColor: "#000000",
    pdf: {
      fontFamily: "Times-Roman",
      baseFontSize: 10,
      pagePadding: 24, // 24pt ~ 32px
    },
  },
  canada: {
    id: "canada",
    name: "Canadian Template",
    description: "Clean formatting optimized for Canadian employers",
    layout: "single-column",
    available: true,
    showInPicker: true,
    accentColor: "#000000",
    pdf: {
      fontFamily: "Helvetica", // Will override with Poppins later if we add custom font loader
      baseFontSize: 10,
      pagePadding: 28, // 28pt padding based on original specs
    },
  },
  basic: {
    id: "basic",
    name: "Basic Template",
    description: "Clean formatting with blue accents and traditional layout",
    layout: "single-column",
    available: true,
    showInPicker: true,
    accentColor: "#346DE0",
    pdf: {
      fontFamily: "Outfit",
      baseFontSize: 9,
      pagePadding: 30,
    },
  },
  ireland: {
    id: "ireland",
    name: "Ireland Template",
    description: "Centered header with pipe-separated contacts and serif headings",
    layout: "single-column",
    available: true,
    showInPicker: true,
    accentColor: "#000000",
    pdf: {
      fontFamily: "Onest",
      baseFontSize: 10,
      pagePadding: 24,
    },
  },
  aus: {
    id: "aus",
    name: "Australia Template",
    description: "Clean formatting optimized for Australian employers, similar to the Basic template but left-aligned.",
    layout: "single-column",
    available: true,
    showInPicker: true,
    accentColor: "#000000",
    pdf: {
      fontFamily: "Poppins",
      baseFontSize: 9,
      pagePadding: 40,
    },
  },
  nextgen: {
    id: "nextgen",
    name: "Nextgen",
    description: "Two-column layout with Outfit typography and section columns",
    layout: "two-column",
    available: true,
    showInPicker: false,
    accentColor: "#346DE0",
    pdf: {
      fontFamily: "Outfit",
      baseFontSize: 10,
      /** Horizontal inset; Nextgen PDF uses asymmetric top/bottom from `nextgen-tokens` */
      pagePadding: 30,
    },
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "Centered header with 40/60 split rows and Outfit typography",
    layout: "single-column",
    available: true,
    showInPicker: true,
    accentColor: "#373737",
    pdf: {
      fontFamily: "Outfit",
      baseFontSize: 11,
      pagePadding: 24,
    },
  },
  slatepro: {
    id: "slatepro",
    name: "Slate Pro",
    description: "Two-column layout with avatar header and contact sidebar",
    layout: "two-column",
    available: true,
    showInPicker: true,
    accentColor: "#373737",
    pdf: {
      fontFamily: "Outfit",
      baseFontSize: 10,
      pagePadding: 15,
    },
  },
  primeslate: {
    id: "primeslate",
    name: "Prime Slate",
    description: "Blue-accent header, photo, summary, and two-column body with skill pills",
    layout: "two-column",
    available: true,
    showInPicker: false,
    accentColor: "#2D4B98",
    pdf: {
      fontFamily: "Onest",
      baseFontSize: 10,
      pagePadding: 12,
    },
  },
};

/** Get all templates shown in the template picker (basic first) */
export const getAvailableTemplates = (): TemplateConfig[] => {
  return Object.values(TEMPLATE_CONFIGS)
    .filter(t => t.available && t.showInPicker)
    .sort((a, b) => {
      if (a.id === "basic") return -1;
      if (b.id === "basic") return 1;
      return 0;
    });
};

/** Get config for a specific template */
export const getTemplateConfig = (id: ResumeTemplateId): TemplateConfig => {
  return TEMPLATE_CONFIGS[id];
};

/** Check if a template uses two-column layout */
export const isTwoColumnTemplate = (id: ResumeTemplateId): boolean => {
  return TEMPLATE_CONFIGS[id]?.layout === "two-column";
};

/** Default section ordering for new resumes */
export const DEFAULT_SECTION_ORDER = [
  { id: SECTIONS.PROFILE },
  { id: SECTIONS.EXPERIENCE },
  { id: SECTIONS.EDUCATION },
  { id: SECTIONS.SKILLS },
  { id: SECTIONS.PROJECTS },
  { id: SECTIONS.CERTIFICATIONS },
];

/** Human-readable section labels */
export const SECTION_LABELS: Record<string, string> = {
  [SECTIONS.PROFILE]: "Profile",
  [SECTIONS.EXPERIENCE]: "Experience",
  [SECTIONS.EDUCATION]: "Education",
  [SECTIONS.SKILLS]: "Skills",
  [SECTIONS.PROJECTS]: "Projects",
  [SECTIONS.CERTIFICATIONS]: "Certifications",
};
