import { uploadFileDirect } from "@/features/gcp/core/client-upload";
import { uploadMedia } from "@/features/portfolio/server-actions/asset";
import { resolveMediaDisplayUrl } from "@/utils/resolve-media-url";

/** Images/PDFs at or below this size go through Django `/api/media-upload/` (stored in MediaStore → GCS). */
export const BACKEND_SIZE_THRESHOLD_BYTES = 4 * 1024 * 1024;

/** Max size for browser → GCS signed-URL uploads (videos always; large images/PDFs). */
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

const inferMediaType = (mimeType: string): UploadedMediaType => {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
};

const formatSignedUploadError = (error: string): string => {
  if (/GOOGLE_CLOUD_CREDENTIALS|GOOGLE_CLOUD_STORAGE_BUCKET/i.test(error)) {
    return "Large uploads need storage credentials in this environment. Use a file under 4MB, or add GOOGLE_CLOUD_* vars to .env.local.";
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

const uploadViaBackend = async (file: File, category: string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);

  const response = await uploadMedia(formData);
  if (response.error || !response.content?.url) {
    throw new UploadError(response.error || "Upload failed", "network");
  }
  return response.content.url;
};

export type HeroMediaCategory = "profile-picture" | "cover-picture";

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

export const uploadPortfolioFile = async (file: File, category: string = "portfolio-assets"): Promise<UploadedFile> => {
  if (!file) {
    throw new UploadError("No file provided");
  }

  if (file.size > MAX_DIRECT_UPLOAD_BYTES) {
    throw new UploadError(`File is too large. Maximum size is ${MAX_DIRECT_UPLOAD_BYTES / (1024 * 1024)}MB.`);
  }

  const mimeType = file.type || "";
  const mediaType = inferMediaType(mimeType);
  const isVideo = mediaType === "video";
  // Videos always use signed URL. Images/PDFs use backend when ≤4MB, GCS direct when >4MB.
  const shouldUseSignedUrl = isVideo || file.size > BACKEND_SIZE_THRESHOLD_BYTES;

  const url = shouldUseSignedUrl ? await uploadViaSignedUrl(file, category) : await uploadViaBackend(file, category);

  return {
    url,
    mediaType,
    mimeType,
    name: file.name,
  };
};
