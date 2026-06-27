export type UnimadNavigationAction = {
  path: string;
  label: string;
};

/** Parse navigation button from `suggest_unimad_navigation` tool response. */
export function parseUnimadNavigationFromToolResponse(response: Record<string, unknown> | undefined): UnimadNavigationAction | null {
  if (!response || response.status !== "ok") return null;

  const ui = response.ui;
  if (ui && typeof ui === "object") {
    const nav = (ui as Record<string, unknown>).navigation;
    if (nav && typeof nav === "object") {
      const path = (nav as Record<string, unknown>).path;
      const label = (nav as Record<string, unknown>).label;
      if (typeof path === "string" && path.trim() && typeof label === "string" && label.trim()) {
        return { path: path.trim(), label: label.trim() };
      }
    }
  }

  const path = response.path;
  const label = response.label;
  if (typeof path === "string" && path.trim()) {
    return {
      path: path.trim(),
      label: typeof label === "string" && label.trim() ? label.trim() : "Go there",
    };
  }

  return null;
}
