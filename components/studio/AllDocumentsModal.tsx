import React, { useState } from "react";
import { X, Search, History } from "lucide-react";
import DocumentListCard from "./DocumentListCard";
import { DocumentLibraryItem } from "./documentLibraryTypes";

interface AllDocumentsModalProps {
  topicLabel: string;
  documents: DocumentLibraryItem[];
  selectedDocumentId?: string | number | null;
  onClose: () => void;
  onDocumentClick: (doc: DocumentLibraryItem) => void;
  onDeleteDocument: (id: string | number) => void;
}

const AllDocumentsModal: React.FC<AllDocumentsModalProps> = ({
  topicLabel,
  documents,
  selectedDocumentId = null,
  onClose,
  onDocumentClick,
  onDeleteDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const recents = documents.filter(d => d.kind === "recent");
  const history = documents.filter(d => d.kind === "history");
  const combinedList = [...recents, ...history];

  const filtered = combinedList.filter(
    d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex h-[75vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6 dark:border-slate-800">
          <h2 className="truncate text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{topicLabel} — Recents</h2>
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
              placeholder="Search by title or content..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/30 p-4 dark:bg-slate-900">
          {filtered.length > 0 ? (
            filtered.map(doc => (
              <DocumentListCard
                key={doc.id}
                doc={doc}
                isSelected={selectedDocumentId === doc.id}
                onClick={() => onDocumentClick(doc)}
                onDelete={onDeleteDocument}
              />
            ))
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-slate-400">
              <History size={24} className="mb-2 opacity-40" />
              <p className="text-sm">{searchQuery ? `No matches for "${searchQuery}"` : "No recent drafts yet."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllDocumentsModal;
