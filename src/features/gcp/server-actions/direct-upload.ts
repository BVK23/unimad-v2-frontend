"use server";

import { cookies } from "next/headers";
import { finalizeUpload, generateSignedUploadUrl, type FileInfo } from "../core/storage";

type AuthResult = { token: string; scheme: "Token" | "Bearer" };

const getBackendUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined. Add it to your .env.local file.");
  }
  return url.replace(/\/+$/, "");
};

const looksLikeJwt = (value: string): boolean => /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value.trim());

const getAuth = async (): Promise<AuthResult> => {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;

  if (!cookieToken) {
    throw new Error("Unauthorized");
  }

  return {
    token: cookieToken,
    scheme: looksLikeJwt(cookieToken) ? "Bearer" : "Token",
  };
};

const resolveLinkedinId = async (): Promise<string> => {
  const { token, scheme } = await getAuth();
  const backendUrl = getBackendUrl();

  const res = await fetch(`${backendUrl}/api/user-data/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${scheme} ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to resolve user identity for upload");
  }

  const data = (await res.json()) as { username?: string };
  const linkedinId = data?.username;

  if (!linkedinId) {
    throw new Error("User identity missing for upload");
  }

  return linkedinId;
};

export type GetUploadUrlResult =
  | {
      success: true;
      signedUrl: string;
      filename: string;
      originalName: string;
      size: number;
      type: string;
    }
  | { success: false; error: string };

export const getUploadUrl = async (fileInfo: FileInfo, category: string = "portfolio-assets"): Promise<GetUploadUrlResult> => {
  try {
    const linkedinId = await resolveLinkedinId();

    const result = await generateSignedUploadUrl(
      {
        name: fileInfo.name,
        type: fileInfo.type,
        size: fileInfo.size,
      },
      linkedinId,
      category
    );

    return {
      success: true,
      signedUrl: result.signedUrl,
      filename: result.filename,
      originalName: result.originalName,
      size: result.size,
      type: result.type,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("getUploadUrl error:", error);
    return { success: false, error: message };
  }
};

export type FinalizeDirectUploadResult = { success: true; url: string; filename: string } | { success: false; error: string };

export const finalizeDirectUpload = async (
  filename: string,
  category: string = "portfolio-assets"
): Promise<FinalizeDirectUploadResult> => {
  try {
    const { token, scheme } = await getAuth();

    const finalizeResult = await finalizeUpload(filename);
    if (!finalizeResult.success) {
      throw new Error("Failed to finalize upload");
    }

    const backendUrl = getBackendUrl();
    const metadataResponse = await fetch(`${backendUrl}/api/media-metadata/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${scheme} ${token}`,
      },
      body: JSON.stringify({
        filename: finalizeResult.filename,
        url: finalizeResult.url,
        category,
      }),
      cache: "no-store",
    });

    if (!metadataResponse.ok) {
      console.error("Failed to save metadata to backend", {
        status: metadataResponse.status,
        filename: finalizeResult.filename,
        category,
      });
      return {
        success: false,
        error: "Upload completed but we could not save it to your media library. Please try again.",
      };
    }

    return {
      success: true,
      url: finalizeResult.url,
      filename: finalizeResult.filename,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("finalizeDirectUpload error:", error);
    return { success: false, error: message };
  }
};
