import React from "react";
import { UserPlus, MessageSquare, Users } from "lucide-react";
import Image from "next/image";
import { Author } from "./FeedHelper";

interface UserPreviewCardProps {
  author: Author;
  onClose: () => void;
  onViewProfile: () => void;
}

const UserPreviewCard: React.FC<UserPreviewCardProps> = ({ author, onViewProfile }) => {
  return (
    <div className="w-80 bg-white dark:bg-slate-950 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden z-50">
      {/* Banner */}
      <div className="h-20 bg-slate-200 dark:bg-white/5 relative">
        {author.bannerUrl && <Image src={author.bannerUrl} alt="Cover" fill sizes="320px" className="object-cover" />}
      </div>

      <div className="px-4 pb-4">
        {/* Avatar */}
        <div className="relative -top-8 mb-[-1.5rem] flex justify-between items-end">
          <div className="w-20 h-20 rounded-full p-1 bg-white dark:bg-slate-950">
            <div className="w-full h-full rounded-full bg-slate-100 overflow-hidden relative">
              {author.avatarUrl ? (
                <Image src={author.avatarUrl} alt={author.name} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-500 text-white font-medium text-2xl">
                  {author.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8">
          <h3 className="font-medium text-lg text-slate-900 dark:text-white flex items-center gap-1">
            {author.name}
            {author.isVerified && <span className="text-brand-500 text-sm">✓</span>}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug mb-3">{author.title}</p>

          {/* Mutuals */}
          {author.mutualCommunities && author.mutualCommunities.length > 0 && (
            <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
              <Users size={14} className="text-brand-500" />
              <span>
                You both follow <span className="font-medium text-slate-700 dark:text-slate-300">{author.mutualCommunities[0]}</span>
                {author.mutualCommunities.length > 1 && ` and ${author.mutualCommunities.length - 1} others`}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-1.5 rounded-full text-sm font-medium transition-colors">
              <UserPlus size={16} />
              Connect
            </button>
            <button
              onClick={onViewProfile}
              className="flex items-center justify-center gap-2 border border-slate-300 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 py-1.5 rounded-full text-sm font-medium transition-colors"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreviewCard;
