"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  a: ({ node: _node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline underline-offset-2" />
  ),
};

const wrapperClass =
  "formatted-agent-message max-w-none text-[13px] leading-relaxed text-inherit " +
  "[&_p]:mb-2 [&_p:last-child]:mb-0 " +
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 " +
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_li]:my-0.5 [&_li]:pl-0.5 " +
  "[&_strong]:font-semibold [&_b]:font-semibold " +
  "[&_em]:italic [&_i]:italic " +
  "[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_code]:font-mono dark:[&_code]:bg-white/10 " +
  "[&_pre]:my-2 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-2 [&_pre]:text-[12px] dark:[&_pre]:bg-white/5 " +
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600 dark:[&_blockquote]:border-slate-600 dark:[&_blockquote]:text-slate-400 " +
  "[&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-[15px] [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-[14px] [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-[13px] [&_h3]:font-semibold " +
  "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left " +
  "[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-[12px] [&_th]:font-semibold dark:[&_th]:border-white/10 dark:[&_th]:bg-white/5 " +
  "[&_td]:border [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-1 [&_td]:text-[12px] dark:[&_td]:border-white/10 " +
  "[&_hr]:my-3 [&_hr]:border-slate-200 dark:[&_hr]:border-white/10";

export type FormattedAgentMessageProps = {
  content: string;
  className?: string;
};

/**
 * Renders assistant chat copy as GitHub-flavored Markdown, with embedded HTML
 * (e.g. snippets from resume fields) passed through rehype-raw then sanitized.
 */
export function FormattedAgentMessage({ content, className }: FormattedAgentMessageProps) {
  return (
    <div className={className ? `${wrapperClass} ${className}` : wrapperClass}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
