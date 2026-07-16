import { normalizePortfolioItems } from "@/features/portfolio/utils/normalizePortfolioItems";
import {
  CLOUD_ENGINEER_DIGITAL_WORLD_COVER_URL,
  CLOUD_ENGINEER_DIGITAL_WORLD_DETAILED_BLOCKS,
} from "@/features/vpd/templates/cloudEngineerDigitalWorldBlocks";
import { GENERAL_PITCH_COVER_URL, GENERAL_PITCH_DETAILED_BLOCKS } from "@/features/vpd/templates/generalPitchBlocks";
import { WEB3_DEV_UMA_COVER_URL, WEB3_DEV_UMA_DETAILED_BLOCKS } from "@/features/vpd/templates/web3DevUmaBlocks";
import type { PortfolioItem } from "@/types";
import type { VpdLibraryItem } from "./VpdLibraryCard";

export type VpdListItem = VpdLibraryItem;

const makeTemplateItem = (id: string, label: string, docTitle: string, coverUrl: string, blocks: PortfolioItem[]): VpdListItem => ({
  id,
  title: label,
  date: "Template",
  isTemplate: true,
  project: {
    id,
    type: "project",
    span: 3,
    title: docTitle,
    description: "Value Proposition Document",
    content: coverUrl,
    showCoverImage: Boolean(coverUrl),
    detailedBlocks: normalizePortfolioItems(blocks, { normalizeTemplateTitleHeadings: true }),
  },
});

/** Studio Templates tab — V1 base + featured example VPDs as portfolio-grid starters. */
export const MOCK_VPD_TEMPLATES: VpdListItem[] = [
  makeTemplateItem("tpl-general", "General pitch template", "Role @ Company", GENERAL_PITCH_COVER_URL, GENERAL_PITCH_DETAILED_BLOCKS),
  makeTemplateItem("tpl-web3-uma", "Web3 Dev - Uma", "Web3 Dev - Uma", WEB3_DEV_UMA_COVER_URL, WEB3_DEV_UMA_DETAILED_BLOCKS),
  makeTemplateItem(
    "tpl-cloud-digital",
    "Cloud Engineer @ Digital World",
    "Cloud Engineer @ Digital World",
    CLOUD_ENGINEER_DIGITAL_WORLD_COVER_URL,
    CLOUD_ENGINEER_DIGITAL_WORLD_DETAILED_BLOCKS
  ),
];

/** @deprecated Use MOCK_VPD_TEMPLATES; Recents are loaded from the API. */
export const MOCK_VPDS = MOCK_VPD_TEMPLATES;

export const createDefaultVpdProject = (): PortfolioItem => ({
  id: `vpd-${Date.now()}`,
  type: "project",
  span: 3,
  title: "New Value Prop Doc",
  description: "",
  content: "",
  detailedBlocks: [],
});

export const buildVpdProjectFromDraft = (role: string, company: string, draftText: string): PortfolioItem => ({
  id: `vpd-${Date.now()}`,
  type: "project",
  span: 3,
  title: role && company ? `${role} @ ${company}` : "Value Proposition Document",
  description: "",
  content: "",
  detailedBlocks: [
    {
      id: "vpd-b1",
      type: "text",
      title: "Core strengths",
      content: draftText.split("\n\n")[0] || draftText,
      span: 12,
    },
    {
      id: "vpd-b2",
      type: "text",
      title: "Why this role",
      content: draftText.split("\n\n")[1] || "Tailored value for the hiring team.",
      span: 6,
    },
    {
      id: "vpd-b3",
      type: "link-box",
      title: "Portfolio",
      content: "https://your-portfolio.com",
      span: 6,
    },
  ],
});
