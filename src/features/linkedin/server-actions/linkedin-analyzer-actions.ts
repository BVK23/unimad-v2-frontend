"use server";

import { mapLinkedInAnalyzeResponse } from "@/features/linkedin/api/mappers";
import type { LinkedInAnalysisSnapshot, LinkedInAnalyzeResult } from "@/features/linkedin/types";
import { cookies } from "next/headers";

type AuthResult = { token: string; scheme: "Token" | "Bearer" };

function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined. Add it to your .env.local file.");
  }
  return url.replace(/\/+$/, "");
}

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

function parseErrorBody(rawText: string, status: number): string {
  if (!rawText.trim()) return `Failed to analyze LinkedIn profile (HTTP ${status})`;
  try {
    const data = JSON.parse(rawText) as { message?: unknown; error?: unknown };
    if (typeof data.message === "string" && data.message.trim()) return data.message;
    if (typeof data.error === "string" && data.error.trim()) return data.error;
  } catch {}
  return rawText.slice(0, 300);
}

export async function analyzeLinkedInProfile(): Promise<LinkedInAnalyzeResult> {
  const backendUrl = getBackendUrl();
  const { token, scheme } = await getAuth();

  const response = await fetch(`${backendUrl}/api/linkedin/analyze/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${scheme} ${token}`,
    },
    cache: "no-store",
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(parseErrorBody(rawText, response.status));
  }

  let rawPayload: unknown = {};
  try {
    rawPayload = rawText ? (JSON.parse(rawText) as unknown) : {};
  } catch {
    throw new Error("Invalid response from LinkedIn analyzer");
  }

  return mapLinkedInAnalyzeResponse(rawPayload);
}

export async function fetchLinkedInAnalysis(): Promise<LinkedInAnalysisSnapshot | null> {
  const backendUrl = getBackendUrl();
  const { token, scheme } = await getAuth();

  const response = await fetch(`${backendUrl}/api/linkedin/analysis/`, {
    method: "GET",
    headers: {
      Authorization: `${scheme} ${token}`,
    },
    cache: "no-store",
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(parseErrorBody(rawText, response.status));
  }

  let rawPayload: unknown = {};
  try {
    rawPayload = rawText ? (JSON.parse(rawText) as unknown) : {};
  } catch {
    throw new Error("Invalid response from LinkedIn analysis");
  }

  const body = rawPayload && typeof rawPayload === "object" ? (rawPayload as Record<string, unknown>) : {};
  const analysis = body.analysis;
  const analyzedAt = body.analyzedAt;

  if (analysis == null || typeof analysis !== "object") {
    return null;
  }

  const at = typeof analyzedAt === "string" && analyzedAt.trim().length > 0 ? analyzedAt.trim() : "";
  const hasAnalysis = Boolean(body.hasAnalysis);
  const overallScore = typeof body.overallScore === "number" ? body.overallScore : undefined;
  const sectionScores =
    body.sectionScores && typeof body.sectionScores === "object"
      ? (body.sectionScores as LinkedInAnalysisSnapshot["sectionScores"])
      : undefined;

  const rawProfileContent = body.profileContent;
  let profileContent: LinkedInAnalysisSnapshot["profileContent"];
  if (rawProfileContent && typeof rawProfileContent === "object") {
    const pc = rawProfileContent as Record<string, unknown>;
    profileContent = {
      displayName: typeof pc.displayName === "string" ? pc.displayName : "",
      profilePictureUrl: typeof pc.profilePictureUrl === "string" && pc.profilePictureUrl.trim() ? pc.profilePictureUrl.trim() : null,
      coverPictureUrl: typeof pc.coverPictureUrl === "string" && pc.coverPictureUrl.trim() ? pc.coverPictureUrl.trim() : null,
      headline: typeof pc.headline === "string" ? pc.headline : "",
      about: typeof pc.about === "string" ? pc.about : "",
      experience: Array.isArray(pc.experience) ? pc.experience : [],
      skills: Array.isArray(pc.skills) ? pc.skills : [],
    };
  }

  return {
    result: mapLinkedInAnalyzeResponse(analysis),
    analyzedAt: at,
    hasAnalysis,
    overallScore,
    sectionScores,
    profileContent,
  };
}
