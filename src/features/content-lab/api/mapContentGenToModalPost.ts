import type { ContentGenAssetItem } from "@/features/content-lab/types";

export type ContentGenModalPost = {
  id: string;
  content: string;
  topic: string;
  mood?: string;
  date: string;
  stats: string;
  status: "Posted" | "Draft" | "Scheduled";
};

function formatAssetDate(a: ContentGenAssetItem): string {
  try {
    if (a.status === "Scheduled" && a.dateScheduled) {
      const d = new Date(a.dateScheduled);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
      }
    }
    if (a.status === "Posted" && a.datePosted) {
      const d = new Date(a.datePosted);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
      }
    }
    if (a.created_at) {
      const d = new Date(a.created_at);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
      }
    }
  } catch {
    // fall through
  }
  return "—";
}

function modalFilterStatus(a: ContentGenAssetItem): "Posted" | "Draft" | "Scheduled" {
  if (a.status === "Posted") return "Posted";
  if (a.status === "Scheduled") return "Scheduled";
  return "Draft";
}

export function mapContentGenToModalPost(a: ContentGenAssetItem): ContentGenModalPost {
  const raw = a.content?.trim() ?? "";
  const content = raw || a.topic || "(Empty draft)";
  return {
    id: String(a.id),
    content,
    topic: a.topic?.trim() ?? "",
    mood: a.mood?.trim() || undefined,
    date: formatAssetDate(a),
    stats: "—",
    status: modalFilterStatus(a),
  };
}
