"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SquareImageCropEditor } from "@/components/shared/SquareImageCropModal";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { ProfileConfirmDialog } from "@/components/user-profile/ProfileConfirmDialog";
import { deleteMediaByUrl } from "@/features/media/server-actions/media-actions";
import { isAppManagedMediaUrl } from "@/features/media/utils/is-app-managed-media-url";
import { MEDIA_CATEGORY, UploadError, uploadHeroImageFromDataUrl, uploadPortfolioFile } from "@/features/portfolio/utils/upload";
import { useProfileMedia } from "@/features/user-profile/hooks/use-profile-data";
import type { MediaItem } from "@/features/user-profile/types";
import { fileToDataUrl, resolveRemoteImageForCrop } from "@/utils/image-crop";
import { resolveMediaDisplayUrl } from "@/utils/resolve-media-url";
import { Trash2, Upload, X } from "lucide-react";

export type HeroMediaKind = "profile-picture" | "cover-picture";

type HeroMediaPickerDialogProps = {
  open: boolean;
  onClose: () => void;
  kind: HeroMediaKind;
  currentUrl?: string | null;
  /** Only Unimad-hosted URLs should be croppable. */
  croppableUrl?: string | null;
  /** Extra library entries (e.g. Google / LinkedIn) — not deletable. */
  externalItems?: MediaItem[];
  onSelectUrl: (url: string) => void | Promise<void>;
  title?: string;
};

type ProfileTabId = "edit" | "upload";

