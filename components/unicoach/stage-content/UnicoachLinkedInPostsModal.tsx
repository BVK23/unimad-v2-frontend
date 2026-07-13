"use client";

import { useCallback, useEffect, useState } from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { UNICOACH_LINKEDIN_POSTS, type UnicoachLinkedInPost } from "@/constants/unicoach-linkedin-posts";
import { Check, Copy, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

function PostDetailModal({ post, onClose }: { post: UnicoachLinkedInPost; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(post.examplePost);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [post.examplePost]);

  return (
    <ModalPortalOverlay tier="nested" className="flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-[#111]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div>
            <p className="text-xs font-medium text-brand-600 dark:text-brand-400">Day {post.day}</p>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {post.emoji} {post.title}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>
        <div className="scrollbar-on-hover flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="rounded-xl border-l-4 border-brand-500 bg-brand-50 p-3 dark:bg-brand-950/30">
            <p className="text-sm text-slate-700 dark:text-slate-300">{post.explanation}</p>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Example post</p>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-brand-600 dark:text-slate-400"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 font-sans">
              {post.examplePost}
            </pre>
          </div>
        </div>
      </div>
    </ModalPortalOverlay>
  );
}

export const UnicoachLinkedInPostsModal = ({ open, onClose }: Props) => {
  if (!open) return null;
  return <UnicoachLinkedInPostsModalContent onClose={onClose} />;
};

function UnicoachLinkedInPostsModalContent({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<UnicoachLinkedInPost | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selected) setSelected(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, selected]);

  return (
    <>
      <ModalPortalOverlay className="flex items-center justify-center p-4">
        <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
        <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-[#111]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">30-day LinkedIn posts</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Click a day for the prompt and example template.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>
          <div className="scrollbar-on-hover flex-1 overflow-y-auto p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {UNICOACH_LINKEDIN_POSTS.map(post => (
                <button
                  key={post.day}
                  type="button"
                  onClick={() => setSelected(post)}
                  className="rounded-xl border border-brand-200 bg-brand-50/80 p-3 text-left transition hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/30 dark:hover:bg-brand-950/50"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Day {post.day}</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                    {post.emoji} {post.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </ModalPortalOverlay>
      {selected ? <PostDetailModal post={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}
