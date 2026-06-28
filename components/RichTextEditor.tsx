import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { PortfolioTitleHeadingLevel } from "@/features/portfolio/utils/portfolio-html";
import { applyRefineAnchorMark, clearRefineAnchorMarks } from "@/utils/refine-anchor-highlight";
import { ArrowRight, Sparkles } from "lucide-react";
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

export type RichTextEditorSelectionInfo = {
  text: string;
  rect: DOMRect;
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onToggleCollapsible?: () => void;
  isCollapsible?: boolean;
  onSelectionChange?: (info: RichTextEditorSelectionInfo | null) => void;
  /** When true, apply prop value even while the editor is focused (e.g. ADK pending revision). */
  forceExternalSync?: boolean;
  /** When true, content is not editable but text can still be selected (e.g. diff review). */
  readOnly?: boolean;
  /** Studio-only: white two-row toolbar with improve actions on top. */
  unifiedSelectionToolbar?: boolean;
  selectionImproveSlot?: React.ReactNode;
  /** Persistent highlight for the text span sent to Unibot (survives toolbar dismiss). */
  refineAnchorText?: string;
}

type ActiveFormats = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  bulletList: boolean;
  orderedList: boolean;
  heading: PortfolioTitleHeadingLevel | null;
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

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className,
  onToggleCollapsible,
  isCollapsible,
  onSelectionChange,
  forceExternalSync = false,
  readOnly = false,
  unifiedSelectionToolbar = false,
  selectionImproveSlot,
  refineAnchorText = "",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const anchorMarkRef = useRef<HTMLElement | null>(null);
  const [anchorCueRect, setAnchorCueRect] = useState<DOMRect | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(EMPTY_ACTIVE_FORMATS);

  const resolveHeadingFromSelection = useCallback((): PortfolioTitleHeadingLevel | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return null;

    let node: Node | null = selection.anchorNode;
    while (node && node !== editorRef.current) {
      if (node instanceof HTMLElement) {
        const tag = node.tagName.toLowerCase();
        if (tag === "h1" || tag === "h2" || tag === "h3") {
          return tag;
        }
      }
      node = node.parentNode;
    }
    return null;
  }, []);

  const computeActiveFormats = useCallback((): ActiveFormats => {
    try {
      const block = (document.queryCommandValue("formatBlock") || "").toLowerCase().replace(/[<>]/g, "");
      let heading: PortfolioTitleHeadingLevel | null =
        block === "h1" || block === "h2" || block === "h3" ? (block as PortfolioTitleHeadingLevel) : null;

      if (!heading) {
        heading = resolveHeadingFromSelection();
      }

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
  }, [resolveHeadingFromSelection]);

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
    if (!editorRef.current || editorRef.current.innerHTML === value) {
      return;
    }
    if (forceExternalSync || document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, [value, forceExternalSync]);

  const updateAnchorCuePosition = useCallback(() => {
    const mark = anchorMarkRef.current;
    if (!mark || !mark.isConnected) {
      setAnchorCueRect(null);
      return;
    }
    setAnchorCueRect(mark.getBoundingClientRect());
  }, []);

  useEffect(() => {
    const root = editorRef.current;
    if (!root) return;

    const trimmed = refineAnchorText.trim();
    if (!trimmed) {
      clearRefineAnchorMarks(root);
      anchorMarkRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear cue when anchor text removed
      setAnchorCueRect(null);
      return;
    }

    const mark = applyRefineAnchorMark(root, trimmed);
    anchorMarkRef.current = mark;
    updateAnchorCuePosition();

    const onLayoutChange = () => updateAnchorCuePosition();
    window.addEventListener("scroll", onLayoutChange, true);
    window.addEventListener("resize", onLayoutChange);
    return () => {
      window.removeEventListener("scroll", onLayoutChange, true);
      window.removeEventListener("resize", onLayoutChange);
      if (root) {
        clearRefineAnchorMarks(root);
      }
      anchorMarkRef.current = null;
      setAnchorCueRect(null);
    };
  }, [refineAnchorText, value, updateAnchorCuePosition]);

  const handleInput = () => {
    if (readOnly) return;
    if (editorRef.current) {
      const normalizedHtml = normalizeEditorHtml(editorRef.current.innerHTML);
      if (normalizedHtml === "" && editorRef.current.innerHTML !== "") {
        editorRef.current.innerHTML = "";
      }
      onChange(normalizedHtml);
      setActiveFormats(computeActiveFormats());
    }
  };

  const handleSelect = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setShowToolbar(false);
      onSelectionChange?.(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (editorRef.current && editorRef.current.contains(selection.anchorNode)) {
      setShowToolbar(true);
      setActiveFormats(computeActiveFormats());
      setToolbarPosition({
        top: rect.top - (unifiedSelectionToolbar ? 90 : 50),
        left: rect.left + rect.width / 2,
      });
      const text = selection.toString();
      if (text.trim()) {
        onSelectionChange?.({ text, rect });
      } else {
        onSelectionChange?.(null);
      }
    } else {
      setShowToolbar(false);
      onSelectionChange?.(null);
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (readOnly) return;
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

  const darkButtonClass = (isActive: boolean) =>
    `p-1.5 rounded transition-colors ${isActive ? "bg-slate-700 text-white" : "hover:bg-slate-700"}`;

  const lightButtonClass = (isActive: boolean) =>
    `p-1.5 rounded transition-colors ${isActive ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white" : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`;

  const renderFormattingButtons = (btnClass: (isActive: boolean) => string, dividerClass: string) => (
    <>
      <button
        type="button"
        onClick={() => executeCommand("bold")}
        aria-pressed={activeFormats.bold}
        className={btnClass(activeFormats.bold)}
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => executeCommand("italic")}
        aria-pressed={activeFormats.italic}
        className={btnClass(activeFormats.italic)}
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => executeCommand("underline")}
        aria-pressed={activeFormats.underline}
        className={btnClass(activeFormats.underline)}
      >
        <Underline size={16} />
      </button>
      <div className={`mx-1 h-4 w-px ${dividerClass}`} />
      <button
        type="button"
        onClick={() => executeCommand("insertUnorderedList")}
        aria-pressed={activeFormats.bulletList}
        className={btnClass(activeFormats.bulletList)}
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => executeCommand("insertOrderedList")}
        aria-pressed={activeFormats.orderedList}
        className={btnClass(activeFormats.orderedList)}
      >
        <ListOrdered size={16} />
      </button>
      <div className={`mx-1 h-4 w-px ${dividerClass}`} />
      <button
        type="button"
        onClick={() => toggleHeading("H1")}
        aria-pressed={activeFormats.heading === "h1"}
        className={btnClass(activeFormats.heading === "h1")}
      >
        <Heading1 size={16} />
      </button>
      <button
        type="button"
        onClick={() => toggleHeading("H2")}
        aria-pressed={activeFormats.heading === "h2"}
        className={btnClass(activeFormats.heading === "h2")}
      >
        <Heading2 size={16} />
      </button>
      <button
        type="button"
        onClick={() => toggleHeading("H3")}
        aria-pressed={activeFormats.heading === "h3"}
        className={btnClass(activeFormats.heading === "h3")}
      >
        <Heading3 size={16} />
      </button>
      <div className={`mx-1 h-4 w-px ${dividerClass}`} />
      <button
        type="button"
        onClick={() => executeCommand("justifyLeft")}
        aria-pressed={activeFormats.alignLeft}
        className={btnClass(activeFormats.alignLeft)}
      >
        <AlignLeft size={16} />
      </button>
      <button
        type="button"
        onClick={() => executeCommand("justifyCenter")}
        aria-pressed={activeFormats.alignCenter}
        className={btnClass(activeFormats.alignCenter)}
      >
        <AlignCenter size={16} />
      </button>
      <button
        type="button"
        onClick={() => executeCommand("justifyRight")}
        aria-pressed={activeFormats.alignRight}
        className={btnClass(activeFormats.alignRight)}
      >
        <AlignRight size={16} />
      </button>
      {onToggleCollapsible ? (
        <>
          <div className={`mx-1 h-4 w-px ${dividerClass}`} />
          <button
            type="button"
            onClick={onToggleCollapsible}
            title={isCollapsible ? "Disable collapsible section" : "Enable collapsible section"}
            aria-label={isCollapsible ? "Disable collapsible section" : "Enable collapsible section"}
            aria-pressed={Boolean(isCollapsible)}
            className={btnClass(Boolean(isCollapsible))}
          >
            <ChevronsUpDown size={14} />
          </button>
        </>
      ) : null}
    </>
  );

  const editorSurfaceClass = `outline-none min-h-[1em] cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 ${className ?? ""}`;

  const toolbarStyle: React.CSSProperties = unifiedSelectionToolbar
    ? {
        top: toolbarPosition.top,
        left: toolbarPosition.left,
        transform: "translateX(-50%)",
      }
    : {
        top: toolbarPosition.top,
        left: toolbarPosition.left - 100,
      };

  const anchorCue =
    anchorCueRect && refineAnchorText.trim() && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[55] flex max-w-[min(92vw,280px)] animate-in fade-in slide-in-from-top-1 duration-200"
            style={{
              top: anchorCueRect.bottom + 6,
              left: Math.max(12, Math.min(anchorCueRect.left, window.innerWidth - 292)),
            }}
            aria-hidden
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50/95 px-3 py-1.5 text-[11px] font-medium text-brand-700 shadow-md shadow-brand-500/10 backdrop-blur-sm dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-200">
              <Sparkles size={12} className="shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
              <span>Continue in Unibot</span>
              <ArrowRight size={12} className="shrink-0 opacity-70" aria-hidden />
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative group">
      {showToolbar && unifiedSelectionToolbar ? (
        <div
          className="fixed z-50 flex max-w-[min(96vw,560px)] flex-col gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900"
          style={toolbarStyle}
          onMouseDown={e => e.preventDefault()}
        >
          {selectionImproveSlot ? (
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 p-1 dark:border-slate-800">
              {selectionImproveSlot}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-1 p-1 text-slate-700 dark:text-slate-300">
            {renderFormattingButtons(lightButtonClass, "bg-slate-200 dark:bg-slate-700")}
          </div>
        </div>
      ) : null}
      {showToolbar && !unifiedSelectionToolbar ? (
        <div
          className="fixed z-50 flex items-center gap-1 rounded-lg bg-slate-900 p-1 text-white shadow-xl animate-in fade-in zoom-in-95 duration-200"
          style={toolbarStyle}
          onMouseDown={e => e.preventDefault()}
        >
          {renderFormattingButtons(darkButtonClass, "bg-slate-700")}
        </div>
      ) : null}

      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        onSelect={handleSelect}
        onBlur={() => {
          setShowToolbar(false);
          onSelectionChange?.(null);
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
        className={editorSurfaceClass.trim()}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
      {anchorCue}
    </div>
  );
};

export default RichTextEditor;
