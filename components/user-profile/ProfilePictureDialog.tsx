"use client";

import { useCallback, useRef, useState } from "react";
import { btnOutline, btnPrimaryBrand } from "@/constants/ui/button-classes";
import { useProfileMedia, useUpdateProfileMutation, useUploadProfileMediaMutation } from "@/features/user-profile/hooks/use-profile-data";
import type { MediaItem } from "@/features/user-profile/types";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const updateProfile = useUpdateProfileMutation();
  const uploadMedia = useUploadProfileMediaMutation();
  const { data: library = [], isLoading: libraryLoading } = useProfileMedia("profile-picture", open && tab === "library");

  const applyPicture = useCallback(
    async (item: MediaItem) => {
      setError(null);
      try {
        await updateProfile.mutateAsync({ profilePictureUrl: item.url });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update profile picture");
      }
    },
    [onClose, updateProfile]
  );

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const formData = new FormData();
      formData.append("category", "profile-picture");
      formData.append("file", file);
      const uploaded = await uploadMedia.mutateAsync(formData);
      await updateProfile.mutateAsync({ profilePictureUrl: uploaded.url });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  };

  if (!open) return null;

  return (
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

        <div className="p-5 space-y-4">
          {currentUrl ? (
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
                <Image src={currentUrl} alt="" fill sizes="56px" className="object-cover" unoptimized />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Current profile picture</p>
            </div>
          ) : null}

          {tab === "upload" ? (
            <div className="space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => void handleUpload(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                disabled={uploadMedia.isPending || updateProfile.isPending}
                onClick={() => fileRef.current?.click()}
                className={`${btnPrimaryBrand} w-full`}
              >
                <Upload size={16} />
                {uploadMedia.isPending || updateProfile.isPending ? "Uploading…" : "Choose image"}
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">PNG or JPG. Saved to your media library under profile pictures.</p>
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
                      <img src={item.url} alt="" className="h-full w-full object-cover" />
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
  );
}
