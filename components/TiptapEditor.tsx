import React from "react";
import { normalizeResumeEditorHtml } from "@/features/resume/utils/normalizeResumeEditorHtml";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
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

const EDITOR_SURFACE_CLASS =
  "prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3 text-slate-700 " +
  "[&_strong]:font-bold [&_b]:font-bold [&_strong]:text-slate-900 [&_b]:text-slate-900 " +
  "[&_em]:italic [&_i]:italic [&_u]:underline " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5";

const preventToolbarBlur = (event: React.MouseEvent) => {
  event.preventDefault();
};

type ToolbarProps = {
  editor: Editor;
  onImprove: (val: string) => void;
  unibotImproveTarget?: UnibotImproveTarget;
};

const EditorToolbar: React.FC<ToolbarProps> = ({ editor, onImprove, unibotImproveTarget }) => (
  <div className="flex items-center gap-1 bg-slate-50 border-b border-slate-200 px-2 py-1.5">
    <button
      type="button"
      onMouseDown={preventToolbarBlur}
      onClick={() => editor.chain().focus().toggleBold().run()}
      className={`p-1.5 rounded transition-colors ${editor.isActive("bold") ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-200"}`}
      title="Bold"
      aria-label="Bold"
      aria-pressed={editor.isActive("bold")}
    >
      <Bold size={14} />
    </button>
    <button
      type="button"
      onMouseDown={preventToolbarBlur}
      onClick={() => editor.chain().focus().toggleItalic().run()}
      className={`p-1.5 rounded transition-colors ${editor.isActive("italic") ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-200"}`}
      title="Italic"
      aria-label="Italic"
      aria-pressed={editor.isActive("italic")}
    >
      <Italic size={14} />
    </button>
    <button
      type="button"
      onMouseDown={preventToolbarBlur}
      onClick={() => editor.chain().focus().toggleUnderline().run()}
      className={`p-1.5 rounded transition-colors ${editor.isActive("underline") ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-200"}`}
      title="Underline"
      aria-label="Underline"
      aria-pressed={editor.isActive("underline")}
    >
      <UnderlineIcon size={14} />
    </button>
    <button
      type="button"
      onMouseDown={preventToolbarBlur}
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      className={`p-1.5 rounded transition-colors ${editor.isActive("bulletList") ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-200"}`}
      title="Bullet List"
      aria-label="Bullet list"
      aria-pressed={editor.isActive("bulletList")}
    >
      <List size={14} />
    </button>

    <div className="w-px h-4 bg-slate-300 mx-1" />

    <button
      type="button"
      onMouseDown={preventToolbarBlur}
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
);

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  value,
  onChange,
  onImprove,
  unibotImproveTarget,
  placeholder,
  className,
  wrapperClassName,
}) => {
  const normalizedValue = React.useMemo(() => normalizeResumeEditorHtml(value), [value]);
  const [, setSelectionEpoch] = React.useState(0);

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
    content: normalizedValue,
    editorProps: {
      attributes: {
        class: `${EDITOR_SURFACE_CLASS} ${className ?? ""}`.trim(),
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML());
    },
  });

  // Re-render toolbar when selection or marks change (isActive is selection-dependent).
  React.useEffect(() => {
    if (!editor) return;
    const bump = () => setSelectionEpoch(epoch => epoch + 1);
    editor.on("selectionUpdate", bump);
    editor.on("transaction", bump);
    return () => {
      editor.off("selectionUpdate", bump);
      editor.off("transaction", bump);
    };
  }, [editor]);

  React.useEffect(() => {
    if (!editor) return;

    const currentHtml = normalizeResumeEditorHtml(editor.getHTML());
    if (normalizedValue !== currentHtml) {
      editor.commands.setContent(normalizedValue || "", { emitUpdate: false });
    }
  }, [normalizedValue, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={`border border-slate-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all bg-white shadow-sm ${wrapperClassName ?? ""}`}
    >
      <EditorToolbar editor={editor} onImprove={onImprove} unibotImproveTarget={unibotImproveTarget} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
