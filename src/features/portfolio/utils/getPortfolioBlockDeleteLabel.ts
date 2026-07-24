import type { PortfolioItem } from "@/types";
import { htmlToPlainText } from "@/utils/html-to-text";

const BLOCK_TYPE_LABELS: Record<PortfolioItem["type"], string> = {
  text: "Text block",
  image: "Image block",
  video: "Video block",
  link: "Link block",
  project: "Project block",
  code: "Code block",
  service: "Service block",
  collapsible: "Collapsible block",
  media: "Media block",
  "link-box": "Link box block",
  "page-card": "Page card block",
  table: "Table block",
  embed: "Embed block",
  box: "Box block",
};

export function getPortfolioBlockDeleteLabel(item: PortfolioItem): string {
  const title = htmlToPlainText(item.title ?? "").trim();
  if (title) {
    return title;
  }

  return BLOCK_TYPE_LABELS[item.type] ?? "Content block";
}
