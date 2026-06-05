import React, { useState } from 'react';
import { Author, MOCK_POSTS, Post } from '../Feed/FeedHelper';
import PostCard from '../Feed/PostCard';
import { ArrowLeft, MapPin, Link as LinkIcon, Calendar, MessageCircle, UserPlus, MoreHorizontal, Briefcase, Share2, Flag, ShieldBan, Users } from 'lucide-react';

interface UserProfileViewProps {
    userId: string;
    onBack: () => void;
    onMessage?: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ userId, onBack, onMessage }) => {
    const [showMenu, setShowMenu] = useState(false);

    // In a real app, fetch user by ID. Here we find from MOCK_POSTS or mock it.
    const userPost = MOCK_POSTS.find(p => p.author.id === userId);
    const author = userPost?.author || {
        id: userId,
        name: "Unknown User",
        title: "Community Member",
        avatarUrl: undefined,
        bannerUrl: undefined,
        isVerified: false
    };

    // Filter posts by this user
    const userPosts = MOCK_POSTS.filter(p => p.author.id === userId);

    return (
        <div className="space-y-4">
            {/* Header / Back */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-2"
            >
                <ArrowLeft size={16} /> Back to Feed
            </button>

            {/* Profile Header Card */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                {/* Cover Info */}
                <div className="h-32 md:h-48 bg-slate-200 dark:bg-slate-800 relative">
                    {author.bannerUrl ? (
                        <img src={author.bannerUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-brand-600 to-blue-600"></div>
                    )}
                </div>

                <div className="px-6 pb-6 relative">
                    {/* Avatar & Action Buttons Row */}
                    <div className="flex flex-col md:flex-row justify-between items-end -mt-10 mb-4 gap-4 md:gap-0">
                        <div className="w-32 h-32 rounded-full p-1.5 bg-white dark:bg-[#0a0a0a]">
                            <div className="w-full h-full rounded-full bg-slate-100 overflow-hidden">
                                {author.avatarUrl ? (
                                    <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-brand-500 text-white font-medium text-4xl">
                                        {author.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 mb-2 relative">
                            {/* Three Dot Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-2 border border-slate-300 dark:border-white/20 rounded-full hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-white transition-colors"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                                {showMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                                        <div className="absolute top-full mt-2 left-0 w-48 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                            <button className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                <Share2 size={16} /> Share Profile
                                            </button>
                                            <button className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                <Flag size={16} /> Report User
                                            </button>
                                            <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2">
                                                <ShieldBan size={16} /> Block User
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button className="p-2 sm:px-4 sm:py-2 border border-slate-300 dark:border-white/10 rounded-lg font-medium text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors">
                                <UserPlus size={18} /> <span className="hidden sm:inline">Connect</span>
                            </button>
                            <button className="p-2 sm:px-4 sm:py-2 border border-slate-300 dark:border-white/10 rounded-lg font-medium text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors">
                                <Briefcase size={18} /> <span className="hidden sm:inline">Portfolio</span>
                            </button>
                            <button
                                onClick={onMessage}
                                className="p-2 sm:px-4 sm:py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm shadow-brand-500/20"
                            >
                                <MessageCircle size={18} /> <span className="hidden sm:inline">Message</span>
                            </button>
                        </div>
                    </div>

                    {/* Text Info */}
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            {author.name}
                            {author.isVerified && <span className="text-brand-500" title="Verified">✓</span>}
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-3">{author.title}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                            <span className="flex items-center gap-1"><MapPin size={14} /> San Francisco, CA</span>
                            <span className="flex items-center gap-1"><LinkIcon size={14} /> unimad.com</span>
                            <span className="flex items-center gap-1"><Calendar size={14} /> Joined March 2024</span>
                        </div>

                        {/* Mutual Communities & Connections */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-lg w-fit">
                                <Users size={14} className="text-brand-500" />
                                <span>You both follow <span className="font-medium">Design Systems</span> and <span className="font-medium">UX Research</span></span>
                            </div>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                <span className="font-medium text-slate-900 dark:text-white">500+</span> Connections
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Content Tabs */}
            <div className="border-b border-slate-200 dark:border-white/5 flex gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
                <button className="pb-3 border-b-2 border-brand-500 text-slate-900 dark:text-white">Posts</button>
                <button className="pb-3 hover:text-slate-900 dark:hover:text-white transition-colors">Comments</button>
                <button className="pb-3 hover:text-slate-900 dark:hover:text-white transition-colors">About</button>
            </div>

            {/* User Posts Feed */}
            <div className="space-y-4">
                {userPosts.length > 0 ? (
                    userPosts.map(post => (
                        <PostCard key={post.id} post={post} onViewProfile={() => { }} />
                    ))
                ) : (
                    <div className="text-center py-10 text-slate-500">
                        No posts yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfileView;
