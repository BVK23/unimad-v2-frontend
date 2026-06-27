"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { DocumentSaveStatusBar } from "@/components/application-assets/DocumentSaveStatusBar";
import ProfilePictureWithFallback from "@/components/user-profile/ProfilePictureWithFallback";
import { MIN_LINKEDIN_POST_CHARS, LINKEDIN_POST_TOO_SHORT_MESSAGE } from "@/features/linkedin/constants";
import {
  formatSessionEndsDate,
  isLinkedInScheduleDateAllowed,
  isScheduleDateSelectable,
  isScheduleTimeSelectable,
  parseScheduleDateTime,
  resolveLinkedInPublishAccess,
  toScheduleDateKey,
  type LinkedInPublishAccess,
} from "@/features/linkedin/utils/linkedinPublishAccess";
import { MODAL_OVERLAY_Z_CLASS } from "@/lib/ui/modal-overlay";
import { useDocumentAutosave } from "@/src/hooks/useDocumentAutosave";
import { X, Send, CheckCircle2, Wand2 } from "lucide-react";
import { LinkedInPublishAccessNotice } from "./LinkedInPublishAccessNotice";
import { LinkedInScheduleDateTimePicker } from "./LinkedInScheduleDateTimePicker";
import StudioMediaPreviewImage from "./StudioMediaPreviewImage";

export type LinkedinPreviewPendingItem = { id: string; objectUrl: string };

interface PostSchedulerModalProps {
  content: string;
  onClose: () => void;
  onPost: (finalContent: string, isScheduled: boolean, scheduleDate?: Date) => void | Promise<void>;
  /** Debounced persist while editing draft in the modal. */
  onPersistDraft?: (content: string) => Promise<void>;
  /** Keep Studio preview in sync while typing. */
  onContentDraftChange?: (content: string) => void;
  /** Opens content in the main preview (closes modal). */
  onEditToPreview?: (content: string) => void;
  /** Close modal and start Unibot to improve the post draft (draft body stays in session). */
  onImproveWithUnibot?: () => void;
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
  linkedInPublishAccess?: LinkedInPublishAccess;
  userId?: number;
}

