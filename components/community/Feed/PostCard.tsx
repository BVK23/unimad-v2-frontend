import React, { useState, useRef } from 'react';
import { Post } from './FeedHelper';
import { MessageSquare, Share2, Heart, MoreHorizontal, ExternalLink, Bookmark } from 'lucide-react';
import UserPreviewCard from './UserPreviewCard';

interface PostCardProps {
    post: Post;
    onViewProfile: (userId: string) => void;
    onNavToCommunity?: (communityId: string) => void; // Added Nav Prop
}

const PostCard: React.FC<PostCardProps> = ({ post, onViewProfile, onNavToCommunity }) => {
    const [likes, setLikes] = useState(post.likes);
    const [isLiked, setIsLiked] = useState(post.isLiked || false);
    const [isSaved, setIsSaved] = useState(false);
    const [userHovered, setUserHovered] = useState(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isAd = post.type === 'job_ad' || post.type === 'webinar_ad';

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setUserHovered(true);
    };

    const handleMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setUserHovered(false);
        }, 300);
    };

    const toggleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLiked) {
            setLikes(p => p - 1);
            setIsLiked(false);
        } else {
            setLikes(p => p + 1);
            setIsLiked(true);
        }
    };

    const toggleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsSaved(prev => !prev);
    };

    return (
        // FEED ITEM CONTAINER
        // Regular Post: Transparent, Border Bottom, Padding Vertical
        // Ad: White BG, Border All, Rounded, Shadow, Margin Vertical
        <div className={`transition-all duration-200
            ${isAd
                ? 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm rounded-xl p-5 my-6'
                : 'bg-transparent border-b border-slate-100 dark:border-white/5 py-3 hover:bg-slate-50/30 dark:hover:bg-white/[0.02]'
            }
        `}>

            <div className="flex">
                <div className="flex-1">

                    {/* Header Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5 relative z-10 w-full overflow-hidden text-ellipsis whitespace-nowrap">
                        {post.community && (
                            <>
                                <button
                                    onClick={() => onNavToCommunity && onNavToCommunity(post.community!.id)}
                                    className="font-medium text-slate-900 dark:text-slate-200 hover:underline cursor-pointer flex items-center gap-1"
                                >
                                    {post.community.icon} {post.community.name}
                                </button>
                                <span>•</span>
                            </>
                        )}

                        <span className="flex items-center gap-1">
                            <span className="flex items-center gap-2">
                                {/* Small Avatar for Author */}
                                <div
                                    className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden cursor-pointer"
                                    onClick={() => onViewProfile(post.author.id)}
                                >
                                    {post.author.avatarUrl && <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div
                                    className="relative inline-block"
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <button
                                        onClick={() => onViewProfile(post.author.id)}
                                        className="font-medium text-slate-900 dark:text-slate-200 hover:underline"
                                    >
                                        {post.author.name}
                                    </button>

                                    {/* User Preview Popover */}
                                    {userHovered && (
                                        <div className="absolute top-full left-0 mt-2 z-[100]">
                                            <UserPreviewCard
                                                author={post.author}
                                                onClose={() => setUserHovered(false)}
                                                onViewProfile={() => onViewProfile(post.author.id)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </span>
                        </span>

                        <span>•</span>
                        <span>{post.timestamp}</span>

                        {isAd && (
                            <span className="bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ml-auto">
                                Promoted
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    {post.title && (
                        <h3 className="text-base font-medium text-slate-900 dark:text-white mb-1.5 leading-snug cursor-pointer hover:text-brand-600 max-w-3xl">
                            {post.title}
                        </h3>
                    )}

                    {/* Content Body */}
                    <div className="text-sm text-slate-800 dark:text-slate-200 mb-2 whitespace-pre-wrap leading-relaxed max-w-2xl">
                        {post.content}
                    </div>

                    {/* Media / Ad Image */}
                    {post.imageUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-slate-100 dark:border-white/5 bg-slate-900">
                            <img src={post.imageUrl} alt="Post content" className="w-full h-auto max-h-[460px] object-contain mx-auto" />
                        </div>
                    )}

                    {/* Ad CTA */}
                    {isAd && post.ctaLabel && (
                        <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-500 uppercase font-medium">Sponsored</span>
                            <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1">
                                {post.ctaLabel} <ExternalLink size={14} />
                            </button>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
                        <button
                            onClick={toggleLike}
                            className={`flex items-center gap-2 px-2 py-1 rounded transition-colors group ${isLiked ? 'text-red-500' : 'hover:bg-slate-100 dark:hover:bg-white/10'}`}
                        >
                            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                            <span>{likes} Likes</span>
                        </button>

                        <button className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 px-2 py-1 rounded transition-colors group">
                            <MessageSquare size={16} />
                            <span>{post.comments} Comments</span>
                        </button>
                        <button className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 px-2 py-1 rounded transition-colors group">
                            <Share2 size={16} />
                            <span>Share</span>
                        </button>

                        <button
                            onClick={toggleSave}
                            className={`flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 px-2 py-1 rounded transition-colors group ${isSaved ? 'text-brand-500' : ''}`}
                        >
                            <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
                            <span>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>

                        <button className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 px-2 py-1 rounded transition-colors group ml-auto">
                            <MoreHorizontal size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
