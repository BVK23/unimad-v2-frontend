import React, { useEffect, useState } from "react";
import { X, Calendar, Send, CheckCircle2, Edit2, Wand2 } from "lucide-react";

export type LinkedinPreviewPendingItem = { id: string; objectUrl: string };

interface PostSchedulerModalProps {
  content: string;
  onClose: () => void;
  onPost: (finalContent: string, isScheduled: boolean, scheduleDate?: Date) => void | Promise<void>;
  authorName?: string;
  authorImage?: string; // URL or Initials if not provided
  authorHeadline?: string;
  /** Staged blob URLs — shown in preview mode only, same as Content Lab LinkedIn preview */
  linkedinPreviewPendingMedia?: LinkedinPreviewPendingItem[];
  /** Uploaded server URLs — preview mode only */
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
  authorName = "Abhi B.",
  authorHeadline = "Product Designer @ Unimad",
  linkedinPreviewPendingMedia = [],
  linkedinPreviewImages = [],
  initialData,
}) => {
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [currentContent, setCurrentContent] = useState(content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorToast, setErrorToast] = useState("");

  // Simple scheduling state - in a real app this would be a full date picker
  const [isScheduling, setIsScheduling] = useState(initialData?.isScheduled || false);
  // Parse initial date if exists
  const initialDateStr = initialData?.date ? initialData.date.toISOString().split("T")[0] : "";
  const initialTimeStr = initialData?.date ? initialData.date.toTimeString().split(" ")[0].slice(0, 5) : ""; // HH:MM

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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative bg-white dark:bg-[#1a1a1a] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        {errorToast ? (
          <div className="absolute top-4 right-4 z-30 animate-in slide-in-from-top-2 fade-in duration-200">
            <div
              role="status"
              aria-live="polite"
              className="max-w-[22rem] rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-lg dark:border-rose-900/40 dark:bg-rose-950/60 dark:text-rose-200"
            >
              {errorToast}
            </div>
          </div>
        ) : null}

        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#1a1a1a]">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white font-sans tracking-tight">Review & Schedule</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || showSuccess}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:pointer-events-none disabled:opacity-60"
          >
            <X size={20} className="text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden p-6">
          {/* Mode Toggle REMOVED as per request */}

          {mode === "preview" ? (
            <div className="relative group">
              <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm min-h-[16rem] max-h-[42vh] flex flex-col overflow-hidden">
                {/* LinkedIn-like Post Header */}
                <div className="flex gap-3 mb-4 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-medium text-sm">
                    {authorName.split(" ")[0][0]}
                    {authorName.split(" ")[1]?.[0]}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white text-sm">{authorName}</h3>
                    <p className="text-xs text-slate-500">{authorHeadline}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <span>Now</span> • 🌐
                    </div>
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed flex-1 min-h-0 overflow-y-auto pr-1 mb-2">
                  {currentContent}
                </div>
                {linkedinPreviewPendingMedia.length > 0 || linkedinPreviewImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 shrink-0">
                    {linkedinPreviewPendingMedia.map(p => (
                      <div key={p.id} className="relative rounded-lg border border-amber-200 dark:border-amber-800 overflow-hidden">
                        <img src={p.objectUrl} alt="" className="w-full h-32 object-cover" />
                        <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-amber-100/90 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 px-1 rounded">
                          Pending upload
                        </span>
                      </div>
                    ))}
                    {linkedinPreviewImages.map(url => (
                      <img
                        key={url}
                        src={url}
                        alt="LinkedIn media preview"
                        className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Hover Edit Overlay */}
              <div className="absolute inset-0 bg-white/90 dark:bg-black/90 rounded-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center pointer-events-none group-hover:pointer-events-auto backdrop-blur-sm">
                <button
                  onClick={() => setMode("edit")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-xl font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all active:scale-95"
                >
                  <Edit2 size={16} /> Edit Post Content
                </button>
              </div>
            </div>
          ) : (
            <div className="relative border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-1">
              <textarea
                value={currentContent}
                onChange={e => setCurrentContent(e.target.value)}
                className="w-full h-64 p-6 bg-transparent border-none outline-none resize-none text-base font-sans text-slate-800 dark:text-slate-200 leading-relaxed placeholder:text-slate-400"
                placeholder="Write your post content here..."
                autoFocus
              />

              {/* Editor Actions */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                  <Wand2 size={14} /> Improve with Unibot
                </button>
                <button
                  onClick={() => setMode("preview")}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="mt-8 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="relative flex flex-col justify-between p-5 border-2 rounded-2xl border-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white text-base block mb-1">Post to LinkedIn</span>
                  <span className="text-xs text-slate-500">Share with your professional network</span>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-blue-600 border-blue-600 scale-110">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              </div>

              {/* Post to Unimad — commented until community publish API exists
              <label
                className={`relative flex flex-col justify-between p-5 border-2 rounded-2xl cursor-pointer transition-all ${postToUnimad ? "border-teal-500 bg-teal-50/50 dark:bg-teal-900/10" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111] hover:border-slate-300"}`}
              >
                <div>
                  <span className="font-medium text-slate-900 dark:text-white text-base block mb-1">Post to Unimad</span>
                  <span className="text-xs text-slate-500">Share with the community</span>
                </div>
                <div
                  className={`absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${postToUnimad ? "bg-teal-600 border-teal-600 scale-110" : "border-slate-300 dark:border-slate-600"}`}
                >
                  {postToUnimad && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={postToUnimad} onChange={e => setPostToUnimad(e.target.checked)} />
              </label>
              */}
            </div>

            {/* Scheduling Toggle */}
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-2 bg-white dark:bg-[#111]">
              <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="flex items-center gap-3 text-slate-800 dark:text-white font-medium text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    <Calendar size={16} />
                  </div>
                  Schedule for later
                </div>
                <div
                  onClick={() => setIsScheduling(!isScheduling)}
                  className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 ${isScheduling ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${isScheduling ? "translate-x-5" : "translate-x-0"}`}
                  />
                </div>
              </div>

              {isScheduling && (
                <div className="p-4 pt-0 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1a1a1a] flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || showSuccess}
            className="px-6 py-3 text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-200 rounded-full transition-colors text-sm disabled:pointer-events-none disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || showSuccess}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 text-sm disabled:opacity-60 disabled:pointer-events-none"
          >
            {isSubmitting ? "Working…" : isScheduling ? "Schedule Post" : "Post Now"}
            <Send size={16} className={isScheduling || isSubmitting ? "hidden" : ""} />
          </button>
        </div>

        {showSuccess ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 dark:bg-white/10 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="flex flex-col items-center gap-3 animate-in zoom-in-95 duration-300 px-6">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center animate-pulse shadow-lg shadow-blue-500/30">
                <CheckCircle2 size={34} className="text-white" />
              </div>
              <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50 text-center max-w-[22rem]">
                {successMessage}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PostSchedulerModal;
