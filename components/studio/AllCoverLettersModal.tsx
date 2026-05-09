import React, { useState } from "react";
import type { CoverLetterAsset } from "@/features/cover-letter/types";
import { X, History, Search } from "lucide-react";

interface AllCoverLettersModalProps {
  onClose: () => void;
  historyItems: CoverLetterAsset[];
  onItemClick: (item: CoverLetterAsset) => void;
}

const AllCoverLettersModal: React.FC<AllCoverLettersModalProps> = ({ onClose, historyItems, onItemClick }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const currentItems = historyItems;

  const normalized = searchQuery.toLowerCase();
  const filteredItems = currentItems.filter(item => {
    const company = (item.company || "").toLowerCase();
    const role = (item.role || "").toLowerCase();
    const content = (item.content || "").toLowerCase();
    return company.includes(normalized) || role.includes(normalized) || content.includes(normalized);
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#1a1a1a]">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white font-sans tracking-tight">Cover Letters</h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 px-4 py-1.5 text-xs font-medium text-blue-600 shadow-sm items-center gap-2">
              <History size={12} /> History ({historyItems.length})
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1a1a1a]">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search cover letters..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-[#111]">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemClick(item)}
                className="w-full text-left p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.company || "Untitled"}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{item.role || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <History size={12} />
                    <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{item.content}</p>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <p>
                No cover letters found
                {searchQuery ? ` matching "${searchQuery}"` : ""}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllCoverLettersModal;
