import React from "react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Underline as UnderlineIcon, List, Wand2 } from "lucide-react";
import type { UnibotImproveTarget } from "./chat/unibot-incoming-request";

interface TiptapEditorProps {
  value: string;
  onChange: (val: string) => void;
  onImprove: (val: string) => void;
  /** Opens resume improve in main Unibot chat (suggestion pills, no sub-thread). */
  unibotImproveTarget?: UnibotImproveTarget;
  placeholder?: string;
  className?: string;
  /** Extra classes on the outer wrapper (e.g. custom placeholder color). */
  wrapperClassName?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  value,
  onChange,
  onImprove,
  unibotImproveTarget,
  placeholder,
  className,
  wrapperClassName,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "Write something...",
      }),
      Underline,
    ],
    immediatelyRender: false,
    content: value,
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3 ${className} [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync content when value changes externally (e.g. AI improvement)
  // Key: use emitUpdate: false so setContent does NOT fire onUpdate -> onChange -> re-render loop
  React.useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    // Only update if the content is meaningfully different
    if (value !== currentHtml) {
      // Use emitUpdate: false to prevent triggering onUpdate callback
      // This breaks the infinite loop: setContent -> onUpdate -> onChange -> state update -> useEffect -> setContent...
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={`border border-slate-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all bg-white shadow-sm ${wrapperClassName ?? ""}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 bg-slate-50 border-b border-slate-200 px-2 py-1.5">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive("bold") ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-200"}`}
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive("italic") ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-200"}`}
          title="Italic"
        >
          <Italic size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive("underline") ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-200"}`}
          title="Underline"
        >
          <UnderlineIcon size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive("bulletList") ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-200"}`}
          title="Bullet List"
        >
          <List size={14} />
        </button>

        <div className="w-px h-4 bg-slate-300 mx-1"></div>

        <button
          type="button"
          onClick={() => {
            if (unibotImproveTarget) {
              window.dispatchEvent(
                new CustomEvent("open-unibot", {
                  detail: {
                    improveType: "resume",
                    feature: "resume",
                    featureId: unibotImproveTarget.resumeId,
                    section: unibotImproveTarget.section,
                    entryId: unibotImproveTarget.entryId,
                    hasContent: editor.getText().trim().length > 0,
                    requestKey: Date.now(),
                  },
                })
              );
              return;
            }
            onImprove(editor.getText());
          }}
          className="flex items-center justify-center p-1.5 hover:bg-brand-50 text-brand-600 rounded transition-colors ml-auto"
          title="Improve with Unibot"
        >
          <Wand2 size={16} />
        </button>
      </div>

      {/* Editor Area */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
