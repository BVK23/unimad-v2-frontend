export type UnimadNavigationAction = {
  path: string;
  label: string;
  /** When set, FE may run a special flow instead of plain navigation. */
  action?: "portfolio_regenerate" | "vpd_generate";
  confirm?: boolean;
  confirm_message?: string;
  /** VPD generate payload (from suggest_unimad_navigation feature=vpd_generate). */
  role?: string;
  company?: string;
  job_description?: string;
  application_id?: string;
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
    const action = nav.action === "portfolio_regenerate" || nav.action === "vpd_generate" ? nav.action : undefined;
    const confirm = nav.confirm === true;
    const confirmMessage = typeof nav.confirm_message === "string" && nav.confirm_message.trim() ? nav.confirm_message.trim() : undefined;
    const role = typeof nav.role === "string" && nav.role.trim() ? nav.role.trim() : undefined;
    const company = typeof nav.company === "string" && nav.company.trim() ? nav.company.trim() : undefined;
    const jobDescription = typeof nav.job_description === "string" && nav.job_description.trim() ? nav.job_description.trim() : undefined;
    const applicationId = typeof nav.application_id === "string" && nav.application_id.trim() ? nav.application_id.trim() : undefined;
    return {
      path: path.trim(),
      label: label.trim(),
      ...(action ? { action } : {}),
      ...(confirm ? { confirm: true } : {}),
      ...(confirmMessage ? { confirm_message: confirmMessage } : {}),
      ...(role ? { role } : {}),
      ...(company ? { company } : {}),
      ...(jobDescription ? { job_description: jobDescription } : {}),
      ...(applicationId ? { application_id: applicationId } : {}),
    };
  }
  return null;
}

/** Tools whose `resume_id` in the response should render "Open tailored resume". */
export const RESUME_CREATION_NAV_TOOL_KEYS = new Set([
  "suggest_unimad_navigation",
  "tailor_resume_for_job",
  "generate_resume_for_job_description",
  "tailor_resume_for_role",
]);

function toSnakeToolKey(name: string): string {
  return name
    .replace(/([A-Z])/g, "_$1")
    .replace(/-/g, "_")
    .toLowerCase()
    .replace(/^_/, "");
}

function navigationFromResumeId(response: Record<string, unknown>, toolName?: string): UnimadNavigationAction | null {
  const status = typeof response.status === "string" ? response.status.toLowerCase() : "";
  if (status && status !== "ok" && status !== "duplicate") return null;

  const resumeId = response.resume_id ?? response.resumeId;
  if (resumeId == null || String(resumeId).trim() === "") return null;

  if (toolName) {
    const key = toSnakeToolKey(toolName);
    if (!RESUME_CREATION_NAV_TOOL_KEYS.has(key)) return null;
  }

  const id = String(resumeId).trim();
  return {
    path: `/uniboard/resume?id=${encodeURIComponent(id)}`,
    label: "Open tailored resume",
  };
}

/**
 * Parse navigation button from tool responses.
 * Prefers ``ui.navigation``, then resume_id deep-link (create/tailor tools only), then top-level path/label.
 */
export function parseUnimadNavigationFromToolResponse(response: unknown, toolName?: string): UnimadNavigationAction | null {
  const normalized = coerceToolResponseRecord(response);
  if (!normalized) return null;

  const fromUi = navigationFromUi(normalized);
  if (fromUi) return fromUi;

  const fromResume = navigationFromResumeId(normalized, toolName);
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
