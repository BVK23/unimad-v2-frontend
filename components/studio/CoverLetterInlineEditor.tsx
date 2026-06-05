"use client";

import React from "react";
import { markdownToHtml } from "@/utils/markdown-to-html";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Bold as BoldIcon, Italic, Underline as UnderlineIcon, List } from "lucide-react";

const TOOLBAR_BTN = "p-1 rounded-full text-xs transition-colors";

const preventToolbarBlur = (event: React.MouseEvent) => {
  event.preventDefault();
};

interface CoverLetterInlineEditorProps {
  value: string;
  onChange: (val: string) => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

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
        link: false,
        underline: false,
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
          "cover-letter-editor ProseMirror min-h-[400px] font-serif text-base font-normal leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none [&_p]:my-2 [&_strong]:font-bold [&_b]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-1 [&_li]:pl-0 [&_li>p]:my-0",
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
    if (!editor || editor.isFocused) return;
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
          onMouseDown={preventToolbarBlur}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${TOOLBAR_BTN} ${editor.isActive("bold") ? "bg-white text-slate-900" : "hover:bg-slate-700"}`}
          aria-label="Bold"
          aria-pressed={editor.isActive("bold")}
        >
          <BoldIcon size={14} />
        </button>
        <button
          type="button"
          onMouseDown={preventToolbarBlur}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${TOOLBAR_BTN} ${editor.isActive("italic") ? "bg-white text-slate-900" : "hover:bg-slate-700"}`}
          aria-label="Italic"
          aria-pressed={editor.isActive("italic")}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onMouseDown={preventToolbarBlur}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${TOOLBAR_BTN} ${editor.isActive("underline") ? "bg-white text-slate-900" : "hover:bg-slate-700"}`}
          aria-label="Underline"
          aria-pressed={editor.isActive("underline")}
        >
          <UnderlineIcon size={14} />
        </button>
        <button
          type="button"
          onMouseDown={preventToolbarBlur}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${TOOLBAR_BTN} ${editor.isActive("bulletList") ? "bg-white text-slate-900" : "hover:bg-slate-700"}`}
          aria-label="Bullet list"
          aria-pressed={editor.isActive("bulletList")}
        >
          <List size={14} />
        </button>
      </BubbleMenu>

      <EditorContent editor={editor} />
    </div>
  );
};

export default CoverLetterInlineEditor;
