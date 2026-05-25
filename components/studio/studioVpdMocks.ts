import type { PortfolioItem } from "../../types";
import type { VpdLibraryItem } from "./VpdLibraryCard";

const makeVpdListItem = (
  id: string,
  title: string,
  date: string,
  detailedBlocks: PortfolioItem["detailedBlocks"] = [],
  isTemplate?: boolean
): VpdLibraryItem => ({
  id,
  title,
  date,
  isTemplate,
  project: {
    id,
    type: "project",
    span: 3,
    title,
    description: isTemplate ? "Starter layout for your pitch" : "",
    content: "",
    detailedBlocks,
  },
});

export const STUDIO_VPD_LIBRARY_ITEMS: VpdLibraryItem[] = [
  makeVpdListItem("vpd-1", "Product Designer @ Google", "2 days ago", [
    {
      id: "b1",
      type: "text",
      title: "Core strengths",
      content: "Design systems, prototyping, and cross-functional collaboration.",
      span: 12,
    },
  ]),
  makeVpdListItem("vpd-2", "UX Researcher @ Spotify", "1 week ago", [
    {
      id: "b1",
      type: "text",
      title: "Research focus",
      content: "Mixed-methods studies for subscription retention.",
      span: 12,
    },
  ]),
];
