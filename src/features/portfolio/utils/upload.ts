import { uploadFileDirect } from "@/features/gcp/core/client-upload";
import { uploadMedia } from "@/features/portfolio/server-actions/asset";

export const BACKEND_SIZE_THRESHOLD_BYTES = 4.5 * 1024 * 1024;

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

const uploadViaSignedUrl = async (file: File, category: string): Promise<string> => {
  const result = await uploadFileDirect(file, category);
  if (!result.success) {
    throw new UploadError(result.error || "Upload failed", "network");
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

export const uploadPortfolioFile = async (file: File, category: string = "portfolio-assets"): Promise<UploadedFile> => {
  if (!file) {
    throw new UploadError("No file provided");
  }

  const mimeType = file.type || "";
  const mediaType = inferMediaType(mimeType);
  const isVideo = mediaType === "video";
  const shouldUseSignedUrl = isVideo || file.size > BACKEND_SIZE_THRESHOLD_BYTES;

  const url = shouldUseSignedUrl ? await uploadViaSignedUrl(file, category) : await uploadViaBackend(file, category);

  return {
    url,
    mediaType,
    mimeType,
    name: file.name,
  };
};
