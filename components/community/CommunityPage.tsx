import React, { useState } from "react";
import { ArrowLeft, Users, Bell, MoreHorizontal, Pin } from "lucide-react";
import Image from "next/image";
import CreatePostBox from "./Feed/CreatePostBox";
import { MOCK_POSTS, Community } from "./Feed/FeedHelper";
import PostCard from "./Feed/PostCard";

interface CommunityPageProps {
  communityId: string;
  onBack: () => void;
  onViewProfile: (userId: string) => void;
}

const CommunityPage: React.FC<CommunityPageProps> = ({ communityId, onBack, onViewProfile }) => {
  const [isJoined, setIsJoined] = useState(true);

  // Mock Community Data (In real app, fetch by ID)
  const communityInfo = {
    name: "UX/UI Design",
    icon: "🎨",
    description:
      "The place to share and discuss everything related to User Experience and User Interface optimization. Show your work, ask for feedback, and grow together.",
    members: "142k",
    online: "1.2k",
    bannerUrl: "https://images.unsplash.com/photo-1558655146-d09347e0b7a8?w=1000&q=80",
  };

  // Filter Posts
  // MOCK: Showing all posts for demo, but filter by communityId in real app
  const communityPosts = MOCK_POSTS;

  return (
    <div className="animate-in fade-in duration-300">
      {/* Nav Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-4"
      >
        <ArrowLeft size={16} /> Back to Feed
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm mb-6">
        <div className="h-32 bg-slate-200 relative">
          <Image src={communityInfo.bannerUrl} alt="Banner" fill sizes="1000px" className="object-cover" />
        </div>
        <div className="px-6 pb-6">
          <div className="flex justify-between items-start">
            <div className="flex gap-4 -mt-6">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-[#1a1a1a] p-1 shadow-sm">
                <div className="w-full h-full rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-4xl border border-slate-100 dark:border-white/5">
                  {communityInfo.icon}
                </div>
              </div>
              <div className="mt-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{communityInfo.name}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {communityInfo.members} members
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {communityInfo.online} online
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="p-2 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5">
                <Bell size={20} className="text-slate-500" />
              </button>
              <button
                onClick={() => setIsJoined(!isJoined)}
                className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isJoined
                    ? "border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:border-red-500 hover:text-red-500"
                    : "bg-brand-600 hover:bg-brand-700 text-white"
                }`}
              >
                {isJoined ? "Joined" : "Join Community"}
              </button>
            </div>
          </div>
          <p className="mt-4 text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed text-sm">{communityInfo.description}</p>
        </div>
      </div>

      {/* Pinned / Important Section */}
      <div className="mb-8">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 px-1">Pinned Updates</h3>
        <div className="bg-brand-50/50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/20 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="mt-1 min-w-[32px] w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600">
              <Pin size={16} />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1">Community Guidelines & Weekly Events</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Welcome to correct our new members! Please read the rules before posting. Join us every Friday for our &quot;Design
                Critique&quot; session at 4 PM EST.
              </p>
              <div className="mt-3 flex gap-4 text-xs font-medium text-slate-500">
                <span>Posted by Mod Team</span>
                <span>• 2 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post */}
      <div className="mb-6">
        <CreatePostBox />
      </div>

      {/* Feed */}
      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-1">Latest Discussions</h3>
      <div className="flex flex-col">
        {communityPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onViewProfile={onViewProfile}
            onNavToCommunity={() => {}} // Already here
          />
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
