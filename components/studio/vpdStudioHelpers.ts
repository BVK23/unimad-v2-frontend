import type { PortfolioItem } from "@/types";
import type { VpdLibraryItem } from "./VpdLibraryCard";

export type VpdListItem = VpdLibraryItem;

const makeVpdListItem = (id: string, title: string, date: string, detailedBlocks: PortfolioItem[], isTemplate?: boolean): VpdListItem => ({
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

export const MOCK_VPDS: VpdListItem[] = [
  makeVpdListItem("vpd-1", "Product Designer @ Google", "2 days ago", [
    {
      id: "b1",
      type: "text",
      title: "Core strengths",
      content: "Design systems, prototyping, and cross-functional collaboration.",
      span: 12,
    },
    { id: "b2", type: "text", title: "Why me", content: "Shipped onboarding flows that lifted activation by 18%.", span: 6 },
    { id: "b3", type: "link-box", title: "Portfolio", content: "https://portfolio.example.com", span: 6 },
  ]),
  makeVpdListItem("vpd-2", "UX Researcher @ Spotify", "1 week ago", [
    { id: "b1", type: "text", title: "Research focus", content: "Mixed-methods studies for subscription retention.", span: 12 },
    { id: "b2", type: "text", title: "Impact", content: "Influenced roadmap for discovery personalization.", span: 6 },
    { id: "b3", type: "media", title: "Case study", content: "https://picsum.photos/seed/vpd2/800/500", span: 6 },
  ]),
  makeVpdListItem(
    "tpl-1",
    "General pitch template",
    "Template",
    [
      { id: "b1", type: "text", title: "Headline", content: "Your value proposition in one clear sentence.", span: 12 },
      { id: "b2", type: "text", title: "Proof points", content: "3 measurable outcomes that match the role.", span: 6 },
      { id: "b3", type: "link-box", title: "Work samples", content: "https://your-portfolio.com", span: 6 },
    ],
    true
  ),
  makeVpdListItem(
    "tpl-2",
    "Student portfolio template",
    "Template",
    [
      { id: "b1", type: "text", title: "About me", content: "International student pursuing design with internship experience.", span: 12 },
      { id: "b2", type: "text", title: "Projects", content: "Highlight 2 academic or freelance projects.", span: 6 },
      { id: "b3", type: "link-box", title: "LinkedIn", content: "https://linkedin.com/in/you", span: 6 },
    ],
    true
  ),
];

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
