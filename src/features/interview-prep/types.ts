import type { Job } from "@/types/jobs";

export type InterviewRoundType = "screening" | "technical" | "behavioral";

export type InterviewSessionMode = "questions" | "live";

export interface InterviewPrepContext {
  company?: string;
  role?: string;
  jobDescription?: string;
  applicationId?: string;
}

export interface StartInterviewFromJobPayload {
  job: Job;
  roundType: InterviewRoundType;
  mode: InterviewSessionMode;
  /** Resolved backend application_id (after ensure/create). */
  applicationId?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
}

export interface StartInterviewResponse {
  id: string;
  questions: InterviewQuestion[];
  round_type: InterviewRoundType;
}

export interface InterviewRoundQuestion {
  id: string;
  question: string;
  answer: string;
  score: number | null;
  feedback: string | null;
  improvement_tip: string | null;
}

export interface InterviewRoundData {
  mode: "guided" | "voice";
  status: "in_progress" | "completed";
  started_at?: string;
  completed_at?: string | null;
  overall_score: number | null;
  overall_feedback: string | null;
  questions: InterviewRoundQuestion[];
  transcript?: VoiceTranscriptEntry[] | null;
  history?: InterviewRoundData[];
}

export interface InterviewPrepListItem {
  interview_id: string;
  role: string | null;
  company: string | null;
  job_description: string | null;
  score: number | null;
  rounds: string[];
  active_round: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VoiceTranscriptEntry {
  role: "user" | "model";
  text: string;
  timestamp?: number;
}

export interface VoiceInterviewConfig {
  role: string;
  company: string;
  jobDescription: string;
  roundType: InterviewRoundType;
  interviewId?: string;
}

export interface VoiceAnalysisQuestion {
  question: string;
  userAnswer: string;
  feedback: string;
  score: number;
  improvementTip?: string;
}

export interface VoiceAnalysisResult {
  overallScore: number;
  overallFeedback: string;
  questions: VoiceAnalysisQuestion[];
}

export interface InterviewDetailResponse {
  interview_id: string;
  application_id: string | null;
  round_types: string[];
  active_round: string | null;
  rounds_data: Record<string, InterviewRoundData>;
  company: string;
  role: string;
  job_description: string;
}

export interface InterviewAutoStart {
  roundType: InterviewRoundType;
  mode: InterviewSessionMode;
}
