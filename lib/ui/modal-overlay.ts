/**
 * Modal stacking — above Uniboard header (z-100) and profile menu dropdown (z-300).
 * Use numeric zIndex via ModalPortalOverlay (inline style) so tiers work even when
 * Tailwind does not emit dynamic z-[…] classes from this file.
 */
export const MODAL_OVERLAY_Z_INDEX = 500;

/** Nested modals (crop on picker, gate on overlay, etc.) */
export const MODAL_OVERLAY_NESTED_Z_INDEX = 510;

/** Onboarding gate popovers — above standard modals (z-500). */
export const ONBOARDING_GATE_POPOVER_Z_INDEX = 520;

/** @deprecated Prefer zIndex on ModalPortalOverlay; kept for legacy className strings */
export const MODAL_OVERLAY_Z_CLASS = "z-[500]";

/** @deprecated Prefer zIndex on ModalPortalOverlay */
export const MODAL_OVERLAY_ABOVE_MENU_Z_CLASS = "z-[510]";
