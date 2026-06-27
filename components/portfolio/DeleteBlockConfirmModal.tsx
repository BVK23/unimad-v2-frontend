"use client";

import React from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { AlertCircle, Loader2 } from "lucide-react";

interface DeleteBlockConfirmModalProps {
  blockLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

const DeleteBlockConfirmModal: React.FC<DeleteBlockConfirmModalProps> = ({ blockLabel, onCancel, onConfirm, isDeleting = false }) => {
  return (
    <ModalPortalOverlay
      className="flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={e => {
        e.stopPropagation();
        if (isDeleting) return;
        onCancel();
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-slate-100 p-6 dark:border-white/10">
          <div className="mt-0.5 rounded-full bg-red-50 p-2 text-red-500 dark:bg-red-950/40">
            <AlertCircle size={18} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Delete block?</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You are deleting <span className="font-medium text-slate-700 dark:text-slate-200">{blockLabel}</span>. This action cannot be
              undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 bg-slate-50 p-4 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : null}
            Delete Block
          </button>
        </div>
      </div>
    </ModalPortalOverlay>
  );
};

export default DeleteBlockConfirmModal;
