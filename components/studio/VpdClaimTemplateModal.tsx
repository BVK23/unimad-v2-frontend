"use client";

import { ProfileConfirmDialog } from "@/components/user-profile/ProfileConfirmDialog";

type VpdClaimTemplateModalProps = {
  open: boolean;
  isClaiming?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function VpdClaimTemplateModal({ open, isClaiming = false, errorMessage = null, onConfirm, onCancel }: VpdClaimTemplateModalProps) {
  return (
    <ProfileConfirmDialog
      open={open}
      title="Save as your VPD?"
      description={
        <>
          <p>You’ve changed this template. Templates aren’t saved to your account until you make a personal copy.</p>
          <p className="mt-2">Save it as your own VPD to keep these edits in Recents.</p>
          {errorMessage ? (
            <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </>
      }
      confirmLabel={isClaiming ? "Saving…" : "Save as my VPD"}
      cancelLabel="Keep editing"
      confirmVariant="primary"
      confirmDisabled={isClaiming}
      onConfirm={onConfirm}
      onCancel={onCancel}
      overlayTier="nested"
    />
  );
}
