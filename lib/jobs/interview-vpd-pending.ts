/** One-shot payload so Build VPD can land on `/studio?type=vpd` without `jobId` (avoids prepare-return banner). */

export type PendingInterviewVpdGeneration = {
  applicationId: string;
  role: string;
  company: string;
  description: string;
};

const STORAGE_KEY = "interview-vpd-pending-generation";

export function setPendingInterviewVpdGeneration(payload: PendingInterviewVpdGeneration) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function consumePendingInterviewVpdGeneration(): PendingInterviewVpdGeneration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as PendingInterviewVpdGeneration;
    if (!parsed?.applicationId?.trim() && !parsed?.role?.trim()) return null;
    return {
      applicationId: typeof parsed.applicationId === "string" ? parsed.applicationId.trim() : "",
      role: typeof parsed.role === "string" ? parsed.role : "",
      company: typeof parsed.company === "string" ? parsed.company : "",
      description: typeof parsed.description === "string" ? parsed.description : "",
    };
  } catch {
    return null;
  }
}
