import type { ContentGenAssetItem } from "@/features/content-lab/types";

export type ContentGenModalPost = {
  id: string;
  content: string;
  topic: string;
  date: string;
  stats: string;
  status: "Posted" | "Draft";
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

function modalFilterStatus(a: ContentGenAssetItem): "Posted" | "Draft" {
  if (a.status === "Posted") {
    return "Posted";
  }
  return "Draft";
}

export function mapContentGenToModalPost(a: ContentGenAssetItem): ContentGenModalPost {
  const raw = a.content?.trim() ?? "";
  const content = raw || a.topic || "(Empty draft)";
  return {
    id: String(a.id),
    content,
    topic: a.topic ?? "",
    date: formatAssetDate(a),
    stats: "—",
    status: modalFilterStatus(a),
  };
}
