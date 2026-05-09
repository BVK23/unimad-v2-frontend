import { getBucket } from "../config";

const SUPPORTED_VIDEO_FORMATS = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/x-flv",
  "video/x-matroska",
  "video/3gpp",
  "video/3gpp2",
];

const MAX_VIDEO_FILE_SIZE = 100 * 1024 * 1024;

export type FileInfo = {
  name: string;
  type: string;
  size: number;
};

export type ValidationResult = { success: true } | { success: false; error: string };

export const validateVideoFile = (file: FileInfo | null | undefined): ValidationResult => {
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  if (!SUPPORTED_VIDEO_FORMATS.includes(file.type)) {
    const supported = SUPPORTED_VIDEO_FORMATS.map(format => format.split("/")[1]).join(", ");
    return {
      success: false,
      error: `Unsupported video format. Supported formats: ${supported}`,
    };
  }

  if (file.size > MAX_VIDEO_FILE_SIZE) {
    return {
      success: false,
      error: `File size too large. Maximum size: ${MAX_VIDEO_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { success: true };
};

const generateUniqueFilename = (originalName: string, linkedinId: string, folder: string): string => {
  const lastDot = originalName.lastIndexOf(".");
  const extension = lastDot >= 0 ? originalName.slice(lastDot + 1) : "";
  const nameWithoutExtension = lastDot >= 0 ? originalName.slice(0, lastDot) : originalName;
  const cleanedName = nameWithoutExtension.replace(/\s+/g, "_");
  const safeFolder = folder.replace(/^\/+|\/+$/g, "") || "portfolio-assets";
  return extension ? `${linkedinId}/${safeFolder}/${cleanedName}.${extension}` : `${linkedinId}/${safeFolder}/${cleanedName}`;
};

export type SignedUrlResult = {
  signedUrl: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
};

export const generateSignedUploadUrl = async (file: FileInfo, linkedinId: string, folder: string): Promise<SignedUrlResult> => {
  if (file.type.startsWith("video/")) {
    const validation = validateVideoFile(file);
    if (!validation.success) {
      throw new Error(validation.error);
    }
  }

  const filename = generateUniqueFilename(file.name, linkedinId, folder);
  const gcpFile = getBucket().file(filename);

  const [signedUrl] = await gcpFile.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType: file.type,
  });

  return {
    signedUrl,
    filename,
    originalName: file.name,
    size: file.size,
    type: file.type,
  };
};

export type FinalizeResult = {
  success: true;
  url: string;
  filename: string;
};

export const finalizeUpload = async (filename: string): Promise<FinalizeResult> => {
  const bucket = getBucket();
  const gcpFile = bucket.file(filename);
  await gcpFile.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

  return {
    success: true,
    url: publicUrl,
    filename,
  };
};
