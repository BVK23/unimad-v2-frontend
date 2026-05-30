import { readFileSync } from "fs";
import { cookies } from "next/headers";
import path from "path";

const DOC_FILES: Record<string, string> = {
  "design-system": "design-system.html",
  "brand-book": "brand-book.html",
};

export const INTERNAL_DESIGN_DOC_SLUGS = Object.keys(DOC_FILES) as (keyof typeof DOC_FILES)[];

export function getInternalDesignDocHtml(slug: string): string | null {
  const fileName = DOC_FILES[slug];
  if (!fileName) return null;
  const filePath = path.join(process.cwd(), "docs/internal", fileName);
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function isLocalhostHost(host: string): boolean {
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
}

export async function canAccessInternalDesignDocs(hostOrRequest: Request | string): Promise<boolean> {
  const host = typeof hostOrRequest === "string" ? hostOrRequest : (hostOrRequest.headers.get("host") ?? "");
  if (isLocalhostHost(host)) return true;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("_ut")?.value;
  if (!accessToken) return false;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) return false;

  try {
    const res = await fetch(`${backendUrl}/api/user-data/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { is_team_member?: boolean };
    return Boolean(data.is_team_member);
  } catch {
    return false;
  }
}
