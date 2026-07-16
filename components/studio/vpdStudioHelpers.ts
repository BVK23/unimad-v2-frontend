import type { PortfolioItem } from "@/types";
import type { VpdLibraryItem } from "./VpdLibraryCard";

export type VpdListItem = VpdLibraryItem;

export const createDefaultVpdProject = (): PortfolioItem => ({
  id: `vpd-${Date.now()}`,
  type: "project",
  span: 3,
  title: "Untitled VPD",
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
