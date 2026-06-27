"use server";

import { mapLinkedInAnalyzeResponse } from "@/features/linkedin/api/mappers";
import type {
  LinkedInAnalysisSnapshot,
  LinkedInAnalyzeResult,
  LinkedInAnalyzerErrorCode,
  LinkedInAnalyzerResult,
} from "@/features/linkedin/types";
import { linkedInAnalyzerErrorMessage } from "@/features/linkedin/utils/linkedin-analyzer-errors";
import { messageFromFailedResponse, sanitizeUserFacingError } from "@/utils/message-from-failed-response";
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

function parseErrorBody(rawText: string, status: number): { message: string; code?: LinkedInAnalyzerErrorCode } {
  let jsonError: string | undefined;
  let code: LinkedInAnalyzerErrorCode | undefined;
  try {
    const data = JSON.parse(rawText) as { message?: unknown; error?: unknown; code?: unknown };
    code = typeof data.code === "string" && data.code.trim() ? (data.code.trim() as LinkedInAnalyzerErrorCode) : undefined;
    if (typeof data.message === "string" && data.message.trim()) {
      jsonError = data.message;
    } else if (typeof data.error === "string" && data.error.trim()) {
      jsonError = data.error;
    }
  } catch {
    // not JSON — fall through to messageFromFailedResponse
  }

  const message = messageFromFailedResponse(status, rawText, jsonError);
  if (
    message &&
    message !== "Request failed. Please try again." &&
    message !== "Something went wrong on our end. Please try again in a moment."
  ) {
    return { message, code };
  }
  if (code) {
    return { message: linkedInAnalyzerErrorMessage("", code), code };
  }
  return { message: message || `Failed to analyze LinkedIn profile (HTTP ${status})` };
}

function failure(message: string, code?: LinkedInAnalyzerErrorCode): LinkedInAnalyzerResult<never> {
  return {
    success: false,
    error: linkedInAnalyzerErrorMessage(message, code),
    code,
  };
}

export async function analyzeLinkedInProfile(): Promise<LinkedInAnalyzerResult<LinkedInAnalyzeResult>> {
  try {
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
      const parsed = parseErrorBody(rawText, response.status);
      return failure(parsed.message, parsed.code);
    }

    let rawPayload: unknown = {};
    try {
      rawPayload = rawText ? (JSON.parse(rawText) as unknown) : {};
    } catch {
      return failure("Invalid response from LinkedIn analyzer");
    }

    return {
      success: true,
      data: mapLinkedInAnalyzeResponse(rawPayload),
    };
  } catch (err) {
    const message = sanitizeUserFacingError(
      err instanceof Error ? err.message : "Failed to analyze LinkedIn profile. Please try again.",
      "Failed to analyze LinkedIn profile. Please try again."
    );
    return failure(message);
  }
}

export async function fetchLinkedInAnalysis(): Promise<LinkedInAnalyzerResult<LinkedInAnalysisSnapshot | null>> {
  try {
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
    if (response.status === 404) {
      return { success: true, data: null };
    }
    if (!response.ok) {
      const parsed = parseErrorBody(rawText, response.status);
      return failure(parsed.message, parsed.code);
    }

    let rawPayload: unknown = {};
    try {
      rawPayload = rawText ? (JSON.parse(rawText) as unknown) : {};
    } catch {
      return failure("Invalid response from LinkedIn analysis");
    }

    const body = rawPayload && typeof rawPayload === "object" ? (rawPayload as Record<string, unknown>) : {};
    const analysis = body.analysis;
    const analyzedAt = body.analyzedAt;

    if (analysis == null || typeof analysis !== "object") {
      return { success: true, data: null };
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
      success: true,
      data: {
        result: mapLinkedInAnalyzeResponse(analysis),
        analyzedAt: at,
        hasAnalysis,
        overallScore,
        sectionScores,
        profileContent,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load your LinkedIn analysis.";
    return failure(message);
  }
}

export type UpdateLinkedInProfileContentInput = {
  headline?: string;
  about?: string;
  experience?: unknown[];
  skills?: unknown[];
};

export async function updateLinkedInProfileContent(
  input: UpdateLinkedInProfileContentInput
): Promise<LinkedInAnalyzerResult<LinkedInAnalysisSnapshot>> {
  try {
    const backendUrl = getBackendUrl();
    const { token, scheme } = await getAuth();

    const response = await fetch(`${backendUrl}/api/linkedin/profile/`, {
      method: "PATCH",
      headers: {
        Authorization: `${scheme} ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const rawText = await response.text();
    if (!response.ok) {
      const parsed = parseErrorBody(rawText, response.status);
      return failure(parsed.message, parsed.code);
    }

    let rawPayload: unknown = {};
    try {
      rawPayload = rawText ? (JSON.parse(rawText) as unknown) : {};
    } catch {
      return failure("Invalid response from LinkedIn profile update");
    }

    const body = rawPayload && typeof rawPayload === "object" ? (rawPayload as Record<string, unknown>) : {};
    const analysis = body.analysis;
    const analyzedAt = body.analyzedAt;

    if (analysis == null || typeof analysis !== "object") {
      return failure("LinkedIn profile update did not return analysis");
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
      success: true,
      data: {
        result: mapLinkedInAnalyzeResponse(analysis),
        analyzedAt: at,
        hasAnalysis,
        overallScore,
        sectionScores,
        profileContent,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save your LinkedIn profile edits.";
    return failure(message);
  }
}
