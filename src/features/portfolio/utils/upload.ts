import { uploadFileDirect } from "@/features/gcp/core/client-upload";
import { resolveMediaDisplayUrl } from "@/utils/resolve-media-url";

/**
 * MediaStore `category` tags. Keep covers / profile pics separate from ephemeral
 * block media & icons so library + cleanup can treat them differently.
 */
export const MEDIA_CATEGORY = {
  PROFILE_PICTURE: "profile-picture",
  COVER_PICTURE: "cover-picture",
  /** VPD / portfolio document icons (not job-table company logos). */
  DOCUMENT_ICON: "document-icon",
  /** Images/videos/PDFs inside portfolio or VPD content blocks — often deleted quickly. */
  BLOCK_MEDIA: "block-media",
  LINKEDIN_POST: "linkedin-post",
} as const;

export type MediaCategory = (typeof MEDIA_CATEGORY)[keyof typeof MEDIA_CATEGORY];

/**
 * Portfolio media always uses browser → GCS signed-URL uploads.
 * Metadata is recorded via `/api/media-metadata/` after finalize.
 * (Avoids Next.js Server Action ~1MB body limit; API route fallback is unused here.)
 */
export const MAX_DIRECT_UPLOAD_BYTES = 100 * 1024 * 1024;

export type UploadedMediaType = "image" | "video" | "pdf" | "other";

export type UploadedFile = {
  url: string;
  mediaType: UploadedMediaType;
  mimeType: string;
  name: string;
};

export class UploadError extends Error {
  code: "network" | "unknown";

  constructor(message: string, code: UploadError["code"] = "unknown") {
    super(message);
    this.name = "UploadError";
    this.code = code;
  }
}

const inferMimeTypeFromFilename = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "pdf") return "application/pdf";
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  return "";
};

const resolveFileMimeType = (file: File): string => {
  const direct = file.type?.trim();
  if (direct) return direct;
  return inferMimeTypeFromFilename(file.name);
};

const inferMediaType = (mimeType: string): UploadedMediaType => {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
};

const sanitizeUploadFilename = (name: string): string => {
  const base = name.split(/[/\\]/).pop()?.trim() ?? "upload";
  const cleaned = base.replace(/[^\w.\- ()]/g, "_").replace(/_+/g, "_");
  return cleaned || `upload-${Date.now()}.bin`;
};

const withSafeUploadFilename = (file: File): File => {
  const safeName = sanitizeUploadFilename(file.name);
  if (safeName === file.name) return file;
  const mimeType = resolveFileMimeType(file);
  return new File([file], safeName, { type: mimeType || file.type || "application/octet-stream" });
};

const formatSignedUploadError = (error: string): string => {
  if (/GOOGLE_CLOUD_CREDENTIALS|GOOGLE_CLOUD_STORAGE_BUCKET/i.test(error)) {
    return "Uploads need storage credentials in this environment. Add GOOGLE_CLOUD_* vars to .env.local.";
  }
  return error;
};

const uploadViaSignedUrl = async (file: File, category: string): Promise<string> => {
  const result = await uploadFileDirect(file, category);
  if (!result.success) {
    throw new UploadError(formatSignedUploadError(result.error || "Upload failed"), "network");
  }
  return result.url;
};

export type HeroMediaCategory = typeof MEDIA_CATEGORY.PROFILE_PICTURE | typeof MEDIA_CATEGORY.COVER_PICTURE;

export const dataUrlToFile = (dataUrl: string, filename: string, fallbackMimeType = "image/jpeg"): File => {
  const [header, base64] = dataUrl.split(",");
  if (!base64) {
    throw new UploadError("Invalid image data");
  }
  const mime = header?.match(/:(.*?);/)?.[1] ?? fallbackMimeType;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
};

/** Upload a cropped hero image to MediaStore (`profile-picture` or `cover-picture`). */
export const uploadHeroImageFromDataUrl = async (dataUrl: string, category: HeroMediaCategory): Promise<string> => {
  const filename = `${category}-${Date.now()}.jpg`;
  const file = dataUrlToFile(dataUrl, filename);
  const uploaded = await uploadPortfolioFile(file, category);
  return resolveMediaDisplayUrl(uploaded.url);
};

export const uploadPortfolioFile = async (file: File, category: string = MEDIA_CATEGORY.BLOCK_MEDIA): Promise<UploadedFile> => {
  if (!file) {
    throw new UploadError("No file selected. Choose an image or video and try again.");
  }

  const normalizedFile = withSafeUploadFilename(file);

  if (normalizedFile.size > MAX_DIRECT_UPLOAD_BYTES) {
    throw new UploadError(
      `File is too large (${(normalizedFile.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is ${MAX_DIRECT_UPLOAD_BYTES / (1024 * 1024)}MB.`
    );
  }

  const mimeType = resolveFileMimeType(normalizedFile);
  const mediaType = inferMediaType(mimeType);

  console.info("[portfolio-upload] route", {
    category,
    uploadRoute: "gcs-signed-url",
    name: normalizedFile.name,
    originalName: file.name !== normalizedFile.name ? file.name : undefined,
    size: normalizedFile.size,
    type: normalizedFile.type || "(empty mime)",
    resolvedMimeType: mimeType || "(unknown)",
  });

  if (mediaType === "other" && !mimeType) {
    throw new UploadError("Unsupported file type. Use JPG, PNG, GIF, WEBP, MP4, or PDF.");
  }

  let url: string;
  try {
    url = await uploadViaSignedUrl(normalizedFile, category);
  } catch (error) {
    if (error instanceof UploadError) {
      throw error;
    }
    throw new UploadError(error instanceof Error ? error.message : "Upload failed. Check your connection and try again.", "network");
  }

  return {
    url,
    mediaType,
    mimeType,
    name: normalizedFile.name,
  };
};
