import { COACH_ACT_AS_COOKIE, COACH_ACT_AS_HEADER } from "@/constants/coach-act-as";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const getBackendUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
  }
  return url.replace(/\/+$/, "");
};

const looksLikeJwt = (value: string): boolean => /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value.trim());

/**
 * Proxy multipart uploads to Django without passing file bytes through a Server Action
 * (Next.js Server Actions default to a ~1MB body limit).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get("_ut")?.value ?? request.cookies.get("__Host-ut")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const incomingForm = await request.formData();
  const file = incomingForm.get("file");
  const category = incomingForm.get("category");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const outbound = new FormData();
  outbound.append("file", file);
  outbound.append("category", typeof category === "string" && category.trim() ? category : "portfolio-assets");

  const headers: Record<string, string> = {
    Authorization: `${looksLikeJwt(token) ? "Bearer" : "Token"} ${token}`,
  };

  const actAsStudentId = request.cookies.get(COACH_ACT_AS_COOKIE)?.value?.trim();
  if (actAsStudentId && /^\d+$/.test(actAsStudentId)) {
    headers[COACH_ACT_AS_HEADER] = actAsStudentId;
  }

  try {
    const backendResponse = await fetch(`${getBackendUrl()}/api/media-upload/`, {
      method: "POST",
      headers,
      body: outbound,
      cache: "no-store",
    });

    const bodyText = await backendResponse.text();
    let payload: { error?: string; message?: string; content?: { url?: string } } = {};
    try {
      payload = JSON.parse(bodyText) as typeof payload;
    } catch {
      payload = {};
    }

    if (!backendResponse.ok) {
      return NextResponse.json({ error: payload.error || payload.message || "Failed to upload media" }, { status: backendResponse.status });
    }

    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    console.error("[api/media-upload] proxy failed:", error);
    return NextResponse.json({ error: "Failed to upload media" }, { status: 502 });
  }
}
