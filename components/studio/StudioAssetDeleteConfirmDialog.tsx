"use client";

import { ProfileConfirmDialog } from "@/components/user-profile/ProfileConfirmDialog";

export type StudioDeletableAssetKind = "linkedin-post" | "cover-letter" | "cold-email" | "referral" | "vpd";

const ASSET_TYPE_SINGULAR: Record<StudioDeletableAssetKind, string> = {
  "linkedin-post": "LinkedIn post",
  "cover-letter": "cover letter",
  "cold-email": "cold email",
  referral: "referral request",
  vpd: "VPD",
};

type StudioAssetDeleteConfirmDialogProps = {
  open: boolean;
  kind: StudioDeletableAssetKind;
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
};

export function StudioAssetDeleteConfirmDialog({
  open,
  kind,
  label,
  onConfirm,
  onCancel,
  isDeleting = false,
}: StudioAssetDeleteConfirmDialogProps) {
  const assetType = ASSET_TYPE_SINGULAR[kind];

  return (
    <ProfileConfirmDialog
      open={open}
      title={`Delete ${assetType}?`}
      description={
        <>
          This will permanently delete <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>. This cannot be
          undone.
        </>
      }
      confirmLabel={isDeleting ? "Deleting…" : "Delete"}
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmDisabled={isDeleting}
      overlayTier="nested"
    />
  );
}
