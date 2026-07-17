"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { stripHtmlToText } from "@/utils/stripHtmlToText";
import { Copy, Loader2, Pencil, Trash2 } from "lucide-react";
import { PortfolioItem } from "../../types";
import VpdCardThumbnail from "./VpdCardThumbnail";

export type VpdLibraryItem = {
  id: string | number;
  title: string;
  date: string;
  isTemplate?: boolean;
  slug?: string | null;
  project: PortfolioItem;
};

interface VpdLibraryCardProps {
  vpd: VpdLibraryItem;
  onClick: () => void;
  /** Right-click: open the VPD editor (templates + user assets). */
  onEdit?: (vpd: VpdLibraryItem) => void;
  /** Right-click: "Use as my VPD" (template) or "Duplicate" (user asset). */
  onDuplicate?: (vpd: VpdLibraryItem) => void;
  /** Right-click Delete — user assets only (never templates). */
  onDelete?: (vpd: VpdLibraryItem) => void;
  isDuplicating?: boolean;
  isHighlighted?: boolean;
}

type MenuState = { x: number; y: number };

/** Only one VPD library context menu may be open at a time (sidebar + All VPDs modal). */
let activeMenuClose: (() => void) | null = null;

const closeActiveVpdLibraryMenu = () => {
  activeMenuClose?.();
  activeMenuClose = null;
};

const VpdLibraryCard: React.FC<VpdLibraryCardProps> = ({
  vpd,
  onClick,
  onEdit,
  onDuplicate,
  onDelete,
  isDuplicating = false,
  isHighlighted = false,
}) => {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const canDelete = Boolean(onDelete) && !vpd.isTemplate;
  const hasMenu = Boolean(onEdit) || Boolean(onDuplicate) || canDelete;

  const closeMenu = useCallback(() => {
    setMenu(null);
    activeMenuClose = null;
  }, []);

  useEffect(() => {
    return () => {
      if (activeMenuClose === closeMenu) {
        activeMenuClose = null;
      }
    };
  }, [closeMenu]);

  useEffect(() => {
    if (!menu) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menu, closeMenu]);

  const handleContextMenu = (event: React.MouseEvent) => {
    if (!hasMenu || isDuplicating) return;
    event.preventDefault();
    event.stopPropagation();
    closeActiveVpdLibraryMenu();
    activeMenuClose = closeMenu;
    setMenu({ x: event.clientX, y: event.clientY });
  };

  const handleEditClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    closeMenu();
    onEdit?.(vpd);
  };

  const handleDuplicateClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    closeMenu();
    onDuplicate?.(vpd);
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    closeMenu();
    onDelete?.(vpd);
  };

  const duplicateLabel = vpd.isTemplate ? "Use as my VPD" : "Duplicate";
  const menuItemCount = (onEdit ? 1 : 0) + (onDuplicate ? 1 : 0) + (canDelete ? 1 : 0);
  const menuHeight = 8 + menuItemCount * 40;
  const displayTitle = stripHtmlToText(vpd.title || "") || stripHtmlToText(vpd.project.title || "") || "Untitled VPD";

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        onContextMenu={handleContextMenu}
        disabled={isDuplicating}
        aria-label={displayTitle}
        className={`group relative aspect-square overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all hover:border-brand-500/50 hover:shadow-md dark:bg-slate-900 dark:hover:border-brand-500/40 ${
          isHighlighted ? "border-brand-400 ring-2 ring-brand-400/70 dark:border-brand-400" : "border-slate-200 dark:border-slate-700"
        } ${isDuplicating ? "pointer-events-none opacity-70" : ""}`}
      >
        <div className="relative h-full w-full">
          <VpdCardThumbnail project={vpd.project} />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent px-2 pb-2 pt-6">
            <h4 className="line-clamp-2 text-[12px] font-semibold leading-tight text-white drop-shadow-sm">{displayTitle}</h4>
            <p className="mt-0.5 text-[10px] text-white/75">{vpd.date}</p>
          </div>
          {isDuplicating ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/35">
              <Loader2 size={18} className="animate-spin text-white" aria-hidden />
              <span className="sr-only">Duplicating…</span>
            </div>
          ) : null}
        </div>
      </button>

      {menu && typeof document !== "undefined"
        ? createPortal(
            <div
              role="menu"
              aria-label={vpd.isTemplate ? "Template actions" : "VPD actions"}
              className="fixed z-[300] w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-2xl animate-in fade-in zoom-in-95 duration-100 dark:border-slate-700 dark:bg-slate-800"
              style={{
                zIndex: 530,
                left: Math.min(menu.x, window.innerWidth - 200),
                top: Math.min(menu.y, window.innerHeight - menuHeight),
              }}
              onClick={event => event.stopPropagation()}
              onContextMenu={event => event.preventDefault()}
            >
              {onEdit ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleEditClick}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <Pencil size={16} aria-hidden />
                  Edit
                </button>
              ) : null}
              {onDuplicate ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleDuplicateClick}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <Copy size={16} aria-hidden />
                  {duplicateLabel}
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleDeleteClick}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={16} aria-hidden />
                  Delete
                </button>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </>
  );
};

export default VpdLibraryCard;
