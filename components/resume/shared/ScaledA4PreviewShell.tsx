import React from "react";

/** CSS px analogue of A4 at 96dpi — matches scaled Tailwind resume previews. */
export const SCALED_A4_PREVIEW_WIDTH_PX = 794;
export const SCALED_A4_PREVIEW_HEIGHT_PX = 1123;

export type ScaledA4PreviewShellProps = {
  previewScale: number;
  isModal?: boolean;
  outerClassName: string;
  /** Extra classes applied only in non-modal mode (e.g. shadow, clipping). */
  nonModalOuterClassName?: string;
  /** Classes on the inner page box (e.g. flex column). Use `flex-1` only when isModal. */
  innerClassName?: string;
  /** Merged onto inner when scaled (!isModal): padding, fontFamily, etc. */
  scaledInnerStyle?: React.CSSProperties;
  /** Merged onto inner when isModal (e.g. fontFamily). Padding 1.5rem is applied by the shell. */
  modalInnerStyle?: React.CSSProperties;
  /** Optional modal padding override (defaults to 1.5rem). */
  modalPadding?: string;
  children: React.ReactNode;
};

/**
 * Viewport for Tailwind resume previews: outer box is the *visual* A4 size after scale,
 * inner is full 794×1123 with transform, so flex parents and overflow-hidden thumbnails
 * clip correctly (layout width matches painted width).
 */
const ScaledA4PreviewShell: React.FC<ScaledA4PreviewShellProps> = ({
  previewScale,
  isModal = false,
  outerClassName,
  nonModalOuterClassName = "",
  innerClassName = "",
  scaledInnerStyle,
  modalInnerStyle,
  modalPadding = "1.5rem",
  children,
}) => {
  if (isModal) {
    return (
      <div className={`relative flex justify-center items-start w-full ${outerClassName}`}>
        <div
          className={`box-border ${innerClassName}`.trim()}
          style={{
            padding: modalPadding,
            ...modalInnerStyle,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${nonModalOuterClassName} ${outerClassName}`}
      style={{
        width: `${SCALED_A4_PREVIEW_WIDTH_PX * previewScale}px`,
        minHeight: `${SCALED_A4_PREVIEW_HEIGHT_PX * previewScale}px`,
      }}
    >
      <div
        className={`box-border shrink-0 ${innerClassName}`.trim()}
        style={{
          width: `${SCALED_A4_PREVIEW_WIDTH_PX}px`,
          minHeight: `${SCALED_A4_PREVIEW_HEIGHT_PX}px`,
          transform: `scale(${previewScale})`,
          transformOrigin: "top left",
          ...scaledInnerStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ScaledA4PreviewShell;