const PostSchedulerModal: React.FC<PostSchedulerModalProps> = ({
  content,
  onClose,
  onPost,
  onPersistDraft,
  onContentDraftChange,
  onEditToPreview,
  onImproveWithUnibot,
  authorName = "You",
  authorHeadline = "Professional",
  authorPictureUrls = [],
  authorInitials,
  linkedinPreviewPendingMedia = [],
  linkedinPreviewImages = [],
  initialData,
  linkedInPublishAccess: linkedInPublishAccessProp,
  userId,
}) => {
  const linkedInPublishAccess = linkedInPublishAccessProp ?? resolveLinkedInPublishAccess(null);
  const [currentContent, setCurrentContent] = useState(content);
  const editBaselineRef = useRef(content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorToast, setErrorToast] = useState("");

  const [isScheduling, setIsScheduling] = useState(initialData?.isScheduled || false);
  const initialDateStr = initialData?.date ? initialData.date.toISOString().split("T")[0] : "";
  const initialTimeStr = initialData?.date ? initialData.date.toTimeString().split(" ")[0].slice(0, 5) : "";

  const [scheduleDate, setScheduleDate] = useState<string>(initialDateStr);
  const [scheduleTime, setScheduleTime] = useState<string>(initialTimeStr);

  const scheduleDateTime = useMemo(
    () => (isScheduling ? parseScheduleDateTime(scheduleDate, scheduleTime) : null),
    [isScheduling, scheduleDate, scheduleTime]
  );
  const scheduleBeyondSession = Boolean(scheduleDateTime && !isLinkedInScheduleDateAllowed(scheduleDateTime, linkedInPublishAccess));
  const sessionEndsLabel = linkedInPublishAccess.sessionEndsAt ? formatSessionEndsDate(linkedInPublishAccess.sessionEndsAt) : undefined;
  const publishBlocked = !linkedInPublishAccess.canPost;
  const contentTooShort = currentContent.trim().length < MIN_LINKEDIN_POST_CHARS;
  const publishActionsDisabled = publishBlocked || contentTooShort;
  const confirmDisabled =
    isSubmitting || showSuccess || publishActionsDisabled || (isScheduling && (!scheduleDate || !scheduleTime || scheduleBeyondSession));

  const persistDraft = useCallback(async () => {
    if (!onPersistDraft) return;
    await onPersistDraft(currentContent);
    editBaselineRef.current = currentContent;
  }, [currentContent, onPersistDraft]);

  const { hasPendingUnsavedChanges, isSaving, savedConfirmationVisible, markDirty, runSave, reset, acknowledgeSaved } = useDocumentAutosave(
    {
      enabled: Boolean(onPersistDraft),
      onSave: persistDraft,
    }
  );

  useEffect(() => {
    if (hasPendingUnsavedChanges || isSaving) return;
    setCurrentContent(content);
    editBaselineRef.current = content;
  }, [content, hasPendingUnsavedChanges, isSaving]);

  useEffect(() => {
    if (!isScheduling || scheduleDate) return;
    const start = new Date();
    for (let offset = 0; offset < 366; offset += 1) {
      const candidate = new Date(start);
      candidate.setDate(start.getDate() + offset);
      if (!isScheduleDateSelectable(candidate, linkedInPublishAccess)) continue;
      setScheduleDate(toScheduleDateKey(candidate));
      return;
    }
  }, [isScheduling, scheduleDate, linkedInPublishAccess]);

  useEffect(() => {
    if (!isScheduling || !scheduleDate || scheduleTime) return;
    for (let hour = 0; hour < 24; hour += 1) {
      for (const minute of ["00", "15", "30", "45"]) {
        const time = `${String(hour).padStart(2, "0")}:${minute}`;
        if (isScheduleTimeSelectable(scheduleDate, time, linkedInPublishAccess)) {
          setScheduleTime(time);
          return;
        }
      }
    }
  }, [isScheduling, scheduleDate, scheduleTime, linkedInPublishAccess]);

  const handleConfirm = async () => {
    if (publishActionsDisabled) return;
    if (isScheduling && (!scheduleDate || !scheduleTime)) {
      return;
    }

    const date = isScheduling ? (scheduleDateTime ?? undefined) : undefined;
    if (isScheduling && date && scheduleBeyondSession) {
      return;
    }
    setErrorToast("");
    setActionStatus(null);
    setIsSubmitting(true);
    try {
      if (onPersistDraft && hasPendingUnsavedChanges) {
        await persistDraft();
      }
      await Promise.resolve(onPost(currentContent, isScheduling, date));
      const atLabel = new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
      const statusLine = isScheduling
        ? `Scheduled on LinkedIn for ${scheduleDateTime?.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) ?? atLabel}`
        : `Posted to LinkedIn at ${atLabel}`;
      setActionStatus(statusLine);
      acknowledgeSaved();
      setSuccessMessage(isScheduling ? "Your post is scheduled." : "Your post is live on LinkedIn.");
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessMessage("");
        onClose();
      }, 2200);
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : "We couldn't complete this action. Please try again.";
      setErrorToast(message);
      setTimeout(() => setErrorToast(""), 3200);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImproveDraft = () => {
    onImproveWithUnibot?.();
  };

  const handleCancelEdits = () => {
    const baseline = editBaselineRef.current;
    setCurrentContent(baseline);
    onContentDraftChange?.(baseline);
    reset();
  };

  const handleSaveEdits = () => {
    void runSave();
  };

  const authorInitialsDisplay =
    authorInitials ?? (`${authorName.split(" ")[0]?.[0] ?? ""}${authorName.split(" ")[1]?.[0] ?? ""}`.toUpperCase() || "YO");

  const renderPostAuthorHeader = () => (
    <div className="mb-5 flex shrink-0 gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-400 to-brand-500 text-sm font-medium text-white">
        <ProfilePictureWithFallback urls={authorPictureUrls} initials={authorInitialsDisplay} alt={authorName} />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">{authorName}</h3>
        <p className="line-clamp-2 text-[13px] text-slate-500">{authorHeadline}</p>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
          <span>Now</span>
          <span aria-hidden>•</span>
          <span>🌐</span>
        </div>
      </div>
    </div>
  );

  const renderLinkedInPostCard = () => (
    <div className="scrollbar-on-hover flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-black/20 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
        {renderPostAuthorHeader()}
        <textarea
          value={currentContent}
          onChange={e => {
            const next = e.target.value;
            setCurrentContent(next);
            onContentDraftChange?.(next);
            if (onPersistDraft) {
              markDirty();
            }
          }}
          className="scrollbar-on-hover min-h-[12rem] w-full flex-1 resize-none border-none bg-transparent p-0 font-sans text-[15px] leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-200"
          placeholder="Write your post content here..."
        />
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
    </div>
  );

  const renderFloatingPreviewColumn = () => (
    <div className="flex w-full max-w-[min(92vw,36rem)] flex-col lg:h-[min(90vh,calc(100vh-2rem))] lg:max-w-[min(40vw,36rem)]">
      {renderLinkedInPostCard()}
      <button
        type="button"
        onClick={handleImproveDraft}
        disabled={!onImproveWithUnibot || !currentContent.trim()}
        className="mt-4 flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
      >
        <Wand2 size={16} />
        Improve with Unibot
      </button>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${MODAL_OVERLAY_Z_CLASS} overflow-y-auto bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200 sm:p-6 lg:p-8`}
      onClick={e => {
        if (e.target === e.currentTarget && !isSubmitting && !showSuccess) {
          onClose();
        }
      }}
    >
      <div className="mx-auto flex min-h-full w-full max-w-[min(96vw,72rem)] items-center justify-center py-2">
        <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-stretch lg:justify-center lg:gap-8">
          {/* Left: floating LinkedIn preview — transparent, sits on backdrop */}
          <div className="order-1 flex justify-center lg:justify-end">{renderFloatingPreviewColumn()}</div>

          {/* Right: Review & Schedule panel */}
          <div className="relative order-2 flex w-full max-w-md shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900 lg:h-[min(90vh,calc(100vh-2rem))]">
            {errorToast ? (
              <div className="absolute right-4 top-16 z-30 animate-in slide-in-from-top-2 fade-in duration-200">
                <div
                  role="status"
                  aria-live="polite"
                  className="max-w-[20rem] rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-lg dark:border-rose-900/40 dark:bg-rose-950/60 dark:text-rose-200"
                >
                  {errorToast}
                </div>
              </div>
            ) : null}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="font-sans text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Review & Schedule</h2>
                {onPersistDraft ? (
                  <div className="mt-1 w-full">
                    <DocumentSaveStatusBar
                      variant="modal"
                      hasPendingUnsavedChanges={hasPendingUnsavedChanges}
                      isSaving={isSaving}
                      savedConfirmationVisible={savedConfirmationVisible}
                      onSaveNow={() => void handleSaveEdits()}
                      onCancel={handleCancelEdits}
                      visible={hasPendingUnsavedChanges || isSaving || savedConfirmationVisible}
                    />
                  </div>
                ) : null}
                {actionStatus ? <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">{actionStatus}</p> : null}
              </div>
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

            <div className="scrollbar-on-hover min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {contentTooShort ? (
                <p className="mb-4 text-sm text-amber-700 dark:text-amber-300" role="status">
                  {LINKEDIN_POST_TOO_SHORT_MESSAGE}
                </p>
              ) : null}

              {publishBlocked ? (
                <div className="mb-4">
                  <LinkedInPublishAccessNotice access={linkedInPublishAccess} userId={userId} />
                </div>
              ) : null}

              <div className={`space-y-4 ${contentTooShort ? "pointer-events-none opacity-50" : ""}`}>
                <div
                  className={`relative flex flex-col justify-between rounded-2xl border-2 p-5 transition-all ${
                    isScheduling
                      ? "border-slate-200 bg-slate-50/80 opacity-50 dark:border-slate-700 dark:bg-slate-900/40"
                      : "border-brand-500 bg-brand-50/50 dark:bg-brand-900/10"
                  }`}
                  aria-disabled={isScheduling}
                >
                  <div>
                    <span className="mb-1 block text-base font-medium text-slate-900 dark:text-white">Post to LinkedIn</span>
                    <span className="text-xs text-slate-500">
                      {isScheduling ? "Turn off scheduling to post immediately" : "Share with your professional network"}
                    </span>
                  </div>
                  <div
                    className={`absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-all ${
                      isScheduling ? "border-slate-300 dark:border-slate-600" : "scale-110 border-brand-600 bg-brand-600"
                    }`}
                  >
                    {!isScheduling ? <CheckCircle2 size={14} className="text-white" /> : null}
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-2 transition-all ${
                    isScheduling
                      ? "border-brand-400 bg-brand-50/60 ring-1 ring-brand-500/30 dark:border-brand-700 dark:bg-brand-950/30"
                      : "border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-slate-200/40 dark:hover:bg-slate-800/40">
                    <div>
                      <span className="block text-sm font-medium text-slate-800 dark:text-white">Schedule for later</span>
                      <span className="text-xs text-slate-500">Pick a date and time on LinkedIn</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isScheduling}
                      disabled={!linkedInPublishAccess.canSchedule || publishActionsDisabled}
                      onClick={() => setIsScheduling(!isScheduling)}
                      className={`h-7 w-12 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
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
                    <div className="space-y-3 px-2 pb-2 pt-0">
                      <LinkedInScheduleDateTimePicker
                        scheduleDate={scheduleDate}
                        scheduleTime={scheduleTime}
                        onScheduleDateChange={setScheduleDate}
                        onScheduleTimeChange={setScheduleTime}
                        linkedInPublishAccess={linkedInPublishAccess}
                      />
                      {scheduleBeyondSession ? (
                        <LinkedInPublishAccessNotice
                          access={linkedInPublishAccess}
                          userId={userId}
                          variant="inline"
                          scheduleBeyondSession
                          sessionEndsLabel={sessionEndsLabel}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 px-6 py-5 dark:border-slate-800">
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
                disabled={confirmDisabled}
                title={
                  contentTooShort
                    ? LINKEDIN_POST_TOO_SHORT_MESSAGE
                    : publishBlocked
                      ? linkedInPublishAccess.blockReason === "connect"
                        ? "Connect LinkedIn to post"
                        : "Sign in with LinkedIn again to post"
                      : scheduleBeyondSession
                        ? "Choose a date within your LinkedIn connection window"
                        : undefined
                }
                className="flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3 text-sm font-medium text-white shadow-xl shadow-brand-500/20 transition-all hover:bg-brand-700 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
              >
                {isSubmitting ? (isScheduling ? "Scheduling…" : "Posting…") : isScheduling ? "Schedule Post" : "Post Now"}
                <Send size={16} className={isScheduling || isSubmitting ? "hidden" : ""} />
              </button>
            </div>

            {showSuccess ? (
              <div className="absolute inset-0 z-20 flex animate-in fade-in items-center justify-center bg-white/80 backdrop-blur-sm duration-200 dark:bg-slate-900/80">
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
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PostSchedulerModal;
