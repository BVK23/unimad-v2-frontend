import { normalizePortfolioItems } from "@/features/portfolio/utils/normalizePortfolioItems";
import type { PortfolioItem } from "@/types";
import { formatRelativeTimeFromNow } from "@/utils/format-relative-time";
import { stripHtmlToText } from "@/utils/stripHtmlToText";
import type { VpdApiData, VpdEditorContentV2, VpdStudioListItem, VpdTemplateApi } from "../types";

const isPortfolioItemArray = (value: unknown): value is PortfolioItem[] =>
  Array.isArray(value) &&
  (value.length === 0 || (typeof value[0] === "object" && value[0] !== null && "type" in value[0] && "span" in value[0]));

const isV2EditorContent = (value: unknown): value is VpdEditorContentV2 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return record.schemaVersion === 2 && Array.isArray(record.items);
};

/**
 * Map API VPD payload to the Studio outer project wrapper
 * (`type: "project"` + `detailedBlocks` from schemaVersion 2 items).
 */
export const mapVpdApiToStudioProject = (vpdData: VpdApiData): PortfolioItem => {
  const id = String(vpdData.id ?? vpdData.vpdId ?? `vpd-${Date.now()}`);
  const title = vpdData.title?.trim() || "Value Proposition Document";
  const coverUrl = typeof vpdData.cover_pic?.url === "string" && vpdData.cover_pic.url.trim() ? vpdData.cover_pic.url.trim() : "";
  const rawPosition = vpdData.cover_pic?.position;
  const coverPosition =
    rawPosition && typeof rawPosition.x === "number" && typeof rawPosition.y === "number"
      ? { x: rawPosition.x, y: rawPosition.y }
      : undefined;
  const iconUrl =
    typeof vpdData.cover_pic?.icon_url === "string" && vpdData.cover_pic.icon_url.trim() ? vpdData.cover_pic.icon_url.trim() : undefined;

  let detailedBlocks: PortfolioItem[] = [];
  const editor = vpdData.editor_content;

  if (isV2EditorContent(editor)) {
    detailedBlocks = editor.items as PortfolioItem[];
  } else if (isPortfolioItemArray(editor)) {
    // Defensive: some callers might already send a flat items array
    detailedBlocks = editor;
  }

  // Materialize templateSectionTitle → <h1> so editor toolbar heading state matches preview size
  detailedBlocks = normalizePortfolioItems(detailedBlocks, { normalizeTemplateTitleHeadings: true });

  return {
    id,
    type: "project",
    span: 3,
    title,
    description: "",
    content: coverUrl,
    showCoverImage: coverUrl ? vpdData.cover_pic?.show !== false : true,
    ...(coverPosition ? { coverPosition } : {}),
    ...(iconUrl ? { iconUrl } : {}),
    detailedBlocks,
  };
};

/** Map a persisted VPD into a Recents library card. */
export const mapVpdApiToListItem = (vpdData: VpdApiData): VpdStudioListItem => {
  const project = mapVpdApiToStudioProject(vpdData);
  const plainTitle = stripHtmlToText(project.title || "") || stripHtmlToText(vpdData.title || "") || "Value Proposition Document";
  return {
    id: project.id,
    title: plainTitle,
    date: formatRelativeTimeFromNow(vpdData.updated_at, "Recently"),
    slug: typeof vpdData.slug === "string" && vpdData.slug.trim() ? vpdData.slug.trim() : null,
    role: vpdData.role?.trim() || "",
    company: vpdData.company?.trim() || "",
    job_description: vpdData.job_description?.trim() || "",
    project,
  };
};

/** Map a Studio V2 template fixture into a Templates library card. */
export const mapVpdTemplateToListItem = (template: VpdTemplateApi): VpdStudioListItem => {
  const id = String(template.id || "").trim();
  const label = template.label?.trim() || template.name?.trim() || template.title?.trim() || "Template";
  const docTitle = template.title?.trim() || label;
  const project = mapVpdApiToStudioProject({
    id,
    title: docTitle,
    cover_pic: template.cover_pic,
    editor_content: template.editor_content,
  });

  return {
    id,
    title: label,
    date: "Template",
    isTemplate: true,
    project: {
      ...project,
      title: docTitle,
    },
  };
};
