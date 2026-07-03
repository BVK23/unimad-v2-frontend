"use server";

import { COACH_ACT_AS_COOKIE, COACH_ACT_AS_HEADER, COACH_ACT_AS_NAME_COOKIE, type CoachActAsSession } from "@/constants/coach-act-as";
import { cookies } from "next/headers";

function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
  return url.replace(/\/+$/, "");
}

type AuthResult = { token: string; scheme: "Token" | "Bearer" };

function looksLikeJwt(value: string): boolean {
  return /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value.trim());
}

async function getAuth(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;
  if (!cookieToken) throw new Error("Unauthorized");
  return { token: cookieToken, scheme: looksLikeJwt(cookieToken) ? "Bearer" : "Token" };
}

function getAuthCookieBaseOptions() {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  const isLocal = backend.includes("localhost") || backend.includes("127.0.0.1");
  if (isLocal) return { path: "/", httpOnly: true, sameSite: "lax" as const };
  const domain = process.env.AUTH_COOKIE_DOMAIN?.trim();
  return {
    path: "/",
    httpOnly: true,
    sameSite: "none" as const,
    secure: true,
    ...(domain ? { domain } : {}),
  };
}

export async function readCoachActAsSession(): Promise<CoachActAsSession | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get(COACH_ACT_AS_COOKIE)?.value?.trim();
  if (!id || !/^\d+$/.test(id)) return null;
  const name = cookieStore.get(COACH_ACT_AS_NAME_COOKIE)?.value?.trim() ?? "Student";
  return { studentProfileId: id, studentDisplayName: decodeURIComponent(name) };
}

export async function startCoachActAsSession(studentProfileId: string, studentDisplayName: string): Promise<void> {
  const id = String(studentProfileId).trim();
  if (!/^\d+$/.test(id)) throw new Error("Invalid student profile id");
  const cookieStore = await cookies();
  const base = getAuthCookieBaseOptions();
  cookieStore.set(COACH_ACT_AS_COOKIE, id, base);
  cookieStore.set(COACH_ACT_AS_NAME_COOKIE, encodeURIComponent(studentDisplayName.trim() || "Student"), base);
  console.info("[coach-act-as] session started", { studentProfileId: id, studentDisplayName });
}

export async function clearCoachActAsSession(): Promise<void> {
  const cookieStore = await cookies();
  const base = getAuthCookieBaseOptions();
  cookieStore.set(COACH_ACT_AS_COOKIE, "", { ...base, maxAge: 0 });
  cookieStore.set(COACH_ACT_AS_NAME_COOKIE, "", { ...base, maxAge: 0 });
  console.info("[coach-act-as] session cleared");
}

/** Server-side authenticated fetch — attaches coach act-as header when cookie is set. */
export async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const backendUrl = getBackendUrl();
  const { token, scheme } = await getAuth();
  const actAs = await readCoachActAsSession();
  const headers: Record<string, string> = {
    Authorization: `${scheme} ${token}`,
    ...(options.headers as Record<string, string> | undefined),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }
  if (actAs?.studentProfileId) {
    headers[COACH_ACT_AS_HEADER] = actAs.studentProfileId;
    console.info("[coach-act-as] authedFetch header", {
      path,
      studentProfileId: actAs.studentProfileId,
    });
  }
  return fetch(`${backendUrl}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
}
