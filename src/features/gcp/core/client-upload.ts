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
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("Upload error:", error);
    return { success: false, error: message };
  }
};
