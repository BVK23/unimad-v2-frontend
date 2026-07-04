"use server";

import { authedFetch } from "@/lib/authed-fetch";
import type {
  InterviewDetailResponse,
  InterviewPrepListItem,
  InterviewRoundType,
  StartInterviewResponse,
  VoiceAnalysisResult,
  VoiceInterviewConfig,
  VoiceTranscriptEntry,
} from "../types";

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

export async function rescoreInterviewRound(input: {
  interviewId: string;
  roundType: InterviewRoundType;
}): Promise<{ message: string; round_type: string }> {
  const res = await authedFetch("/api/interviews/rescore/", {
    method: "POST",
    body: JSON.stringify({
      interview_id: input.interviewId,
      round_type: input.roundType,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to recalculate interview score");
  }
  return data as { message: string; round_type: string };
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
