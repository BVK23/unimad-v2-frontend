import type { PrepareNavigateTarget } from "@/lib/jobs/prepare-application-url";
import type { ContentGeneratorType } from "@/types/jobs";

export type PrepareApplicationTab = Extract<ContentGeneratorType, "resume" | "cover-letter" | "cold-email" | "vpd">;

export type PrepareApplicationReturnSession = {
  jobId: string;
  tab: PrepareApplicationTab;
  company: string;
  role: string;
  navigate: PrepareNavigateTarget;
};

const RETURN_SESSION_KEY = "prepare-application-return-session";

function isPrepareTab(tab: string): tab is PrepareApplicationTab {
  return tab === "resume" || tab === "cover-letter" || tab === "cold-email" || tab === "vpd";
}

export function setPrepareReturnSession(session: PrepareApplicationReturnSession) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RETURN_SESSION_KEY, JSON.stringify(session));
}

export function getPrepareReturnSession(): PrepareApplicationReturnSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RETURN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PrepareApplicationReturnSession;
    if (!parsed?.jobId || !isPrepareTab(parsed.tab)) return null;
    return {
      ...parsed,
      navigate: parsed.navigate === "jobs" || parsed.navigate === "tracker" ? parsed.navigate : "tracker",
    };
  } catch {
    return null;
  }
}

export function clearPrepareReturnSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RETURN_SESSION_KEY);
}

const RETURN_CONTENT_KEY = "prepare-application-return-content";

export type PrepareReturnContentSnapshot = {
  assetId: string;
  kind: "cover-letter" | "cold-email";
  content: string;
};

/** Stash latest editor content so Prepare can show it immediately after navigation. */
export function setPrepareReturnContentSnapshot(snapshot: PrepareReturnContentSnapshot) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RETURN_CONTENT_KEY, JSON.stringify(snapshot));
}

/** Read and clear a one-time content snapshot saved during Save & Return. */
export function consumePrepareReturnContentSnapshot(assetId: string, kind: "cover-letter" | "cold-email"): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RETURN_CONTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PrepareReturnContentSnapshot;
    if (parsed.assetId !== assetId || parsed.kind !== kind) return null;
    sessionStorage.removeItem(RETURN_CONTENT_KEY);
    return parsed.content ?? null;
  } catch {
    return null;
  }
}

export function prepareTabLabel(tab: PrepareApplicationTab): string {
  switch (tab) {
    case "resume":
      return "Resume";
    case "cover-letter":
      return "Cover letter";
    case "cold-email":
      return "Cold email";
    case "vpd":
      return "Value prop doc";
    default:
      return tab;
  }
}
