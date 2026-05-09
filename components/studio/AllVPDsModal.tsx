import React, { useState } from "react";
import { X, FileText, Search } from "lucide-react";

interface AllVPDsModalProps {
  onClose: () => void;
  vpds: any[];
  onVPClick: (vpd: any) => void;
}

const AllVPDsModal: React.FC<AllVPDsModalProps> = ({ onClose, vpds, onVPClick }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVPDs = vpds.filter(vpd => vpd.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 h-[70vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#1a1a1a]">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white font-sans tracking-tight">All VPDs</h2>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-medium">
              {vpds.length} documents
            </span>
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
              placeholder="Search documents..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-[#111]">
          {filteredVPDs.length > 0 ? (
            filteredVPDs.map(vpd => (
              <div
                key={vpd.id}
                onClick={() => onVPClick(vpd)}
                className="p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all cursor-pointer group shadow-sm hover:shadow-md flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-slate-900 dark:text-white mb-0.5">{vpd.title}</h4>
                  <p className="text-xs text-slate-500">{vpd.date}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <p>No documents found matching &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllVPDsModal;
