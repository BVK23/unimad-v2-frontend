"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { MODAL_OVERLAY_Z_CLASS } from "@/lib/ui/modal-overlay";
import { X, Search, Filter } from "lucide-react";
import LinkedInPostListCard, { LinkedInListItem } from "./LinkedInPostListCard";

interface AllPostsModalProps {
  onClose: () => void;
  initialTab: "scheduled" | "history";
  scheduledPosts: LinkedInListItem[];
  historyPosts: Array<LinkedInListItem & { status?: string; stats?: string }>;
  onPostClick: (post: LinkedInListItem, type: "scheduled" | "history") => void;
  onDeletePost?: (id: string | number, type: "scheduled" | "history") => void;
}

const matchesPostSearch = (post: LinkedInListItem, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return post.topic?.toLowerCase().includes(q) || post.content.toLowerCase().includes(q) || (post.mood?.toLowerCase().includes(q) ?? false);
};

const AllPostsModal: React.FC<AllPostsModalProps> = ({ onClose, initialTab, scheduledPosts, historyPosts, onPostClick, onDeletePost }) => {
  const [activeTab, setActiveTab] = useState<"scheduled" | "history">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Posted" | "Draft">("All");

  const currentPosts = activeTab === "scheduled" ? scheduledPosts : historyPosts;

  const filteredPosts = currentPosts.filter(post => {
    if (!matchesPostSearch(post, searchQuery)) return false;
    if (activeTab !== "history") return true;
    const historyPost = post as LinkedInListItem & { status?: string };
    return filterStatus === "All" || historyPost.status === filterStatus;
  });

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${MODAL_OVERLAY_Z_CLASS} flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200`}
    >
      <div className="flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">All Posts</h2>
            <div className="inline-flex rounded-full bg-slate-100 p-0.5 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setActiveTab("scheduled")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === "scheduled"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                Scheduled ({scheduledPosts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === "history"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                History ({historyPosts.length})
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by topic or content..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          {activeTab === "history" && (
            <div className="relative min-w-[120px]">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as "All" | "Posted" | "Draft")}
                className="h-full w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="All">All status</option>
                <option value="Draft">Draft</option>
                <option value="Posted">Posted</option>
              </select>
            </div>
          )}
        </div>

        <div className="scrollbar-on-hover flex-1 space-y-3 overflow-y-auto bg-slate-50/30 p-4 dark:bg-slate-900">
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => {
              const historyPost = post as LinkedInListItem & { status?: string; stats?: string };
              return (
                <div key={post.id}>
                  <LinkedInPostListCard
                    post={post}
                    onClick={() => onPostClick(post, activeTab)}
                    onDelete={onDeletePost ? id => onDeletePost(id, activeTab) : undefined}
                  />
                  {activeTab === "history" && historyPost.stats && historyPost.stats !== "—" ? (
                    <p className="mt-1 px-1 text-[10px] text-slate-400">{historyPost.stats}</p>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-slate-400">
              <p className="text-sm">
                {searchQuery
                  ? `No matches for "${searchQuery}"`
                  : activeTab === "scheduled"
                    ? "No scheduled posts yet."
                    : "No history yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AllPostsModal;
