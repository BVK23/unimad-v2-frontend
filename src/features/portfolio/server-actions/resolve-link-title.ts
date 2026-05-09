"use server";

import { load } from "cheerio";
import { cookies } from "next/headers";
import { hostnameLooksLikeWebAddress, normalizeExternalUrl } from "../utils/external-url";

export type ResolveLinkTitleResult = { ok: true; title: string } | { ok: false; error: string };

const decodeBasicEntities = (s: string) => {
  if (!s.includes("&")) return s;
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
};

const extractTitleFromHtml = (html: string): string | null => {
  const $ = load(html);
  const fromMeta = (selector: string) => {
    const raw = $(selector).attr("content")?.trim();
    return raw ? decodeBasicEntities(raw) : null;
  };

  const og = fromMeta('meta[property="og:title"]');
  if (og) return og;

  const tw = fromMeta('meta[name="twitter:title"]');
  if (tw) return tw;

  const named = fromMeta('meta[name="title"]');
  if (named) return named;

  const doc = $("title").first().text().replace(/\s+/g, " ").trim();
  return doc ? decodeBasicEntities(doc) : null;
};

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
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "User-Agent": "UnimadPortfolioBot/1.0",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return { ok: false, error: "Could not load page" };
    }

    const buf = await res.arrayBuffer();
    const maxBytes = 512 * 1024;
    const slice = buf.byteLength > maxBytes ? buf.slice(0, maxBytes) : buf;
    const html = new TextDecoder("utf-8", { fatal: false }).decode(slice);

    const title = extractTitleFromHtml(html);
    if (!title) {
      return { ok: false, error: "No title found" };
    }

    return { ok: true, title };
  } catch {
    return { ok: false, error: "Failed to fetch URL" };
  }
}
