import React, { useState } from "react";
import { X, Calendar, History, Search, Trash2, Filter } from "lucide-react";

interface AllPostsModalProps {
  onClose: () => void;
  initialTab: "scheduled" | "history";
  scheduledPosts: any[];
  historyPosts: any[];
  onPostClick: (post: any, type: "scheduled" | "history") => void;
  onDeletePost?: (id: string, type: "scheduled" | "history") => void;
}

const AllPostsModal: React.FC<AllPostsModalProps> = ({ onClose, initialTab, scheduledPosts, historyPosts, onPostClick, onDeletePost }) => {
  const [activeTab, setActiveTab] = useState<"scheduled" | "history">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Posted" | "Draft">("All");

  const currentPosts = activeTab === "scheduled" ? scheduledPosts : historyPosts;
  const filteredPosts = currentPosts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "All" || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#1a1a1a]">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white font-sans tracking-tight">All Posts</h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab("scheduled")}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${activeTab === "scheduled" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Calendar size={12} /> Scheduled ({scheduledPosts.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${activeTab === "history" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <History size={12} /> History ({historyPosts.length})
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1a1a1a] flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            />
          </div>
          {activeTab === "history" && (
            <div className="relative min-w-[120px]">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="w-full h-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-medium appearance-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Posted">Posted</option>
                <option value="Draft">Drafts</option>
              </select>
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-[#111]">
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <div
                key={post.id}
                onClick={() => onPostClick(post, activeTab)}
                className="p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all cursor-pointer group shadow-sm hover:shadow-md"
              >
                <p className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2 mb-3 leading-relaxed">"{post.content}"</p>
                <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    {activeTab === "scheduled" ? <Calendar size={12} /> : <History size={12} />}
                    <span className="font-medium">{post.date}</span>
                    {activeTab === "history" && post.status && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ml-2 ${post.status === "Posted" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}
                      >
                        {post.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    {activeTab === "history" && <span>{post.stats}</span>}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeletePost?.(post.id, activeTab);
                      }}
                      className="p-1 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors ml-2"
                      title="Delete post"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <p>No posts found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllPostsModal;
