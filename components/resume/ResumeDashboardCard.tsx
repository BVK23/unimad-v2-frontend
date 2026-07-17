"use client";

import React from "react";
import ResumeCardActionsMenu from "@/components/resume/ResumeCardActionsMenu";
import ResumePublishedBeacon from "@/components/resume/ResumePublishedBeacon";
import ResumeThumbnail from "@/components/resume/ResumeThumbnail";
import { isResumePublished } from "@/features/resume/utils/resumePublish";
import type { ResumeVersionMetadata } from "@/features/resume/utils/resumeVersionGroups";
import type { ResumeData } from "@/types";
import { Check, Clock, Copy, Download, Edit, Link, Loader2, MoreVertical, PenLine, Trash2 } from "lucide-react";

interface ResumeDashboardCardProps {
  resume: ResumeData;
  versionMetadata?: ResumeVersionMetadata;
  activeMenuId: string | null;
  menuAnchorEl: HTMLElement | null;
  duplicatingId: string | null;
  deletingId: string | null;
  settingBaseId: string | null;
  newlyDuplicatedResumeId: string | null;
  copiedLinkResumeId: string | null;
  downloadingId: string | null;
  setCardRef: (id: string, element: HTMLDivElement | null) => void;
  onEditResume: (resume: ResumeData) => void;
  onRename: (e: React.MouseEvent, resume: ResumeData) => void;
  onToggleMenu: (e: React.MouseEvent<HTMLButtonElement>, resumeId: string) => void;
  onCloseMenu: () => void;
  onDuplicate: (e: React.MouseEvent, resume: ResumeData) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onSetBaseResume: (e: React.MouseEvent, resume: ResumeData) => void;
  onCopyLink: (e: React.MouseEvent, resume: ResumeData) => void;
  onDownload: (e: React.MouseEvent, resume: ResumeData) => void;
}

const ResumeDashboardCard: React.FC<ResumeDashboardCardProps> = ({
  resume,
  versionMetadata,
  activeMenuId,
  menuAnchorEl,
  duplicatingId,
  deletingId,
  settingBaseId,
  newlyDuplicatedResumeId,
  copiedLinkResumeId,
  downloadingId,
  setCardRef,
  onEditResume,
  onRename,
  onToggleMenu,
  onCloseMenu,
  onDuplicate,
  onDelete,
  onSetBaseResume,
  onCopyLink,
  onDownload,
}) => {
  const isInVersionFamily = (versionMetadata?.familySize ?? 0) > 1;
  const isMenuOpen = activeMenuId === resume.id;

  return (
    <div
      ref={element => setCardRef(resume.id, element)}
      onClick={() => {
        if (isMenuOpen) return;
        onEditResume(resume);
      }}
      className={`
        w-full min-w-0 bg-white rounded-xl shadow-sm hover:shadow-md border cursor-pointer transition-all hover:-translate-y-1 group relative
        ${isMenuOpen ? "z-30 ring-2 ring-brand-100 pointer-events-none" : "z-0"}
        ${resume.isBase ? "border-brand-300 ring-1 ring-brand-100" : isInVersionFamily ? "border-slate-300 bg-slate-50/80" : "border-slate-200"}
        ${newlyDuplicatedResumeId === resume.id ? "ring-2 ring-brand-400 shadow-md" : ""}
      `}
    >
      <ResumeThumbnail resume={resume} versionBadgeLabel={versionMetadata?.versionBadgeLabel ?? null} />

      <div className="p-4 rounded-b-xl relative">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0 pr-1">
            <div className="mb-1 flex min-w-0 items-center gap-2">
              <h3 className="min-w-0 truncate font-medium text-slate-900">{resume.title}</h3>
              {isResumePublished(resume) ? (
                <ResumePublishedBeacon label="Resume published" publishedAt={resume.publishedAt} className="shrink-0" />
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <Clock size={12} />
              <span>Edited {resume.lastModified.toLocaleDateString("en-US")}</span>
            </div>
          </div>

          <div className="relative shrink-0 pointer-events-auto">
            <button
              type="button"
              className={`p-1 rounded transition-colors ${isMenuOpen ? "bg-slate-100 text-slate-900" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
              onClick={e => onToggleMenu(e, resume.id)}
            >
              <MoreVertical size={16} />
            </button>

            <ResumeCardActionsMenu open={isMenuOpen} anchorEl={menuAnchorEl} onClose={onCloseMenu}>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onCloseMenu();
                  onEditResume(resume);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors"
              >
                <Edit size={14} /> Edit
              </button>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onRename(e, resume);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors"
              >
                <PenLine size={14} /> Rename
              </button>
              {!resume.isBase && (
                <button
                  type="button"
                  onClick={e => onSetBaseResume(e, resume)}
                  disabled={settingBaseId === resume.id}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {settingBaseId === resume.id ? <Loader2 size={14} className="animate-spin" /> : null}{" "}
                  {settingBaseId === resume.id ? "Setting…" : "Set as Base Resume"}
                </button>
              )}
              <button
                type="button"
                onClick={e => onDuplicate(e, resume)}
                disabled={duplicatingId === resume.id}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {duplicatingId === resume.id ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />} Duplicate
              </button>
              {isResumePublished(resume) ? (
                <button
                  type="button"
                  onClick={e => onCopyLink(e, resume)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                    copiedLinkResumeId === resume.id
                      ? "bg-brand-50 text-brand-600"
                      : "text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                  }`}
                >
                  {copiedLinkResumeId === resume.id ? <Check size={14} className="text-brand-600" /> : <Link size={14} />}
                  {copiedLinkResumeId === resume.id ? "Copied" : "Copy Link"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={e => onDownload(e, resume)}
                disabled={downloadingId === resume.id}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingId === resume.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}{" "}
                {downloadingId === resume.id ? "Preparing PDF…" : "Download"}
              </button>
              <div className="h-px bg-slate-100 my-1 mx-2" />
              <button
                type="button"
                onClick={e => onDelete(e, resume.id)}
                disabled={deletingId === resume.id}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === resume.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
              </button>
            </ResumeCardActionsMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeDashboardCard;
