import React from 'react';
import { X } from 'lucide-react';
import LinkedInPostListCard, { type LinkedInListItem } from '@/components/studio/LinkedInPostListCard';
import StudioSectionDot from '@/components/studio/StudioSectionDot';

interface LinkedInScheduledPostsModalProps {
    posts: LinkedInListItem[];
    onClose: () => void;
    onPostClick: (post: LinkedInListItem) => void;
    onDeletePost: (id: string | number) => void;
}

const LinkedInScheduledPostsModal: React.FC<LinkedInScheduledPostsModalProps> = ({
    posts,
    onClose,
    onPostClick,
    onDeletePost,
}) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-[#1a1a1a]">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <StudioSectionDot />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Scheduled posts</h2>
                    <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {posts.length}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Close"
                >
                    <X size={20} className="text-slate-400" />
                </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/40 p-4 dark:bg-[#111]">
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <LinkedInPostListCard
                            key={post.id}
                            post={post}
                            onClick={() => onPostClick(post)}
                            onDelete={onDeletePost}
                        />
                    ))
                ) : (
                    <p className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400 dark:border-slate-700">
                        Nothing scheduled yet.
                    </p>
                )}
            </div>
        </div>
    </div>
);

export default LinkedInScheduledPostsModal;
