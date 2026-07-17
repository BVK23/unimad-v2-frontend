import { VPD_FEATURE_ENABLED } from "@/constants/feature-flags";
import { setPendingInterviewVpdGeneration } from "@/lib/jobs/interview-vpd-pending";
import type { Job } from "@/types/jobs";

const STORAGE_KEY = "interview-vpd-prompts-v1";

/** `true` = show red dot while in Interviewing; `false` = dismissed until next Interviewing cycle */
type PromptMap = Record<string, boolean>;

function readPrompts(): PromptMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PromptMap) : {};
  } catch {
    return {};
  }
}

function writePrompts(map: PromptMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Show indicator when job is Interviewing and prompt has not been dismissed for this cycle. */
export function shouldShowInterviewVpdPrompt(job: Job): boolean {
  if (!VPD_FEATURE_ENABLED) return false;
  if (job.applicationStatus !== "interviewing") return false;
  const map = readPrompts();
  return map[job.id] !== false;
}

/** Called when a job newly enters the Interviewing column. */
export function activateInterviewVpdPrompt(jobId: string) {
  const map = readPrompts();
  map[jobId] = true;
  writePrompts(map);
}

/** Called when a job leaves Interviewing for Applied — hides dot until next Interviewing entry. */
export function dismissInterviewVpdPrompt(jobId: string) {
  const map = readPrompts();
  map[jobId] = false;
  writePrompts(map);
}

/** Ensure tracker jobs already in Interviewing show the dot on first visit. */
export function syncInterviewVpdPrompts(jobs: Job[]) {
  const map = readPrompts();
  let changed = false;
  for (const job of jobs) {
    if (job.applicationStatus === "interviewing" && map[job.id] === undefined) {
      map[job.id] = true;
      changed = true;
    }
  }
  if (changed) writePrompts(map);
}

/**
 * Studio navigation for Build VPD from the interview-stage modal.
 * Omits `jobId` so Studio does not open the prepare-return banner.
 * Application context is stashed for one-shot generation after redirect.
 */
export function buildInterviewVpdStudioContext(job: Job) {
  setPendingInterviewVpdGeneration({
    applicationId: job.id,
    role: job.role ?? "",
    company: job.company ?? "",
    description: job.description ?? "",
  });
  return {
    type: "vpd" as const,
    company: job.company,
    role: job.role,
    description: job.description,
    fromInterviewVpd: true,
  };
}
