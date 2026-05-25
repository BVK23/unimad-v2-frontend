import React, { useState } from "react";
import { X, Search } from "lucide-react";
import VpdLibraryCard, { VpdLibraryItem } from "./VpdLibraryCard";

interface AllVPDsModalProps {
  onClose: () => void;
  vpds: VpdLibraryItem[];
  onVPClick: (vpd: VpdLibraryItem) => void;
  initialTab?: "recents" | "templates";
}

const AllVPDsModal: React.FC<AllVPDsModalProps> = ({ onClose, vpds, onVPClick, initialTab = "recents" }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [libraryTab, setLibraryTab] = useState<"recents" | "templates">(initialTab);

  const recents = vpds.filter(v => !v.isTemplate);
  const templates = vpds.filter(v => v.isTemplate);
  const activeList = libraryTab === "recents" ? recents : templates;

  const filteredVPDs = activeList.filter(vpd => vpd.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex h-[75vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-[#1a1a1a]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex min-w-0 flex-wrap items-center gap-4">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">All VPDs</h2>
            <div className="inline-flex rounded-full bg-slate-100 p-0.5 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setLibraryTab("recents")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  libraryTab === "recents"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                Recents ({recents.length})
              </button>
              <button
                type="button"
                onClick={() => setLibraryTab("templates")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  libraryTab === "templates"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                Templates ({templates.length})
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

        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4 dark:bg-[#111]">
          {filteredVPDs.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {filteredVPDs.map(vpd => (
                <VpdLibraryCard key={vpd.id} vpd={vpd} onClick={() => onVPClick(vpd)} />
              ))}
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-slate-400">
              <p className="text-sm">
                {searchQuery
                  ? `No documents found matching "${searchQuery}"`
                  : libraryTab === "recents"
                    ? "No recent VPDs yet."
                    : "No templates found."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllVPDsModal;
