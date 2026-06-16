import { finalizeDirectUpload, getUploadUrl } from "../server-actions/direct-upload";

export type UploadFileDirectResult =
  | {
      success: true;
      url: string;
      filename: string;
      size: number;
      type: string;
      originalName: string;
    }
  | { success: false; error: string };

const isLikelyCorsOrNetworkFailure = (message: string): boolean =>
  message === "Failed to fetch" || /networkerror|load failed|cors/i.test(message);

const formatDirectUploadError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : "Upload failed";
  if (isLikelyCorsOrNetworkFailure(message)) {
    console.error(
      "[gcp-upload] Browser blocked PUT to GCS (CORS). Apply src/features/gcp/gcs-bucket-cors.json to the media bucket.",
      error
    );
    return "Video upload failed due to storage configuration on this environment. Please try again later or contact support.";
  }
  return message;
};

const uploadToSignedUrl = async (file: File, signedUrl: string): Promise<{ success: true; status: number }> => {
  const response = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
    mode: "cors",
    credentials: "omit",
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status: ${response.status}`);
  }

  return { success: true, status: response.status };
};

export const uploadFileDirect = async (file: File, category: string = "portfolio-assets"): Promise<UploadFileDirectResult> => {
  try {
    const urlResult = await getUploadUrl(
      {
        name: file.name,
        type: file.type,
        size: file.size,
      },
      category
    );

    if (!urlResult.success) {
      throw new Error(urlResult.error);
    }

    await uploadToSignedUrl(file, urlResult.signedUrl);

    const finalizeResult = await finalizeDirectUpload(urlResult.filename, category);
    if (!finalizeResult.success) {
      throw new Error(finalizeResult.error);
    }

    return {
      success: true,
      url: finalizeResult.url,
      filename: finalizeResult.filename,
      size: file.size,
      type: file.type,
      originalName: file.name,
    };
  } catch (error) {
    const message = formatDirectUploadError(error);
    console.error("Upload error:", error);
    return { success: false, error: message };
  }
};
