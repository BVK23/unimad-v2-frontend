"use client";

import React from "react";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Underline as UnderlineIcon, List } from "lucide-react";

interface CoverLetterInlineEditorProps {
  value: string;
  onChange: (val: string) => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

const isHtmlLike = (content: string) => /<\/?[a-z][\s\S]*>/i.test(content);

type ListMode = "ul" | "ol" | false;

const BULLET_LINE = /^(?:[-*+]\s+|•\s*|\u2022\s*)/u;
const ORDERED_LINE = /^(\d+)\.\s+(.+)$/;

/** Lines like **Strategic Vision:** rest of sentence — common in generated cover letters */
const BOLD_LABEL_LINE = /^\s*\*\*[^*]+\*\*\s*[:\-–—]/;

const closeList = (mode: ListMode, htmlLines: string[]) => {
  if (mode === "ul") htmlLines.push("</ul>");
  if (mode === "ol") htmlLines.push("</ol>");
};

const markdownToHtml = (input: string) => {
  if (!input) return "";

  if (isHtmlLike(input)) return input;

  const lines = input.split("\n");
  const htmlLines: string[] = [];
  let listMode: ListMode = false;

  const flushBoldLabelRun = (run: string[]) => {
    if (run.length < 2) {
      run.forEach(line => {
        htmlLines.push(`<p>${inlineMarkdownToHtml(line.trim())}</p>`);
      });
      run.length = 0;
      return;
    }
    htmlLines.push("<ul>");
    run.forEach(line => {
      htmlLines.push(`<li>${inlineMarkdownToHtml(line.trim())}</li>`);
    });
    htmlLines.push("</ul>");
    run.length = 0;
  };

  const boldLabelRun: string[] = [];

  const processLine = (rawLine: string) => {
    const line = rawLine.trimEnd();
    if (!line) {
      flushBoldLabelRun(boldLabelRun);
      if (listMode) {
        closeList(listMode, htmlLines);
        listMode = false;
      }
      return;
    }

    const ordered = line.match(ORDERED_LINE);
    if (ordered) {
      flushBoldLabelRun(boldLabelRun);
      if (listMode !== "ol") {
        closeList(listMode, htmlLines);
        htmlLines.push("<ol>");
        listMode = "ol";
      }
      htmlLines.push(`<li>${inlineMarkdownToHtml(ordered[2])}</li>`);
      return;
    }

    if (BULLET_LINE.test(line)) {
      flushBoldLabelRun(boldLabelRun);
      if (listMode !== "ul") {
        closeList(listMode, htmlLines);
        htmlLines.push("<ul>");
        listMode = "ul";
      }
      const itemText = line.replace(BULLET_LINE, "");
      htmlLines.push(`<li>${inlineMarkdownToHtml(itemText)}</li>`);
      return;
    }

    if (listMode) {
      closeList(listMode, htmlLines);
      listMode = false;
    }

    if (BOLD_LABEL_LINE.test(line)) {
      boldLabelRun.push(line);
      return;
    }

    flushBoldLabelRun(boldLabelRun);

    let paragraph = line;
    if (paragraph.startsWith("### ")) {
      paragraph = `<strong>${inlineMarkdownToHtml(paragraph.slice(4))}</strong>`;
    } else if (paragraph.startsWith("## ")) {
      paragraph = `<strong>${inlineMarkdownToHtml(paragraph.slice(3))}</strong>`;
    } else if (paragraph.startsWith("# ")) {
      paragraph = `<strong>${inlineMarkdownToHtml(paragraph.slice(2))}</strong>`;
    } else {
      paragraph = inlineMarkdownToHtml(paragraph);
    }

    htmlLines.push(`<p>${paragraph}</p>`);
  };

  lines.forEach(processLine);
  flushBoldLabelRun(boldLabelRun);
  if (listMode) closeList(listMode, htmlLines);

  return htmlLines.join("");
};

const inlineMarkdownToHtml = (text: string) => {
  if (!text) return "";
  let result = text;
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/_(.+?)_/g, "<em>$1</em>");
  result = result.replace(/~~(.+?)~~/g, "<s>$1</s>");
  return result;
};

const CoverLetterInlineEditor: React.FC<CoverLetterInlineEditorProps> = ({ value, onChange, onActivate, onDeactivate }) => {
  const [isActivated, setIsActivated] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const onDeactivateRef = React.useRef(onDeactivate);

  React.useEffect(() => {
    onDeactivateRef.current = onDeactivate;
  }, [onDeactivate]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: markdownToHtml(value),
    editorProps: {
      attributes: {
        class:
          "cover-letter-editor ProseMirror min-h-[400px] font-serif text-base leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-1 [&_li]:pl-0 [&_li>p]:my-0",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onFocus: () => {
      setIsActivated(true);
      if (onActivate) onActivate();
    },
  });

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const wrapperEl = wrapperRef.current;
      if (!wrapperEl) return;
      if (wrapperEl.contains(target)) return;
      setIsActivated(false);
      if (onDeactivateRef.current) onDeactivateRef.current();
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("touchstart", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  React.useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = markdownToHtml(value);
    if (incoming !== current) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div ref={wrapperRef} className="relative" onMouseDown={() => setIsActivated(true)} onTouchStart={() => setIsActivated(true)}>
      <BubbleMenu
        editor={editor}
        shouldShow={({ editor }) => isActivated && editor.isFocused && editor.state.selection.empty === false}
        className="flex items-center gap-1 rounded-full bg-slate-900 text-white px-2 py-1 shadow-lg border border-slate-700"
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded-full text-xs ${editor.isActive("bold") ? "bg-white text-slate-900" : "hover:bg-slate-700"}`}
          aria-label="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded-full text-xs ${editor.isActive("italic") ? "bg-white text-slate-900" : "hover:bg-slate-700"}`}
          aria-label="Italic"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1 rounded-full text-xs ${editor.isActive("underline") ? "bg-white text-slate-900" : "hover:bg-slate-700"}`}
          aria-label="Underline"
        >
          <UnderlineIcon size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1 rounded-full text-xs ${editor.isActive("bulletList") ? "bg-white text-slate-900" : "hover:bg-slate-700"}`}
          aria-label="Bullet list"
        >
          <List size={14} />
        </button>
      </BubbleMenu>

      <EditorContent editor={editor} />
    </div>
  );
};

export default CoverLetterInlineEditor;
