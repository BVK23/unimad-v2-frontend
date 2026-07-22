"use client";

import { useMemo } from "react";
import { HeroMediaPickerDialog } from "@/components/shared/HeroMediaPickerDialog";
import { useUpdateProfileMutation } from "@/features/user-profile/hooks/use-profile-data";
import type { MediaItem, ProfilePictureSources } from "@/features/user-profile/types";

type ProfilePictureDialogProps = {
  open: boolean;
  onClose: () => void;
  currentUrl?: string | null;
  /** Unimad-hosted picture URL — only this can be re-cropped (not LinkedIn/Google fallbacks). */
  croppableUrl?: string | null;
  pictureSources?: ProfilePictureSources | null;
};

export function ProfilePictureDialog({ open, onClose, currentUrl, croppableUrl, pictureSources }: ProfilePictureDialogProps) {
  const updateProfile = useUpdateProfileMutation();

  const externalItems = useMemo(() => {
    const items: MediaItem[] = [];
    const google = pictureSources?.google?.trim();
    const linkedin = pictureSources?.linkedin?.trim();
    if (google) {
      items.push({
        url: google,
        blob_name: `external:google:${google}`,
        source: "google",
        deletable: false,
      });
    }
    if (linkedin) {
      items.push({
        url: linkedin,
        blob_name: `external:linkedin:${linkedin}`,
        source: "linkedin",
        deletable: false,
      });
    }
    return items;
  }, [pictureSources?.google, pictureSources?.linkedin]);

  return (
    <HeroMediaPickerDialog
      open={open}
      onClose={onClose}
      kind="profile-picture"
      currentUrl={currentUrl}
      croppableUrl={croppableUrl}
      externalItems={externalItems}
      onSelectUrl={async url => {
        await updateProfile.mutateAsync({ profilePictureUrl: url });
      }}
    />
  );
}
