import React, { useState } from 'react';
import { X, Send, CheckCircle2, Edit2, Wand2 } from 'lucide-react';

interface PostSchedulerModalProps {
    content: string;
    onClose: () => void;
    onPost: (finalContent: string, isScheduled: boolean, scheduleDate?: Date) => void;
    /** Opens content in the main preview (closes modal). */
    onEditToPreview?: (content: string) => void;
    authorName?: string;
    authorImage?: string; // URL or Initials if not provided
    authorHeadline?: string;
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
    authorName = "Abhi B.",
    authorHeadline = "Product Designer @ Unimad",
    initialData
}) => {
    const [mode, setMode] = useState<'preview' | 'edit'>('preview');
    const [currentContent, setCurrentContent] = useState(content);
    const [postToLinkedin, setPostToLinkedin] = useState(true);

    // Simple scheduling state - in a real app this would be a full date picker
    const [isScheduling, setIsScheduling] = useState(initialData?.isScheduled || false);
    // Parse initial date if exists
    const initialDateStr = initialData?.date ? initialData.date.toISOString().split('T')[0] : '';
    const initialTimeStr = initialData?.date ? initialData.date.toTimeString().split(' ')[0].slice(0, 5) : ''; // HH:MM

    const [scheduleDate, setScheduleDate] = useState<string>(initialDateStr);
    const [scheduleTime, setScheduleTime] = useState<string>(initialTimeStr);

    const handleConfirm = () => {
        if (isScheduling && (!scheduleDate || !scheduleTime)) {
            // Ideally show error
            return;
        }

        const date = isScheduling ? new Date(`${scheduleDate}T${scheduleTime}`) : undefined;
        // In a real implementation, we'd also handle the postToUnimad flag here (e.g., pass it up)
        onPost(currentContent, isScheduling, date);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#1a1a1a]">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white font-sans tracking-tight">Review & Schedule</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} className="text-slate-400 hover:text-slate-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Mode Toggle REMOVED as per request */}

                    {mode === 'preview' ? (
                        <div className="relative group">
                            <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm min-h-[16rem]">
                                {/* LinkedIn-like Post Header */}
                                <div className="flex gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-medium text-sm">
                                        {authorName.split(' ')[0][0]}{authorName.split(' ')[1]?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900 dark:text-white text-sm">{authorName}</h3>
                                        <p className="text-xs text-slate-500">{authorHeadline}</p>
                                        <div className="flex items-center gap-1 text-xs text-slate-400"><span>Now</span> • 🌐</div>
                                    </div>
                                </div>
                                <div className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                                    {currentContent}
                                </div>
                            </div>

                            {/* Hover Edit Overlay */}
                            <div className="absolute inset-0 bg-white/90 dark:bg-black/90 rounded-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center pointer-events-none group-hover:pointer-events-auto backdrop-blur-sm">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onEditToPreview) {
                                            onEditToPreview(currentContent);
                                        } else {
                                            setMode('edit');
                                        }
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-xl font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all active:scale-95 pointer-events-auto"
                                >
                                    <Edit2 size={16} /> Edit Post Content
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-1">
                            <textarea
                                value={currentContent}
                                onChange={(e) => setCurrentContent(e.target.value)}
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
                                    onClick={() => setMode('preview')}
                                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    <div className="mt-8 space-y-4">

                        {/* Cross-post option */}
                        {/* Cross-post option */}
                        <div className="grid grid-cols-2 gap-4">
                            <label className={`relative flex flex-col justify-between p-5 border-2 rounded-2xl cursor-pointer transition-all ${postToLinkedin ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111] hover:border-slate-300'}`}>
                                <div>
                                    <span className="font-medium text-slate-900 dark:text-white text-base block mb-1">Post to LinkedIn</span>
                                    <span className="text-xs text-slate-500">Share with your professional network</span>
                                </div>
                                <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${postToLinkedin ? 'bg-blue-600 border-blue-600 scale-110' : 'border-slate-300 dark:border-slate-600'}`}>
                                    {postToLinkedin && <CheckCircle2 size={14} className="text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={postToLinkedin} onChange={(e) => setPostToLinkedin(e.target.checked)} />
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
                        </div>

                        {/* Scheduling Toggle */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-900/80">
                            <div className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-800/60">
                                <span className="text-sm font-medium text-slate-800 dark:text-white">
                                    Schedule for later
                                </span>
                                <div
                                    onClick={() => setIsScheduling(!isScheduling)}
                                    className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 ${isScheduling ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${isScheduling ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>

                            {isScheduling && (
                                <div className="p-4 pt-0 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                    <input
                                        type="date"
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800"
                                    />
                                    <input
                                        type="time"
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1a1a1a] flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-200 rounded-full transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 text-sm"
                    >
                        {isScheduling ? 'Schedule Post' : 'Post Now'}
                        <Send size={16} className={isScheduling ? "hidden" : ""} />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PostSchedulerModal;
