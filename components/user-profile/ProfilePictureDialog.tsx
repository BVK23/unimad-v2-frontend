"use client";

import { useCallback, useRef, useState } from "react";
import { SquareImageCropModal } from "@/components/shared/SquareImageCropModal";
import { btnOutline, btnPrimaryBrand } from "@/constants/ui/button-classes";
import { UploadError, uploadHeroImageFromDataUrl } from "@/features/portfolio/utils/upload";
import { profileQk, useProfileMedia, useUpdateProfileMutation } from "@/features/user-profile/hooks/use-profile-data";
import type { MediaItem } from "@/features/user-profile/types";
import { fileToDataUrl } from "@/utils/image-crop";
import { resolveMediaDisplayUrl } from "@/utils/resolve-media-url";
import { useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Upload, X } from "lucide-react";
import Image from "next/image";

type ProfilePictureDialogProps = {
  open: boolean;
  onClose: () => void;
  currentUrl?: string | null;
};

type TabId = "upload" | "library";

export function ProfilePictureDialog({ open, onClose, currentUrl }: ProfilePictureDialogProps) {
  const [tab, setTab] = useState<TabId>("upload");
  const [error, setError] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfileMutation();
  const { data: library = [], isLoading: libraryLoading } = useProfileMedia("profile-picture", open && tab === "library");

  const applyPicture = useCallback(
    async (item: MediaItem) => {
      setError(null);
      try {
        await updateProfile.mutateAsync({ profilePictureUrl: resolveMediaDisplayUrl(item.url) });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update profile picture");
      }
    },
    [onClose, updateProfile]
  );

  const handleCropSave = async (croppedDataUrl: string) => {
    setIsSavingCrop(true);
    setError(null);
    try {
      const url = await uploadHeroImageFromDataUrl(croppedDataUrl, "profile-picture");
      await updateProfile.mutateAsync({ profilePictureUrl: url });
      void queryClient.invalidateQueries({ queryKey: profileQk.media("profile-picture") });
      void queryClient.invalidateQueries({ queryKey: profileQk.profile });
      setCropSource(null);
      onClose();
    } catch (e) {
      setError(e instanceof UploadError ? e.message : e instanceof Error ? e.message : "Failed to save profile picture");
    } finally {
      setIsSavingCrop(false);
    }
  };

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setCropSource(dataUrl);
    } catch {
      setError("Could not read image file");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const openCropCurrent = () => {
    const resolved = resolveMediaDisplayUrl(currentUrl);
    if (!resolved) return;
    setCropSource(resolved);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-picture-title"
      >
        <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
        <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-[#111]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 id="profile-picture-title" className="text-base font-semibold text-slate-900 dark:text-white">
              Profile picture
            </h2>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>

          <div className="flex gap-2 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
            {(["upload", "library"] as const).map(id => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  tab === id
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                    : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/50"
                }`}
              >
                {id === "upload" ? "Upload new" : "My uploads"}
              </button>
            ))}
          </div>

          <div className="space-y-4 p-5">
            {currentUrl ? (
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
                  <Image src={resolveMediaDisplayUrl(currentUrl)} alt="" fill sizes="56px" className="object-cover" unoptimized />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Current profile picture</p>
                  {tab === "upload" ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" className={`${btnOutline} !px-3 !py-1.5 !text-xs`} onClick={() => fileRef.current?.click()}>
                        Update
                      </button>
                      <button type="button" className={`${btnOutline} !px-3 !py-1.5 !text-xs`} onClick={openCropCurrent}>
                        Crop
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {tab === "upload" ? (
              <div className="space-y-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => void handleFileSelected(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  disabled={isSavingCrop || updateProfile.isPending}
                  onClick={() => fileRef.current?.click()}
                  className={`${btnPrimaryBrand} w-full`}
                >
                  <Upload size={16} />
                  {isSavingCrop || updateProfile.isPending ? "Saving…" : "Choose image"}
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PNG or JPG. You can crop after choosing an image. Saved to your media library.
                </p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {libraryLoading ? (
                  <p className="text-sm text-slate-500">Loading uploads…</p>
                ) : library.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <ImageIcon className="text-slate-300 dark:text-slate-600" size={28} />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No profile pictures uploaded yet.</p>
                    <button type="button" className={btnOutline} onClick={() => setTab("upload")}>
                      Upload one
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {library.map(item => (
                      <button
                        key={item.blob_name}
                        type="button"
                        disabled={updateProfile.isPending}
                        onClick={() => void applyPicture(item)}
                        className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 hover:border-brand-400 hover:ring-2 hover:ring-brand-500/30 dark:border-slate-700"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- user media URLs */}
                        <img src={resolveMediaDisplayUrl(item.url)} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
          </div>
        </div>
      </div>

      <SquareImageCropModal
        open={Boolean(cropSource)}
        source={cropSource}
        title="Crop profile photo"
        isSaving={isSavingCrop}
        onClose={() => setCropSource(null)}
        onSave={croppedDataUrl => void handleCropSave(croppedDataUrl)}
      />
    </>
  );
}
