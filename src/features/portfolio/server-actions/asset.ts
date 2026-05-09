"use server";

import { cookies } from "next/headers";

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

export type UploadMediaResponse = {
  message?: string;
  content?: {
    url: string;
    blob_name?: string;
    id?: number;
  };
  error?: string;
};

export const uploadMedia = async (formData: FormData): Promise<UploadMediaResponse> => {
  const { token, scheme } = await getAuth();
  const backendUrl = getBackendUrl();

  const response = await fetch(`${backendUrl}/api/media-upload/`, {
    method: "POST",
    headers: {
      Authorization: `${scheme} ${token}`,
    },
    body: formData,
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as UploadMediaResponse;

  if (!response.ok) {
    return { error: data?.error || "Failed to upload media" };
  }

  return data;
};
