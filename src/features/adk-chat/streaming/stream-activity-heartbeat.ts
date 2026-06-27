import type { ContentScope } from "@/src/features/adk-chat/content-scope";

const DEFAULT_LABELS = ["Working with Unibot…", "Thinking about your request…", "Still working on it…", "Almost there…"] as const;

const STUDIO_ASSET_LABELS: Record<string, string[]> = {
  coverletter: [
    "Starting your cover letter…",
    "Reading your application context…",
    "Drafting your cover letter…",
    "Still refining your draft…",
    "Almost there…",
  ],
  coldemail: [
    "Starting your cold email…",
    "Reading your application context…",
    "Drafting your message…",
    "Still refining your draft…",
    "Almost there…",
  ],
  referral: [
    "Starting your referral message…",
    "Reading your application context…",
    "Drafting your message…",
    "Still refining your draft…",
    "Almost there…",
  ],
};

function mapStudioUrlTypeToAssetSection(studioType: string | null | undefined): string | null {
  const normalized = (studioType ?? "").trim().toLowerCase();
  if (normalized === "cover-letter") return "coverletter";
  if (normalized === "cold-email") return "coldemail";
  if (normalized === "referral") return "referral";
  return null;
}

export function resolveStreamHeartbeatLabels(scope: ContentScope | null, pathname: string, studioType?: string | null): readonly string[] {
  const scopedSection = (scope?.section ?? "").trim().toLowerCase();
  if (scope?.domain === "application_asset") {
    const section = scopedSection || mapStudioUrlTypeToAssetSection(studioType) || "";
    if (section in STUDIO_ASSET_LABELS) {
      return STUDIO_ASSET_LABELS[section];
    }
  }
  if (!scopedSection && pathname.startsWith("/uniboard/studio")) {
    const fromUrl = mapStudioUrlTypeToAssetSection(studioType);
    if (fromUrl && fromUrl in STUDIO_ASSET_LABELS) {
      return STUDIO_ASSET_LABELS[fromUrl];
    }
  }
  if (scope?.domain === "content_gen") {
    return ["Opening Content Lab…", "Planning your post…", "Drafting your content…", "Still working on it…", "Almost there…"];
  }
  if (scope?.domain === "linkedin") {
    return [
      "Working on your LinkedIn content…",
      "Reading your profile context…",
      "Drafting updates…",
      "Still working on it…",
      "Almost there…",
    ];
  }
  if (pathname.startsWith("/uniboard/studio")) {
    return DEFAULT_LABELS;
  }
  return DEFAULT_LABELS;
}

type StreamActivityHeartbeatOptions = {
  labels: readonly string[];
  intervalMs?: number;
  onTick: (label: string) => void;
};

/** Fallback label interval when no real SSE activity hint arrives (all browsers). */
export const STREAM_HEARTBEAT_INTERVAL_MS = 5000;

export type StreamActivityHeartbeat = ReturnType<typeof createStreamActivityHeartbeat>;

/** Rotates loading labels while waiting on a buffered SSE response (e.g. local Chrome POST SSE). */
export function createStreamActivityHeartbeat(options: StreamActivityHeartbeatOptions) {
  const intervalMs = options.intervalMs ?? STREAM_HEARTBEAT_INTERVAL_MS;
  let timer: ReturnType<typeof setInterval> | null = null;
  let index = 0;
  let lastRealHintAt = Date.now();
  let activeLabels = options.labels;

  const markRealHint = (): void => {
    lastRealHintAt = Date.now();
  };

  const stop = (): void => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    index = 0;
  };

  const start = (labels?: readonly string[]): void => {
    stop();
    if (labels?.length) {
      activeLabels = labels;
    }
    timer = setInterval(() => {
      if (Date.now() - lastRealHintAt < intervalMs - 200) {
        return;
      }
      const label = activeLabels[index % activeLabels.length];
      index += 1;
      options.onTick(label);
    }, intervalMs);
  };

  return { start, stop, markRealHint };
}
