import React, { useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronsUpDown,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onToggleCollapsible?: () => void;
  isCollapsible?: boolean;
}

type ActiveFormats = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  bulletList: boolean;
  orderedList: boolean;
  heading: "h1" | "h2" | "h3" | null;
  alignLeft: boolean;
  alignCenter: boolean;
  alignRight: boolean;
};

const EMPTY_ACTIVE_FORMATS: ActiveFormats = {
  bold: false,
  italic: false,
  underline: false,
  bulletList: false,
  orderedList: false,
  heading: null,
  alignLeft: false,
  alignCenter: false,
  alignRight: false,
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className, onToggleCollapsible, isCollapsible }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(EMPTY_ACTIVE_FORMATS);

  const computeActiveFormats = (): ActiveFormats => {
    try {
      const block = (document.queryCommandValue("formatBlock") || "").toLowerCase();
      const heading = block === "h1" || block === "h2" || block === "h3" ? (block as "h1" | "h2" | "h3") : null;
      return {
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        bulletList: document.queryCommandState("insertUnorderedList"),
        orderedList: document.queryCommandState("insertOrderedList"),
        heading,
        alignLeft: document.queryCommandState("justifyLeft"),
        alignCenter: document.queryCommandState("justifyCenter"),
        alignRight: document.queryCommandState("justifyRight"),
      };
    } catch {
      return EMPTY_ACTIVE_FORMATS;
    }
  };

  const normalizeEditorHtml = (html: string) => {
    const normalized = html
      .replace(/&nbsp;/g, " ")
      .replace(/<br\s*\/?>/gi, "")
      .replace(/<div><\/div>/gi, "")
      .replace(/<p><\/p>/gi, "")
      .replace(/<[^>]*>/g, "")
      .trim();
    return normalized.length === 0 ? "" : html;
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Rough sync: overly simplistic, but okay for MVP non-concurrent editing
      // Ideally we'd only update if the diff is significant or if focused elsewhere
      // But here we rely on onChange updating the parent, so we only sync initially or if completely changed
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const normalizedHtml = normalizeEditorHtml(editorRef.current.innerHTML);
      if (normalizedHtml === "" && editorRef.current.innerHTML !== "") {
        editorRef.current.innerHTML = "";
      }
      onChange(normalizedHtml);
    }
  };

  const handleSelect = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setShowToolbar(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Only show if selection is inside our editor
    if (editorRef.current && editorRef.current.contains(selection.anchorNode)) {
      setShowToolbar(true);
      setActiveFormats(computeActiveFormats());
      // Position relative to viewport, but we might want relative to editor parent
      // But fixed position is easier for floating toolbar
      setToolbarPosition({
        top: rect.top - 50, // 50px above selection
        left: rect.left + rect.width / 2 - 100, // Centered roughly
      });
    } else {
      setShowToolbar(false);
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
    setActiveFormats(computeActiveFormats());
  };

  const toggleHeading = (level: "H1" | "H2" | "H3") => {
    const current = activeFormats.heading;
    const target = current === level.toLowerCase() ? "P" : level;
    executeCommand("formatBlock", target);
  };

  const buttonClass = (isActive: boolean) =>
    `p-1.5 rounded transition-colors ${isActive ? "bg-slate-700 text-white" : "hover:bg-slate-700"}`;

  return (
    <div className="relative group">
      {/* Floating Toolbar */}
      {showToolbar && (
        <div
          className="fixed z-50 flex items-center gap-1 p-1 bg-slate-900 text-white rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200"
          style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
          onMouseDown={e => e.preventDefault()} // Prevent loss of focus
        >
          <button onClick={() => executeCommand("bold")} aria-pressed={activeFormats.bold} className={buttonClass(activeFormats.bold)}>
            <Bold size={16} />
          </button>
          <button
            onClick={() => executeCommand("italic")}
            aria-pressed={activeFormats.italic}
            className={buttonClass(activeFormats.italic)}
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => executeCommand("underline")}
            aria-pressed={activeFormats.underline}
            className={buttonClass(activeFormats.underline)}
          >
            <Underline size={16} />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1" />
          <button
            onClick={() => executeCommand("insertUnorderedList")}
            aria-pressed={activeFormats.bulletList}
            className={buttonClass(activeFormats.bulletList)}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => executeCommand("insertOrderedList")}
            aria-pressed={activeFormats.orderedList}
            className={buttonClass(activeFormats.orderedList)}
          >
            <ListOrdered size={16} />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1" />
          <button
            onClick={() => toggleHeading("H1")}
            aria-pressed={activeFormats.heading === "h1"}
            className={buttonClass(activeFormats.heading === "h1")}
          >
            <Heading1 size={16} />
          </button>
          <button
            onClick={() => toggleHeading("H2")}
            aria-pressed={activeFormats.heading === "h2"}
            className={buttonClass(activeFormats.heading === "h2")}
          >
            <Heading2 size={16} />
          </button>
          <button
            onClick={() => toggleHeading("H3")}
            aria-pressed={activeFormats.heading === "h3"}
            className={buttonClass(activeFormats.heading === "h3")}
          >
            <Heading3 size={16} />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1" />
          <button
            onClick={() => executeCommand("justifyLeft")}
            aria-pressed={activeFormats.alignLeft}
            className={buttonClass(activeFormats.alignLeft)}
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => executeCommand("justifyCenter")}
            aria-pressed={activeFormats.alignCenter}
            className={buttonClass(activeFormats.alignCenter)}
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => executeCommand("justifyRight")}
            aria-pressed={activeFormats.alignRight}
            className={buttonClass(activeFormats.alignRight)}
          >
            <AlignRight size={16} />
          </button>
          {onToggleCollapsible && (
            <>
              <div className="w-px h-4 bg-slate-700 mx-1" />
              <button
                onClick={onToggleCollapsible}
                title={isCollapsible ? "Disable collapsible section" : "Enable collapsible section"}
                aria-label={isCollapsible ? "Disable collapsible section" : "Enable collapsible section"}
                aria-pressed={Boolean(isCollapsible)}
                className={buttonClass(Boolean(isCollapsible))}
              >
                <ChevronsUpDown size={14} />
              </button>
            </>
          )}
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onSelect={handleSelect}
        onBlur={() => {
          setShowToolbar(false);
          if (!editorRef.current) return;
          const isEffectivelyEmpty = (editorRef.current.textContent || "").trim() === "";
          if (!isEffectivelyEmpty) return;
          if (editorRef.current.innerHTML !== "") {
            editorRef.current.innerHTML = "";
          }
          if (value !== "") {
            onChange("");
          }
        }}
        className={`outline-none min-h-[1em] empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 cursor-text ${className}`}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default RichTextEditor;
