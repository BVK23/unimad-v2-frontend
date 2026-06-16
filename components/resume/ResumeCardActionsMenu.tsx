"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENU_WIDTH_PX = 192;
const MENU_ESTIMATED_HEIGHT_PX = 280;
const VIEWPORT_PADDING_PX = 8;
const ANCHOR_GAP_PX = 8;

type ResumeCardActionsMenuProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children: React.ReactNode;
};

type MenuCoords = {
  top: number;
  left: number;
};

function computeMenuCoords(anchorEl: HTMLElement, menuHeight: number): MenuCoords {
  const rect = anchorEl.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - ANCHOR_GAP_PX - VIEWPORT_PADDING_PX;
  const spaceAbove = rect.top - ANCHOR_GAP_PX - VIEWPORT_PADDING_PX;
  const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;

  const top = openUpward
    ? Math.max(VIEWPORT_PADDING_PX, rect.top - ANCHOR_GAP_PX - menuHeight)
    : Math.min(window.innerHeight - menuHeight - VIEWPORT_PADDING_PX, rect.bottom + ANCHOR_GAP_PX);

  const left = Math.min(Math.max(VIEWPORT_PADDING_PX, rect.right - MENU_WIDTH_PX), window.innerWidth - MENU_WIDTH_PX - VIEWPORT_PADDING_PX);

  return { top, left };
}

export default function ResumeCardActionsMenu({ open, anchorEl, onClose, children }: ResumeCardActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<MenuCoords | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorEl) return;

    const updatePosition = () => {
      const measuredHeight = menuRef.current?.offsetHeight ?? MENU_ESTIMATED_HEIGHT_PX;
      setCoords(computeMenuCoords(anchorEl, measuredHeight));
    };

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);

    const scrollParents: EventTarget[] = [];
    let node: HTMLElement | null = anchorEl.parentElement;
    while (node) {
      const style = window.getComputedStyle(node);
      if (/(auto|scroll|overlay)/.test(style.overflowY)) {
        scrollParents.push(node);
        node.addEventListener("scroll", updatePosition, { passive: true });
      }
      node = node.parentElement;
    }

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      scrollParents.forEach(parent => parent.removeEventListener("scroll", updatePosition));
    };
  }, [open, anchorEl]);

  const handleBackdropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Prevent the subsequent click from reaching the resume card under the backdrop
    // (classic dismiss → navigate click-through when the overlay unmounts mid-gesture).
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div className="fixed inset-0" style={{ zIndex: 210 }} onPointerDown={handleBackdropPointerDown} aria-hidden />
      <div
        ref={menuRef}
        role="menu"
        className="fixed w-48 rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100"
        style={{
          zIndex: 220,
          top: coords?.top ?? -9999,
          left: coords?.left ?? -9999,
          visibility: coords ? "visible" : "hidden",
        }}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body
  );
}
