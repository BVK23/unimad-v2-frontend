import type { PortfolioItem } from "@/types";
import type { VpdApiData, VpdCoverPic, VpdEditorContentV2 } from "../types";

/** Payload nested under `{ id, content }` for POST /api/vpd/update/. */
export type VpdUpdateContent = {
  title: string;
  cover_pic: VpdCoverPic;
  editor_content: VpdEditorContentV2;
};

export const mapStudioProjectToVpdUpdateContent = (project: PortfolioItem): VpdUpdateContent => {
  const coverUrl = typeof project.content === "string" ? project.content.trim() : "";
  const position = project.coverPosition;
  const iconUrl = typeof project.iconUrl === "string" ? project.iconUrl.trim() : "";
  return {
    title: (project.title || "").trim() || "Value Proposition Document",
    cover_pic:
      coverUrl || iconUrl
        ? {
            ...(coverUrl ? { url: coverUrl } : {}),
            show: project.showCoverImage !== false,
            ...(iconUrl ? { icon_url: iconUrl } : {}),
            ...(position && typeof position.x === "number" && typeof position.y === "number"
              ? { position: { x: position.x, y: position.y } }
              : {}),
          }
        : {},
    editor_content: {
      schemaVersion: 2,
      items: Array.isArray(project.detailedBlocks) ? project.detailedBlocks : [],
    },
  };
};

/** Snapshot used to detect dirty vs last-saved content (portfolio-style). */
export const getVpdProjectContentSignature = (project: PortfolioItem): string =>
  JSON.stringify({
    id: project.id,
    title: project.title,
    content: project.content,
    showCoverImage: project.showCoverImage,
    coverPosition: project.coverPosition,
    iconUrl: project.iconUrl,
    detailedBlocks: project.detailedBlocks ?? [],
  });

/** Content-only snapshot (excludes id) — used for template edit / claim detection. */
export const getVpdProjectEditSignature = (project: PortfolioItem): string =>
  JSON.stringify({
    title: project.title,
    content: project.content,
    showCoverImage: project.showCoverImage,
    coverPosition: project.coverPosition,
    iconUrl: project.iconUrl,
    detailedBlocks: project.detailedBlocks ?? [],
  });

export const mapVpdUpdateResponseToApiData = (assetData: unknown): VpdApiData | null => {
  if (!assetData || typeof assetData !== "object") return null;
  return assetData as VpdApiData;
};
