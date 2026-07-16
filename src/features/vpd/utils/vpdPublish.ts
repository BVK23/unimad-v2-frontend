import type { PortfolioItem } from "@/types";
import type { VpdApiData, VpdEditorContentV2 } from "../types";
import { mapStudioProjectToVpdUpdateContent } from "./mapStudioProjectToVpdUpdatePayload";

/** Normalize slug the same way Studio / portfolio publish does before hitting the API. */
export const normalizeVpdPublishSlug = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-|-$/g, "");

export const buildVpdPublicUrl = (slug: string): string => {
  const trimmed = slug.trim();
  if (typeof window !== "undefined") {
    return `${window.location.origin}/vpd/${trimmed}`;
  }
  return `/vpd/${trimmed}`;
};

/** Payload for POST /api/publish-asset/ with assetType: "vpd". Must include `id` (vpd_id). */
export const mapStudioProjectToVpdPublishContent = (project: PortfolioItem, slug?: string): VpdApiData & { id: string } => {
  const update = mapStudioProjectToVpdUpdateContent(project);
  return {
    id: String(project.id),
    title: update.title,
    cover_pic: update.cover_pic,
    editor_content: update.editor_content as VpdEditorContentV2,
    ...(slug ? { slug } : {}),
  };
};
