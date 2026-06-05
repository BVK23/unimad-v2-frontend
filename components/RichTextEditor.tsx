import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, AlignLeft, AlignCenter, AlignRight, ChevronsUpDown } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    onToggleCollapsible?: () => void;
    isCollapsible?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder,
    className,
    onToggleCollapsible,
    isCollapsible
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
    const [isFocused, setIsFocused] = useState(false);

    const normalizeEditorHtml = (html: string) => {
        const normalized = html
            .replace(/&nbsp;/g, ' ')
            .replace(/<br\s*\/?>/gi, '')
            .replace(/<div><\/div>/gi, '')
            .replace(/<p><\/p>/gi, '')
            .replace(/<[^>]*>/g, '')
            .trim();
        return normalized.length === 0 ? '' : html;
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
            if (normalizedHtml === '' && editorRef.current.innerHTML !== '') {
                // Keep the editable node truly empty so :empty placeholder styling works.
                editorRef.current.innerHTML = '';
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
            // Position relative to viewport, but we might want relative to editor parent
            // But fixed position is easier for floating toolbar
            setToolbarPosition({
                top: rect.top - 50, // 50px above selection
                left: rect.left + (rect.width / 2) - 100 // Centered roughly
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
    };

    return (
        <div className="relative group">
            {/* Floating Toolbar */}
            {showToolbar && (
                <div
                    className="fixed z-50 flex items-center gap-1 p-1 bg-slate-900 text-white rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
                    onMouseDown={(e) => e.preventDefault()} // Prevent loss of focus
                >
                    <button onClick={() => executeCommand('bold')} className="p-1.5 hover:bg-slate-700 rounded transition-colors"><Bold size={16} /></button>
                    <button onClick={() => executeCommand('italic')} className="p-1.5 hover:bg-slate-700 rounded transition-colors"><Italic size={16} /></button>
                    <button onClick={() => executeCommand('underline')} className="p-1.5 hover:bg-slate-700 rounded transition-colors"><Underline size={16} /></button>
                    <div className="w-px h-4 bg-slate-700 mx-1" />
                    <button onClick={() => executeCommand('insertUnorderedList')} className="p-1.5 hover:bg-slate-700 rounded transition-colors"><List size={16} /></button>
                    <button onClick={() => executeCommand('insertOrderedList')} className="p-1.5 hover:bg-slate-700 rounded transition-colors"><ListOrdered size={16} /></button>
                    <div className="w-px h-4 bg-slate-700 mx-1" />
                    <button onClick={() => executeCommand('formatBlock', 'H1')} className="p-1.5 hover:bg-slate-700 rounded transition-colors"><Heading1 size={16} /></button>
                    <button onClick={() => executeCommand('formatBlock', 'H2')} className="p-1.5 hover:bg-slate-700 rounded transition-colors"><Heading2 size={16} /></button>
                    <div className="w-px h-4 bg-slate-700 mx-1" />
                    <button onClick={() => executeCommand('justifyLeft')} className="p-1.5 hover:bg-slate-700 rounded transition-colors"><AlignLeft size={16} /></button>
                    <button onClick={() => executeCommand('justifyCenter')} className="p-1.5 hover:bg-slate-700 rounded transition-colors"><AlignCenter size={16} /></button>
                    <button onClick={() => executeCommand('justifyRight')} className="p-1.5 hover:bg-slate-700 rounded transition-colors"><AlignRight size={16} /></button>
                    {onToggleCollapsible && (
                        <>
                            <div className="w-px h-4 bg-slate-700 mx-1" />
                            <button
                                onClick={onToggleCollapsible}
                                title={isCollapsible ? 'Disable collapsible section' : 'Enable collapsible section'}
                                aria-label={isCollapsible ? 'Disable collapsible section' : 'Enable collapsible section'}
                                className={`p-1.5 rounded transition-colors ${
                                    isCollapsible ? 'bg-brand-500 text-white' : 'hover:bg-slate-700 text-white'
                                }`}
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
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    setIsFocused(false);
                    setShowToolbar(false);
                }} // Hide on blur
                className={`outline-none min-h-[1em] empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 cursor-text ${className}`}
                data-placeholder={isFocused ? '' : (placeholder || '')}
                suppressContentEditableWarning={true}
            />
        </div>
    );
};

export default RichTextEditor;
