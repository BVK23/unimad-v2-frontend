"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ProfilePictureWithFallback from "@/components/user-profile/ProfilePictureWithFallback";
import { MODAL_OVERLAY_Z_CLASS } from "@/lib/ui/modal-overlay";
import { X, Send, CheckCircle2, Edit2, Wand2 } from "lucide-react";
import StudioMediaPreviewImage from "./StudioMediaPreviewImage";

export type LinkedinPreviewPendingItem = { id: string; objectUrl: string };

interface PostSchedulerModalProps {
  content: string;
  onClose: () => void;
  onPost: (finalContent: string, isScheduled: boolean, scheduleDate?: Date) => void | Promise<void>;
  /** Opens content in the main preview (closes modal). */
  onEditToPreview?: (content: string) => void;
  /** Close modal and start Unibot to improve the post draft. */
  onImproveWithUnibot?: (content: string) => void;
  authorName?: string;
  authorPictureUrls?: string[];
  authorHeadline?: string;
  authorInitials?: string;
  linkedinPreviewPendingMedia?: LinkedinPreviewPendingItem[];
  linkedinPreviewImages?: string[];
  initialData?: {
    isScheduled: boolean;
    date?: Date;
  };
}

const PostSchedulerModal: React.FC<PostSchedulerModalProps> = ({
  content,
  onClose,
  onPost,
  onEditToPreview,
  onImproveWithUnibot,
  authorName = "You",
  authorHeadline = "Professional",
  authorPictureUrls = [],
  authorInitials,
  linkedinPreviewPendingMedia = [],
  linkedinPreviewImages = [],
  initialData,
}) => {
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [currentContent, setCurrentContent] = useState(content);
  // const [postToLinkedin, setPostToLinkedin] = useState(true);
  // const [postToUnimad, setPostToUnimad] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorToast, setErrorToast] = useState("");

  const [isScheduling, setIsScheduling] = useState(initialData?.isScheduled || false);
  const initialDateStr = initialData?.date ? initialData.date.toISOString().split("T")[0] : "";
  const initialTimeStr = initialData?.date ? initialData.date.toTimeString().split(" ")[0].slice(0, 5) : "";

  const [scheduleDate, setScheduleDate] = useState<string>(initialDateStr);
  const [scheduleTime, setScheduleTime] = useState<string>(initialTimeStr);

  useEffect(() => {
    setCurrentContent(content);
  }, [content]);

  const handleConfirm = async () => {
    if (isScheduling && (!scheduleDate || !scheduleTime)) {
      return;
    }

    const date = isScheduling ? new Date(`${scheduleDate}T${scheduleTime}`) : undefined;
    setErrorToast("");
    setIsSubmitting(true);
    try {
      await Promise.resolve(onPost(currentContent, isScheduling, date));
      setSuccessMessage(
        isScheduling
          ? "Scheduled perfectly. Your post will go live right on time."
          : "You're live on LinkedIn. Your story is now out in the world."
      );
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessMessage("");
        onClose();
      }, 1500);
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : "We couldn't complete this action. Please try again.";
      setErrorToast(message);
      setTimeout(() => setErrorToast(""), 3200);
    } finally {
      setIsSubmitting(false);
    }
  };

  const authorInitialsDisplay =
    authorInitials ?? (`${authorName.split(" ")[0]?.[0] ?? ""}${authorName.split(" ")[1]?.[0] ?? ""}`.toUpperCase() || "YO");

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${MODAL_OVERLAY_Z_CLASS} flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200`}
    >
      <div className="relative my-auto flex max-h-[min(90dvh,calc(100vh-2rem))] w-full max-w-2xl min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
        {errorToast ? (
          <div className="absolute right-4 top-4 z-30 animate-in slide-in-from-top-2 fade-in duration-200">
            <div
              role="status"
              aria-live="polite"
              className="max-w-[22rem] rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-lg dark:border-rose-900/40 dark:bg-rose-950/60 dark:text-rose-200"
            >
              {errorToast}
            </div>
          </div>
        ) : null}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-sans text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Review & Schedule</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || showSuccess}
            className="rounded-full p-2 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-60 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X size={20} className="text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {mode === "preview" ? (
            <div className="group relative">
              <div className="min-h-[16rem] rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-400 to-brand-500 text-sm font-medium text-white">
                    <ProfilePictureWithFallback urls={authorPictureUrls} initials={authorInitialsDisplay} alt={authorName} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">{authorName}</h3>
                    <p className="text-xs text-slate-500">{authorHeadline}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <span>Now</span> • 🌐
                    </div>
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                  {currentContent}
                </div>
                {linkedinPreviewPendingMedia.length > 0 || linkedinPreviewImages.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {linkedinPreviewPendingMedia.map(p => (
                      <div key={p.id} className="relative overflow-hidden rounded-lg border border-amber-200 dark:border-amber-800">
                        <StudioMediaPreviewImage src={p.objectUrl} alt="" className="h-32 w-full object-cover" />
                        <span className="absolute bottom-1 left-1 rounded bg-amber-100/90 px-1 text-[10px] font-medium text-amber-900 dark:bg-amber-900/80 dark:text-amber-100">
                          Pending upload
                        </span>
                      </div>
                    ))}
                    {linkedinPreviewImages.map(url => (
                      <StudioMediaPreviewImage
                        key={url}
                        src={url}
                        alt="LinkedIn media preview"
                        className="h-32 w-full rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-white/90 opacity-0 backdrop-blur-sm transition-all group-hover:pointer-events-auto group-hover:opacity-100 dark:bg-black/90">
                <button
                  type="button"
                  onClick={() => {
                    if (onEditToPreview) {
                      onEditToPreview(currentContent);
                    } else {
                      setMode("edit");
                    }
                  }}
                  className="pointer-events-auto flex translate-y-4 items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-medium text-white shadow-xl transition-all hover:bg-brand-700 active:scale-95 group-hover:translate-y-0"
                >
                  <Edit2 size={16} /> Edit Post Content
                </button>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-1 transition-all focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900/50">
              <textarea
                value={currentContent}
                onChange={e => setCurrentContent(e.target.value)}
                className="h-64 w-full resize-none border-none bg-transparent p-6 font-sans text-base leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-200"
                placeholder="Write your post content here..."
                autoFocus
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onImproveWithUnibot?.(currentContent)}
                  disabled={!onImproveWithUnibot || !currentContent.trim()}
                  className="flex items-center gap-2 rounded-lg bg-brand-100 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-200 disabled:pointer-events-none disabled:opacity-50 dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-900/50"
                >
                  <Wand2 size={14} /> Improve with Unibot
                </button>
                <button
                  type="button"
                  onClick={() => setMode("preview")}
                  className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="relative flex flex-col justify-between rounded-2xl border-2 border-brand-500 bg-brand-50/50 p-5 dark:bg-brand-900/10">
                <div>
                  <span className="mb-1 block text-base font-medium text-slate-900 dark:text-white">Post to LinkedIn</span>
                  <span className="text-xs text-slate-500">Share with your professional network</span>
                </div>
                <div className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 scale-110 items-center justify-center rounded-full border-2 border-brand-600 bg-brand-600">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              </div>

              {/* Post to Unimad — commented until community publish API exists
              <label
                className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border-2 p-5 transition-all ${
                  postToUnimad
                    ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/10"
                    : "border-slate-100 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div>
                  <span className="mb-1 block text-base font-medium text-slate-900 dark:text-white">Post to Unimad</span>
                  <span className="text-xs text-slate-500">Share with the community</span>
                </div>
                <div
                  className={`absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-all ${
                    postToUnimad ? "scale-110 border-brand-600 bg-brand-600" : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {postToUnimad ? <CheckCircle2 size={14} className="text-white" /> : null}
                </div>
                <input type="checkbox" className="hidden" checked={postToUnimad} onChange={e => setPostToUnimad(e.target.checked)} />
              </label>

              <div
                aria-disabled
                className="relative flex flex-col justify-between rounded-2xl border-2 border-slate-100 bg-slate-50/80 p-5 opacity-60 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-base font-medium text-slate-900 dark:text-white">Post to Unimad</span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Coming soon
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Share with the community</span>
                </div>
                <div className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-2 border-slate-200 dark:border-slate-700" />
              </div>
              */}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-900/80">
              <div className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-800/60">
                <span className="text-sm font-medium text-slate-800 dark:text-white">Schedule for later</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isScheduling}
                  onClick={() => setIsScheduling(!isScheduling)}
                  className={`h-7 w-12 cursor-pointer rounded-full p-1 transition-colors duration-300 ${
                    isScheduling ? "bg-brand-600" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                      isScheduling ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {isScheduling ? (
                <div className="grid animate-in fade-in slide-in-from-top-2 grid-cols-2 gap-3 p-4 pt-0">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800"
                  />
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || showSuccess}
            className="rounded-full px-6 py-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:pointer-events-none disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting || showSuccess}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3 text-sm font-medium text-white shadow-xl shadow-brand-500/20 transition-all hover:bg-brand-700 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
          >
            {isSubmitting ? "Working…" : isScheduling ? "Schedule Post" : "Post Now"}
            <Send size={16} className={isScheduling || isSubmitting ? "hidden" : ""} />
          </button>
        </div>

        {showSuccess ? (
          <div className="absolute inset-0 z-20 flex animate-in fade-in items-center justify-center bg-white/70 backdrop-blur-sm duration-200 dark:bg-black/40">
            <div className="flex animate-in zoom-in-95 flex-col items-center gap-3 px-6 duration-300">
              <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-brand-600 shadow-lg shadow-brand-500/30">
                <CheckCircle2 size={34} className="text-white" />
              </div>
              <p className="max-w-[22rem] text-center text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {successMessage}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
};

export default PostSchedulerModal;
