"use client";

import React, { useEffect, useRef, useState } from "react";
import { publishVpdAsset } from "@/features/vpd/server-actions/vpd-actions";
import { isPersistedVpdId } from "@/features/vpd/utils/isPersistedVpdId";
import { buildVpdPublicUrl, mapStudioProjectToVpdPublishContent, normalizeVpdPublishSlug } from "@/features/vpd/utils/vpdPublish";
import type { PortfolioItem } from "@/types";
import { Check, Copy, ExternalLink } from "lucide-react";

type VpdPublishMenuProps = {
  project: PortfolioItem;
  /** Existing published slug from API, if any */
  slug: string | null;
  onSlugChange: (slug: string) => void;
  /** Save latest editor content before publishing (autosave). */
  onBeforePublish?: () => Promise<void>;
  className?: string;
};

const VpdPublishMenu: React.FC<VpdPublishMenuProps> = ({ project, slug, onSlugChange, onBeforePublish, className = "" }) => {
  const canPublish = isPersistedVpdId(project.id);
  const publishedUrl = slug ? buildVpdPublicUrl(slug) : null;

  const [showMenu, setShowMenu] = useState(false);
  const [publishUrlInput, setPublishUrlInput] = useState(slug ?? "");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishShowPublished, setPublishShowPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pendingOpenTabRef = useRef<string | null>(null);

  useEffect(() => {
    setPublishUrlInput(slug ?? "");
  }, [slug, project.id]);

  useEffect(() => {
    if (!showMenu) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setShowMenu(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showMenu]);

  useEffect(() => {
    if (isPublishing || !publishShowPublished || !publishedUrl) return;
    const url = pendingOpenTabRef.current;
    if (!url || url !== publishedUrl) return;
    pendingOpenTabRef.current = null;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [isPublishing, publishShowPublished, publishedUrl]);

  const handleToggleMenu = () => {
    if (!canPublish) return;
    setError(null);
    setPublishShowPublished(false);
    setPublishUrlInput(slug ?? publishUrlInput);
    setShowMenu(open => !open);
  };

  const handleCopy = async () => {
    const url = publishedUrl?.trim();
    if (!url) {
      setError("Publish your VPD first to copy the link");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopyHint(true);
      window.setTimeout(() => setCopyHint(false), 2000);
    } catch {
      setError("Could not copy link");
    }
  };

  const handlePublish = async () => {
    if (isPublishing || !canPublish) return;

    const nextSlug = normalizeVpdPublishSlug(publishUrlInput);
    if (!nextSlug) {
      setError("Enter a link name");
      return;
    }

    setIsPublishing(true);
    setError(null);
    try {
      await onBeforePublish?.();
      const content = mapStudioProjectToVpdPublishContent(project, nextSlug);
      const result = await publishVpdAsset(content, nextSlug);

      if (!result.ok) {
        setError(result.error || "Failed to publish VPD");
        return;
      }

      onSlugChange(result.slug);
      setPublishUrlInput(result.slug);
      setPublishShowPublished(true);
      if (!slug) {
        pendingOpenTabRef.current = buildVpdPublicUrl(result.slug);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish VPD");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          handleToggleMenu();
        }}
        disabled={!canPublish}
        title={canPublish ? "Publish your VPD" : "Generate or open a saved VPD to publish"}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
          canPublish
            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-600"
        }`}
      >
        <ExternalLink size={14} />
        Publish
      </button>

      {showMenu ? (
        <div
          className="pointer-events-auto absolute right-0 top-[calc(100%+0.5rem)] z-[101] w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-slate-950"
          onClick={e => e.stopPropagation()}
        >
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Publish VPD</p>
          <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800 dark:border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-200/90">
            Pick a unique link. If that URL is already taken, publishing will fail — choose another slug.
          </p>
          <label className="mt-3 block text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">URL</label>
          <div className="mt-1.5 flex w-full items-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 transition-colors focus-within:border-brand-500/40 focus-within:ring-2 focus-within:ring-brand-500/30 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
            <span className="mr-1 hidden flex-none select-none whitespace-nowrap text-slate-400 sm:inline-block">unimad.com/vpd/</span>
            <span className="mr-1 flex-none select-none whitespace-nowrap text-slate-400 sm:hidden">/vpd/</span>
            <input
              value={publishUrlInput}
              onChange={e => {
                setPublishUrlInput(e.target.value);
                setPublishShowPublished(false);
                setError(null);
              }}
              disabled={isPublishing}
              placeholder="e.g. alex-spotify-fe"
              aria-label="VPD public slug"
              className="min-w-0 flex-1 bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>
          {error ? (
            <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!publishedUrl}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-brand-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200"
            >
              <Copy size={13} /> {copyHint ? "Copied" : "Copy URL"}
            </button>
            <button
              type="button"
              onClick={publishShowPublished ? undefined : () => void handlePublish()}
              disabled={isPublishing || publishShowPublished}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold shadow-md transition-all disabled:opacity-60 ${
                publishShowPublished
                  ? "cursor-default bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-brand-600 text-white shadow-brand-500/20 hover:scale-[1.02] active:scale-95"
              }`}
            >
              {publishShowPublished ? <Check size={13} /> : <ExternalLink size={13} />}
              {isPublishing ? "Publishing…" : publishShowPublished ? "Published" : publishedUrl ? "Save" : "Publish"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default VpdPublishMenu;
