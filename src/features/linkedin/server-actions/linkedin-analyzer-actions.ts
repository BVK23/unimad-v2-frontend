"use server";

import { mapLinkedInAnalyzeResponse } from "@/features/linkedin/api/mappers";
import type {
  LinkedInAnalysisSnapshot,
  LinkedInAnalyzeResult,
  LinkedInAnalyzerErrorCode,
  LinkedInAnalyzerResult,
} from "@/features/linkedin/types";
import { linkedInAnalyzerErrorMessage } from "@/features/linkedin/utils/linkedin-analyzer-errors";
import { authedFetch } from "@/lib/authed-fetch";
import { messageFromFailedResponse, sanitizeUserFacingError } from "@/utils/message-from-failed-response";

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

function mapAnalysisSnapshotBody(body: Record<string, unknown>): LinkedInAnalysisSnapshot | null {
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

export async function analyzeLinkedInProfile(): Promise<LinkedInAnalyzerResult<LinkedInAnalyzeResult>> {
  try {
    const response = await authedFetch("/api/linkedin/analyze/", { method: "POST" });

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
    const response = await authedFetch("/api/linkedin/analysis/", { method: "GET" });

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
    const snapshot = mapAnalysisSnapshotBody(body);
    return { success: true, data: snapshot };
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
    const response = await authedFetch("/api/linkedin/profile/", {
      method: "PATCH",
      body: JSON.stringify(input),
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
    const snapshot = mapAnalysisSnapshotBody(body);
    if (!snapshot) {
      return failure("LinkedIn profile update did not return analysis");
    }

    return { success: true, data: snapshot };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save your LinkedIn profile edits.";
    return failure(message);
  }
}
