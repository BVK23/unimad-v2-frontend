import React from "react";
import StudioListDeleteButton from "./StudioListDeleteButton";
import { DocumentLibraryItem } from "./documentLibraryTypes";

interface DocumentListCardProps {
  doc: DocumentLibraryItem;
  onClick: () => void;
  onDelete?: (id: string | number) => void;
  isSelected?: boolean;
}

const DocumentListCard: React.FC<DocumentListCardProps> = ({ doc, onClick, onDelete, isSelected = false }) => {
  const [roleTitle, companyName] = doc.title.includes(" @ ") ? doc.title.split(" @ ") : [doc.title, ""];

  return (
    <div
      className={`group/card relative w-full rounded-xl border transition-all ${
        isSelected
          ? "border-brand-500/50 bg-brand-50 shadow-sm ring-1 ring-brand-500/25 dark:border-brand-500/40 dark:bg-brand-900/40 dark:ring-brand-500/30"
          : "border-slate-200/80 bg-slate-100 hover:border-slate-300 hover:bg-slate-200/90 hover:shadow-sm dark:border-slate-700/80 dark:bg-slate-800/90 dark:hover:border-slate-600 dark:hover:bg-slate-800"
      }`}
    >
      <button type="button" onClick={onClick} className="w-full p-3 pr-9 text-left">
        <div className="flex flex-col gap-0.5">
          {companyName ? (
            <>
              <h4
                className={`truncate text-sm font-medium ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-100"}`}
              >
                {companyName.trim()}
              </h4>
              <p
                className={`truncate text-[13px] ${isSelected ? "text-slate-700 dark:text-slate-200" : "text-slate-600 dark:text-slate-300"}`}
              >
                {roleTitle.trim()}
              </p>
            </>
          ) : (
            <h4
              className={`truncate text-sm font-medium ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-100"}`}
            >
              {doc.title}
            </h4>
          )}
          {doc.contactName ? (
            <p
              className={`truncate text-[12px] ${isSelected ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"}`}
            >
              {doc.topic === "cold-email" ? `Hiring manager: ${doc.contactName}` : `Connection: ${doc.contactName}`}
            </p>
          ) : null}
          <div
            className={`mt-1 text-[11px] font-medium ${isSelected ? "text-brand-700 dark:text-brand-300" : "text-slate-500 dark:text-slate-400"}`}
          >
            {doc.date}
            {doc.status ? ` · ${doc.status}` : ""}
          </div>
        </div>
      </button>
      {onDelete && (
        <StudioListDeleteButton
          ariaLabel="Delete draft"
          onClick={e => {
            e.stopPropagation();
            onDelete(doc.id);
          }}
        />
      )}
    </div>
  );
};

export default DocumentListCard;
