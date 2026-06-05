"use server";

import { cookies } from "next/headers";
import { hostnameLooksLikeWebAddress, normalizeExternalUrl } from "../utils/external-url";

export type ResolveLinkTitleResult = { ok: true; title: string; iconUrl?: string } | { ok: false; error: string };

const getBackendUrl = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
  }
  return url.replace(/\/+$/, "");
};

const looksLikeJwt = (value: string) => /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value.trim());

export async function resolveLinkTitle(rawUrl: string): Promise<ResolveLinkTitleResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;
  if (!token) {
    return { ok: false, error: "Unauthorized" };
  }

  const url = normalizeExternalUrl(rawUrl);
  if (!url) {
    return { ok: false, error: "Invalid URL" };
  }

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return { ok: false, error: "Invalid URL" };
  }
  if (!hostnameLooksLikeWebAddress(host)) {
    return { ok: false, error: "Invalid URL" };
  }

  try {
    const backendUrl = getBackendUrl();
    const authHeader = `${looksLikeJwt(token) ? "Bearer" : "Token"} ${token}`;
    const res = await fetch(`${backendUrl}/api/portfolio/link-metadata/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ url }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      title?: string;
      favicon?: string;
      error?: string;
    };

    if (!res.ok || payload.ok === false) {
      return { ok: false, error: payload.error ?? "Could not load page metadata" };
    }

    const title = (payload.title ?? "").trim();
    if (!title) {
      return { ok: false, error: "No title found" };
    }

    const iconUrl = (payload.favicon ?? "").trim() || undefined;
    return { ok: true, title, iconUrl };
  } catch {
    return { ok: false, error: "Failed to fetch URL" };
  }
}
