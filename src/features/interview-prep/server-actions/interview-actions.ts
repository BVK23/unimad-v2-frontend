"use server";

import { cookies } from "next/headers";
import type {
  InterviewDetailResponse,
  InterviewPrepListItem,
  InterviewRoundType,
  StartInterviewResponse,
  VoiceAnalysisResult,
  VoiceInterviewConfig,
  VoiceTranscriptEntry,
} from "../types";

function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined.");
  }
  return url.replace(/\/+$/, "");
}

function looksLikeJwt(value: string): boolean {
  return /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value.trim());
}

async function getAuth(): Promise<{ token: string; scheme: "Token" | "Bearer" }> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;
  if (!cookieToken) {
    throw new Error("Unauthorized");
  }
  return { token: cookieToken, scheme: looksLikeJwt(cookieToken) ? "Bearer" : "Token" };
}

async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { token, scheme } = await getAuth();
  return fetch(`${getBackendUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `${scheme} ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });
}

export async function fetchInterviewSessions(): Promise<InterviewPrepListItem[]> {
  const res = await authedFetch("/api/interviews/");
  if (res.status === 404) return [];
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to fetch interviews");
  }
  const json = await res.json();
  if (Array.isArray(json)) return json;
  if (json?.assetData && Array.isArray(json.assetData)) return json.assetData;
  return [];
}

export async function fetchInterviewDetail(interviewId: string): Promise<InterviewDetailResponse> {
  const res = await authedFetch(`/api/interviews/result/?id=${encodeURIComponent(interviewId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to fetch interview");
  }
  return res.json();
}

export async function startInterviewSession(input: {
  role: string;
  company: string;
  jobDescription: string;
  roundType: InterviewRoundType;
  interviewId?: string;
  applicationId?: string;
}): Promise<StartInterviewResponse> {
  const validRounds: InterviewRoundType[] = ["screening", "technical", "behavioral"];
  if (!validRounds.includes(input.roundType)) {
    throw new Error("Invalid round type");
  }

  const body = input.applicationId
    ? { application_id: input.applicationId, round_type: input.roundType }
    : input.interviewId
      ? { id: input.interviewId, round_type: input.roundType }
      : {
          role: input.role,
          company: input.company,
          job_description: input.jobDescription,
          round_type: input.roundType,
        };

  const res = await authedFetch("/api/interviews/start/", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to start interview");
  }
  return res.json();
}

export async function saveInterviewAnswer(input: {
  interviewId: string;
  questionId: string;
  roundType: InterviewRoundType;
  answer: string;
  isLastQuestion: boolean;
}): Promise<{ message: string }> {
  const res = await authedFetch("/api/interviews/save-answer/", {
    method: "POST",
    body: JSON.stringify({
      interview_id: input.interviewId,
      question_id: input.questionId,
      round_type: input.roundType,
      answer: input.answer,
      is_last_question: input.isLastQuestion,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to save answer");
  }
  return res.json();
}

export async function analyzeVoiceInterview(input: {
  transcript: VoiceTranscriptEntry[];
  config: VoiceInterviewConfig;
  interviewId?: string;
}): Promise<{ interview_id: string; analysis: VoiceAnalysisResult; round_type: string }> {
  const res = await authedFetch("/api/interviews/analyze-voice/", {
    method: "POST",
    body: JSON.stringify({
      transcript: input.transcript,
      config: input.config,
      interview_id: input.interviewId ?? input.config.interviewId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to analyze voice interview");
  }
  return res.json();
}

export async function deleteInterviewSession(interviewId: string): Promise<void> {
  const res = await authedFetch(`/api/interviews/${encodeURIComponent(interviewId)}/delete/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to delete interview");
  }
}
