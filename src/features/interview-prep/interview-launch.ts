import type { InterviewPrepContext, InterviewQuestion, InterviewRoundType, InterviewSessionMode } from "./types";

const INTERVIEW_PREP_LAUNCH_KEY = "unimad_interview_prep_launch";

export type StoredInterviewLaunch = {
  context: InterviewPrepContext;
  roundType: InterviewRoundType;
  mode: InterviewSessionMode;
  interviewId?: string;
  questions?: InterviewQuestion[];
};

export function storeInterviewLaunch(payload: StoredInterviewLaunch): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(INTERVIEW_PREP_LAUNCH_KEY, JSON.stringify(payload));
}

export function consumeInterviewLaunch(): StoredInterviewLaunch | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(INTERVIEW_PREP_LAUNCH_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(INTERVIEW_PREP_LAUNCH_KEY);
  try {
    return JSON.parse(raw) as StoredInterviewLaunch;
  } catch {
    return null;
  }
}
