import React from "react";
import StudioListDeleteButton from "./StudioListDeleteButton";

export type LinkedInListItem = {
  id: string | number;
  content: string;
  date: string;
  topic?: string;
  mood?: string;
  status?: string;
};

interface LinkedInPostListCardProps {
  post: LinkedInListItem;
  onClick: () => void;
  onDelete?: (id: string | number) => void;
  isSelected?: boolean;
}

const stripMarkup = (text: string): string =>
  text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const collapseWhitespace = (text: string): string => stripMarkup(text).replace(/\s+/g, " ").trim();

const firstContentLine = (content: string): string => {
  const plain = stripMarkup(content);
  const line = plain
    .split(/\r?\n/)
    .map(row => row.trim())
    .find(Boolean);
  return line ? collapseWhitespace(line) : collapseWhitespace(plain);
};

const contentPreviewExcerpt = (topic: string, content: string): string => {
  const normalizedTopic = collapseWhitespace(topic);
  const plainContent = stripMarkup(content);
  const normalizedContent = plainContent.replace(/\s+/g, " ").trim();
  if (!normalizedContent) return "";
  if (!normalizedTopic) return normalizedContent;
  if (normalizedContent === normalizedTopic) return "";

  if (normalizedContent.startsWith(normalizedTopic)) {
    const remainder = normalizedContent
      .slice(normalizedTopic.length)
      .replace(/^[\s·\-–—]+/, "")
      .trim();
    return remainder;
  }

  const contentLines = plainContent
    .split(/\r?\n/)
    .map(row => row.trim())
    .filter(Boolean);
  const topicLine = firstContentLine(topic);
  if (contentLines.length > 1 && collapseWhitespace(contentLines[0]) === topicLine) {
    return collapseWhitespace(contentLines.slice(1).join(" "));
  }

  return normalizedContent;
};

const LinkedInPostListCard: React.FC<LinkedInPostListCardProps> = ({ post, onClick, onDelete, isSelected = false }) => {
  const topicLabel = collapseWhitespace(post.topic?.trim() || "") || firstContentLine(post.content) || "Untitled post";
  const statusLabel = post.status?.trim() || "Draft";
  const preview = contentPreviewExcerpt(topicLabel, post.content);
  const topicWithMood = post.mood?.trim() ? `${topicLabel} · ${post.mood.trim()}` : topicLabel;

  return (
    <div
      className={`group/card relative w-full rounded-xl border transition-all ${
        isSelected
          ? "border-brand-500/50 bg-brand-50 shadow-sm ring-1 ring-brand-500/25 dark:border-brand-500/40 dark:bg-brand-900/40 dark:ring-brand-500/30"
          : "border-slate-200/80 bg-slate-100 hover:border-slate-300 hover:bg-slate-200/90 hover:shadow-sm dark:border-slate-700/80 dark:bg-slate-800/90 dark:hover:border-slate-600 dark:hover:bg-slate-800"
      }`}
    >
      <button type="button" onClick={onClick} className="block w-full p-3 pr-9 text-left">
        <p
          className={`h-3.5 truncate text-[11px] font-medium leading-[14px] ${
            isSelected ? "text-brand-700 dark:text-brand-300" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {post.date} · {statusLabel}
        </p>
        <p
          className={`mt-1 h-5 truncate text-[13px] font-medium leading-5 ${
            isSelected ? "text-slate-800 dark:text-slate-100" : "text-slate-700 dark:text-slate-200"
          }`}
        >
          {topicWithMood}
        </p>
        {preview ? (
          <div className="mt-2 max-h-[34px] overflow-hidden">
            <p
              className={`line-clamp-2 text-[11px] leading-[17px] ${
                isSelected ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {preview}
            </p>
          </div>
        ) : null}
      </button>
      {onDelete && (
        <StudioListDeleteButton
          ariaLabel="Delete post"
          onClick={e => {
            e.stopPropagation();
            onDelete(post.id);
          }}
        />
      )}
    </div>
  );
};

export default LinkedInPostListCard;
