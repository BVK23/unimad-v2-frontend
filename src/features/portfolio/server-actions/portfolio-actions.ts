"use server";

import { cookies } from "next/headers";

function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined. Add it to your .env.local file.");
  }

  return url.replace(/\/+$/, "");
}

function getPublicAssetAuthSecret(): string {
  const secret = process.env.UNIMAD_PUBLIC_ASSET_SECRET ?? process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "UNIMAD_PUBLIC_ASSET_SECRET or JWT_SECRET is not defined. Set one to match the backend SECRET_KEY for public portfolio URLs."
    );
  }

  return secret;
}

type AuthResult = { token: string; scheme: "Token" | "Bearer" };

function looksLikeJwt(value: string): boolean {
  return /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value.trim());
}

async function getAuth(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;

  if (!cookieToken) {
    throw new Error("Unauthorized");
  }

  return {
    token: cookieToken,
    scheme: looksLikeJwt(cookieToken) ? "Bearer" : "Token",
  };
}

async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const backendUrl = getBackendUrl();
  const { token, scheme } = await getAuth();

  return fetch(`${backendUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `${scheme} ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });
}

export async function fetchPortfolioContent(): Promise<{ assetData?: Record<string, unknown> }> {
  const res = await authedFetch("/api/portfolio/");

  if (res.status === 404) {
    return {};
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Failed to fetch portfolio");
  }

  return res.json();
}

export async function createInitialPortfolio(body: Record<string, unknown> = {}): Promise<{ assetData: Record<string, unknown> }> {
  const res = await authedFetch("/api/portfolio/create-initial/", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Failed to create portfolio");
  }

  return res.json();
}

export async function createPortfolioFromBase(body: Record<string, unknown> = {}): Promise<{ assetData: Record<string, unknown> }> {
  const res = await authedFetch("/api/portfolio/create/", {
    method: "POST",
    body: JSON.stringify({
      clone_from_base: true,
      ...body,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Failed to create portfolio from base");
  }

  return res.json();
}

export async function updatePortfolioContent(body: Record<string, unknown>): Promise<{
  message: string;
  portfolio: Record<string, unknown>;
}> {
  const res = await authedFetch("/api/portfolio/update/", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Failed to update portfolio");
  }

  return res.json();
}

export type PublishPortfolioResult = { ok: true; slug: string } | { ok: false; error: string; error_code?: string };

export async function publishPortfolioAsset(content: Record<string, unknown>, slug: string): Promise<PublishPortfolioResult> {
  const trimmed = typeof slug === "string" ? slug.trim() : "";
  if (!trimmed) {
    return { ok: false, error: "Please enter a link name" };
  }

  const res = await authedFetch("/api/publish-asset/", {
    method: "POST",
    body: JSON.stringify({
      assetType: "portfolio",
      content,
      slug: trimmed,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { slug?: string; error?: string; error_code?: string };

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error ?? "Failed to publish portfolio",
      error_code: data?.error_code,
    };
  }

  return { ok: true, slug: data.slug ?? trimmed };
}

export type FetchPublicPortfolioResult = { ok: true; assetData: Record<string, unknown> } | { ok: false; error: string; status: number };

export async function fetchPublicPortfolioBySlug(portfolioSlug: string): Promise<FetchPublicPortfolioResult> {
  const backendUrl = getBackendUrl();
  const secret = getPublicAssetAuthSecret();
  const url = `${backendUrl}/api/public-asset-data/?assetType=${encodeURIComponent("portfolio")}&slug=${encodeURIComponent(portfolioSlug)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Unimad-Auth": secret,
    },
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as { assetData?: Record<string, unknown>; error?: string };

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error ?? "Could not load this public portfolio",
      status: res.status,
    };
  }

  if (!data.assetData || typeof data.assetData !== "object") {
    return { ok: false, error: "No portfolio data was returned", status: 404 };
  }

  return { ok: true, assetData: data.assetData };
}