export function HeroMediaPickerDialog({
  open,
  onClose,
  kind,
  currentUrl,
  croppableUrl,
  externalItems = [],
  onSelectUrl,
  title,
}: HeroMediaPickerDialogProps) {
  const isProfile = kind === "profile-picture";
  const canEdit = Boolean(croppableUrl?.trim());
  const defaultTab: ProfileTabId = isProfile && canEdit ? "edit" : "upload";

  const [tab, setTab] = useState<ProfileTabId>(defaultTab);
  const [error, setError] = useState<string | null>(null);
  const [editCropSource, setEditCropSource] = useState<string | null>(null);
  const [uploadCropSource, setUploadCropSource] = useState<string | null>(null);
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [isPreparingCrop, setIsPreparingCrop] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [removedKeys, setRemovedKeys] = useState<Set<string>>(() => new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const preparedForRef = useRef<string | null>(null);

  const libraryCategory = isProfile ? MEDIA_CATEGORY.PROFILE_PICTURE : MEDIA_CATEGORY.COVER_PICTURE;
  const loadLibrary = open && (!isProfile || tab === "upload");
  const { data: uploadedLibrary = [], isLoading: libraryLoading, refetch } = useProfileMedia(libraryCategory, loadLibrary);

  // Reset state when dialog opens / kind changes.
  useEffect(() => {
    if (!open) {
      preparedForRef.current = null;
      setEditCropSource(null);
      setUploadCropSource(null);
      setError(null);
      setRemovedKeys(new Set());
      return;
    }
    setTab(isProfile && canEdit ? "edit" : "upload");
  }, [open, isProfile, canEdit]);

  // Edit tab: load crop UI immediately (no intermediate CTA).
  useEffect(() => {
    if (!open || !isProfile || tab !== "edit") return;
    const source = croppableUrl?.trim();
    if (!source) {
      setEditCropSource(null);
      return;
    }
    if (preparedForRef.current === source && editCropSource) return;

    let cancelled = false;
    setIsPreparingCrop(true);
    setError(null);
    void resolveRemoteImageForCrop(source)
      .then(dataUrl => {
        if (cancelled) return;
        preparedForRef.current = source;
        setEditCropSource(dataUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setEditCropSource(null);
        setError("Could not load your current photo for cropping. Use Upload to choose a new image.");
      })
      .finally(() => {
        if (!cancelled) setIsPreparingCrop(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-load when tab/url change
  }, [open, isProfile, tab, croppableUrl]);

  const libraryItems = useMemo(() => {
    const uploaded: MediaItem[] = uploadedLibrary.map(item => ({
      ...item,
      source: "upload" as const,
      deletable: isAppManagedMediaUrl(item.url),
    }));
    const external = isProfile
      ? externalItems
          .filter(item => item.url?.trim())
          .map(item => ({
            ...item,
            blob_name: item.blob_name || `external:${item.source ?? "ext"}:${item.url}`,
            deletable: false,
          }))
      : [];
    const merged = [...uploaded, ...external];
    return merged.filter(item => !removedKeys.has(item.blob_name) && !removedKeys.has(item.url));
  }, [uploadedLibrary, externalItems, removedKeys, isProfile]);

  const showLibrarySection = libraryLoading || libraryItems.length > 0;

  const applyUrl = useCallback(
    async (url: string) => {
      setError(null);
      setIsSelecting(true);
      try {
        await onSelectUrl(resolveMediaDisplayUrl(url));
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update image");
      } finally {
        setIsSelecting(false);
      }
    },
    [onClose, onSelectUrl]
  );

  const handleCropSave = async (croppedDataUrl: string) => {
    setIsSavingCrop(true);
    setError(null);
    try {
      const url = await uploadHeroImageFromDataUrl(croppedDataUrl, kind);
      await onSelectUrl(url);
      setEditCropSource(null);
      setUploadCropSource(null);
      onClose();
    } catch (e) {
      setError(e instanceof UploadError ? e.message : e instanceof Error ? e.message : "Failed to save image");
    } finally {
      setIsSavingCrop(false);
    }
  };

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;
    setError(null);
    if (isProfile) {
      try {
        const dataUrl = await fileToDataUrl(file);
        setUploadCropSource(dataUrl);
      } catch {
        setError("Could not read image file");
      } finally {
        if (fileRef.current) fileRef.current.value = "";
      }
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadPortfolioFile(file, MEDIA_CATEGORY.COVER_PICTURE);
      await onSelectUrl(resolveMediaDisplayUrl(uploaded.url));
      onClose();
    } catch (e) {
      setError(e instanceof UploadError ? e.message : e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    const key = pendingDelete.blob_name || pendingDelete.url;
    setRemovedKeys(prev => new Set(prev).add(key));
    setPendingDelete(null);
    try {
      const result = await deleteMediaByUrl(pendingDelete.url, pendingDelete.blob_name);
      if (!result.success) {
        setRemovedKeys(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setError(result.error);
      } else {
        void refetch();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open) return null;

  const dialogTitle = title ?? (isProfile ? "Profile picture" : "Cover picture");
  const cropSourceForUpload = uploadCropSource;

  const renderLibraryGrid = () => {
    if (libraryLoading) {
      return (
        <div className={`grid gap-3 ${isProfile ? "grid-cols-4" : "grid-cols-2"}`}>
          {Array.from({ length: isProfile ? 4 : 2 }).map((_, i) => (
            <div
              key={i}
              className={`animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800 ${isProfile ? "aspect-square" : "aspect-[16/9]"}`}
            />
          ))}
        </div>
      );
    }

    if (libraryItems.length === 0) return null;

    return (
      <div className={`grid max-h-52 gap-3 overflow-y-auto ${isProfile ? "grid-cols-4" : "grid-cols-2"}`}>
        {libraryItems.map(item => {
          const canDelete = item.deletable !== false && isAppManagedMediaUrl(item.url);
          return (
            <div key={item.blob_name} className="relative">
              <button
                type="button"
                disabled={isSelecting || isDeleting}
                onClick={() => void applyUrl(item.url)}
                className={`relative w-full overflow-hidden rounded-xl border border-slate-200 hover:border-brand-400 hover:ring-2 hover:ring-brand-500/30 dark:border-slate-700 ${
                  isProfile ? "aspect-square" : "aspect-[16/9]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- user media URLs */}
                <img src={resolveMediaDisplayUrl(item.url)} alt="" className="h-full w-full object-cover" />
                {item.source && item.source !== "upload" ? (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
                    {item.source}
                  </span>
                ) : null}
              </button>
              {canDelete ? (
                <button
                  type="button"
                  title="Delete from library"
                  aria-label="Delete from library"
                  disabled={isDeleting}
                  onClick={e => {
                    e.stopPropagation();
                    setPendingDelete(item);
                  }}
                  className="absolute right-1.5 top-1.5 z-10 rounded-md bg-black/70 p-1 text-white opacity-90 hover:bg-red-600"
                >
                  <Trash2 size={12} />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  const renderUploadHalf = () => (
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
        disabled={isSavingCrop || isPreparingCrop || isUploading || isSelecting}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={e => {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFileSelected(file);
        }}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-slate-600 transition hover:border-brand-400 hover:bg-brand-50/40 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300"
      >
        <Upload size={22} />
        <span className="text-sm font-medium">{isUploading ? "Uploading…" : "Drag & drop or click to upload"}</span>
        <span className="text-xs text-slate-500">PNG or JPG{isProfile ? " — you can crop after choosing" : ""}</span>
      </button>
    </div>
  );

  return (
    <>
      <ModalPortalOverlay
        open
        className="flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hero-media-title"
      >
        <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
        <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-[#111]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 id="hero-media-title" className="text-base font-semibold text-slate-900 dark:text-white">
              {dialogTitle}
            </h2>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>

          {isProfile ? (
            <div className="flex gap-2 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
              {(
                [
                  { id: "edit" as const, label: "Edit", show: Boolean(currentUrl?.trim() || canEdit) },
                  { id: "upload" as const, label: "Upload", show: true },
                ] as const
              )
                .filter(t => t.show)
                .map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTab(t.id);
                      setUploadCropSource(null);
                      setError(null);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      tab === t.id
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                        : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
            </div>
          ) : null}

          <div className="space-y-4 p-5">
            {/* Profile Edit: crop UI immediately */}
            {isProfile && tab === "edit" && !uploadCropSource ? (
              <div className="space-y-3">
                {isPreparingCrop ? (
                  <div className="flex flex-col items-center gap-3 py-10">
                    <div className="h-48 w-48 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
                    <p className="text-xs text-slate-500">Loading photo…</p>
                  </div>
                ) : editCropSource ? (
                  <SquareImageCropEditor
                    key={editCropSource}
                    source={editCropSource}
                    variant="embedded"
                    isSaving={isSavingCrop}
                    cancelLabel="Close"
                    onClose={onClose}
                    onSave={cropped => void handleCropSave(cropped)}
                  />
                ) : (
                  <div className="space-y-3 py-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {canEdit
                        ? "Could not open the crop editor for this photo."
                        : "This photo comes from Google or LinkedIn and can’t be cropped here. Use Upload to choose a new one."}
                    </p>
                    <button type="button" className="text-xs font-medium text-brand-600 hover:underline" onClick={() => setTab("upload")}>
                      Go to Upload
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {/* Profile upload crop (after picking a new file) */}
            {isProfile && cropSourceForUpload ? (
              <SquareImageCropEditor
                key={cropSourceForUpload}
                source={cropSourceForUpload}
                variant="embedded"
                isSaving={isSavingCrop}
                cancelLabel="Back"
                onClose={() => setUploadCropSource(null)}
                onSave={cropped => void handleCropSave(cropped)}
              />
            ) : null}

            {/* Profile Upload tab OR Cover (no tabs): upload + library */}
            {((isProfile && tab === "upload" && !cropSourceForUpload) || !isProfile) && (
              <div className="space-y-4">
                {renderUploadHalf()}

                {showLibrarySection ? (
                  <>
                    <div className="relative py-1">
                      <div className="absolute inset-0 flex items-center" aria-hidden>
                        <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-2 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:bg-[#111]">
                          Your uploads
                        </span>
                      </div>
                    </div>
                    {renderLibraryGrid()}
                  </>
                ) : null}
              </div>
            )}

            {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
          </div>
        </div>
      </ModalPortalOverlay>

      <ProfileConfirmDialog
        open={Boolean(pendingDelete)}
        overlayTier="nested"
        title="Delete from media library?"
        description="This removes the image from your library so you can’t reuse it. This can’t be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        confirmDisabled={isDeleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
