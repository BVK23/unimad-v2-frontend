export type UnimadNavigationAction = {
  path: string;
  label: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/**
 * ADK/Vertex sometimes wrap tool returns (`result`), stringify JSON, or nest payloads.
 * Normalize to a single record before reading ui.navigation / resume_id.
 */
export function coerceToolResponseRecord(response: unknown): Record<string, unknown> | null {
  if (response == null) return null;

  if (typeof response === "string") {
    const trimmed = response.trim();
    if (!trimmed) return null;
    try {
      return coerceToolResponseRecord(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  const root = asRecord(response);
  if (!root) return null;

  const nested = root.result ?? root.data ?? root.payload;
  if (nested != null && nested !== root) {
    const inner = coerceToolResponseRecord(nested);
    if (inner && (inner.ui || inner.status || inner.resume_id || inner.path)) {
      return inner;
    }
  }

  return root;
}

function navigationFromUi(response: Record<string, unknown>): UnimadNavigationAction | null {
  const ui = asRecord(response.ui);
  if (!ui) return null;
  const nav = asRecord(ui.navigation);
  if (!nav) return null;
  const path = nav.path;
  const label = nav.label;
  if (typeof path === "string" && path.trim() && typeof label === "string" && label.trim()) {
    return { path: path.trim(), label: label.trim() };
  }
  return null;
}

function navigationFromResumeId(response: Record<string, unknown>): UnimadNavigationAction | null {
  const status = typeof response.status === "string" ? response.status.toLowerCase() : "";
  if (status && status !== "ok" && status !== "duplicate") return null;

  const resumeId = response.resume_id ?? response.resumeId;
  if (resumeId == null || String(resumeId).trim() === "") return null;

  const id = String(resumeId).trim();
  return {
    path: `/uniboard/resume?id=${encodeURIComponent(id)}`,
    label: "Open tailored resume",
  };
}

/**
 * Parse navigation button from tool responses.
 * Prefers ``ui.navigation``, then resume_id deep-link, then top-level path/label.
 */
export function parseUnimadNavigationFromToolResponse(response: unknown): UnimadNavigationAction | null {
  const normalized = coerceToolResponseRecord(response);
  if (!normalized) return null;

  const fromUi = navigationFromUi(normalized);
  if (fromUi) return fromUi;

  const fromResume = navigationFromResumeId(normalized);
  if (fromResume) return fromResume;

  if (normalized.status !== "ok") return null;

  const path = normalized.path;
  const label = normalized.label;
  if (typeof path === "string" && path.trim()) {
    return {
      path: path.trim(),
      label: typeof label === "string" && label.trim() ? label.trim() : "Go there",
    };
  }

  return null;
}
