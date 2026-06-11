"use client";

type PanelResizeHandleProps = {
  onPointerDown: (event: React.PointerEvent) => void;
  label?: string;
  /**
   * overlay — sits just outside the panel border (sidebars).
   * inline — dedicated flex column between panels (avoids overlap with a sibling).
   */
  variant?: "overlay" | "inline";
  className?: string;
};

const handleBase =
  "flex h-full w-3 cursor-col-resize select-none touch-none justify-start bg-transparent transition-colors hover:bg-slate-200/25 dark:hover:bg-white/[0.04]";
const dividerLine = "pointer-events-none h-full w-px shrink-0 bg-slate-200/60 dark:bg-white/10";

/**
 * Drag handle for resizable panels. Use `inline` when a sibling panel would
 * capture pointer events over an overlay handle (e.g. resume forms → preview).
 */
export function PanelResizeHandle({ onPointerDown, label = "Resize panel", variant = "overlay", className = "" }: PanelResizeHandleProps) {
  if (variant === "inline") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={label}
        onPointerDown={onPointerDown}
        className={`relative shrink-0 ${handleBase}${className ? ` ${className}` : ""}`}
      />
    );
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      onPointerDown={onPointerDown}
      className={`absolute -right-3 top-0 z-50 ${handleBase}${className ? ` ${className}` : ""}`}
    >
      <span className={dividerLine} aria-hidden />
    </div>
  );
}
