import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit3,
  Layout,
  Image as ImageIcon,
  Type,
  Link as LinkIcon,
  Video,
  FolderPlus,
  GripVertical,
  Trash2,
  X,
  MoveHorizontal,
  ExternalLink,
  Plus,
  ArrowRight,
  PlayCircle,
  FileText,
} from "lucide-react";
import Image from "next/image";
import { ContentType } from "../../types";

// Reuse types or define new ones for VPD
export interface VPDItem {
  id: string;
  type: ContentType; // 'text' | 'image' | 'video' | 'link' | 'project'
  content: string;
  span: 1 | 2 | 3;
  fontSize?: "base" | "lg" | "2xl";
  fontWeight?: "normal" | "bold";
  title?: string;
  description?: string;
}

interface VPDEditorProps {
  initialItems?: VPDItem[];
}

const INITIAL_VPD_ITEMS: VPDItem[] = [
  {
    id: "1",
    type: "text",
    content: "Product Designer Value Proposition",
    span: 3,
    fontSize: "2xl",
    fontWeight: "bold",
  },
  {
    id: "2",
    type: "text",
    content: "I specialize in translating complex user needs into intuitive, beautiful, and scalable design systems.",
    span: 3,
    fontSize: "lg",
  },
];

const VPDEditor: React.FC<VPDEditorProps> = ({ initialItems = INITIAL_VPD_ITEMS }) => {
  const [items, setItems] = useState<VPDItem[]>(initialItems);
  const [isEditMode, setIsEditMode] = useState(true);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; startSpan: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // -- Resize Logic (Identical to Portfolio) --
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing || !gridRef.current) return;

      const gridWidth = gridRef.current.offsetWidth;
      const oneColWidth = gridWidth / 3;
      const deltaX = e.clientX - resizing.startX;
      const spanChange = Math.round(deltaX / oneColWidth);
      let newSpan = resizing.startSpan + spanChange;

      if (newSpan < 1) newSpan = 1;
      if (newSpan > 3) newSpan = 3;

      setItems(prev =>
        prev.map(item => (item.id === resizing.id && item.span !== newSpan ? { ...item, span: newSpan as 1 | 2 | 3 } : item))
      );
    };

    const handleMouseUp = () => {
      setResizing(null);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    if (resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
  }, [resizing]);

  const initResize = (e: React.MouseEvent, item: VPDItem) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.button !== 0) return;

    setResizing({
      id: item.id,
      startX: e.clientX,
      startSpan: item.span,
    });
  };

  // -- Drag & Drop Logic --
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (resizing) {
      e.preventDefault();
      return;
    }
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const newItems = [...items];
    const draggedItem = newItems[draggedItemIndex];
    newItems.splice(draggedItemIndex, 1);
    newItems.splice(index, 0, draggedItem);
    setItems(newItems);
    setDraggedItemIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  // -- CRUD Operations --
  const addItem = (type: ContentType) => {
    const newItem: VPDItem = {
      id: Date.now().toString(),
      type,
      content: type === "text" ? "New text block" : "https://picsum.photos/600/400",
      span: 1,
      title: type === "project" ? "New Project" : undefined,
      description: type === "project" ? "Description..." : undefined,
      fontSize: "base",
    };
    setItems([...items, newItem]);
  };

  const updateItemContent = (id: string, updates: Partial<VPDItem>) => {
    setItems(items.map(item => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const getSpanClass = (span: number) => {
    if (span === 3) return "col-span-1 md:col-span-3";
    if (span === 2) return "col-span-1 md:col-span-2";
    return "col-span-1";
  };

  return (
    <div className="flex-1 h-full relative flex flex-col">
      {/* Toolbar / Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="font-medium text-slate-900 dark:text-white text-sm">Untitled VPD</h2>
            <p className="text-xs text-slate-500">Last edited just now</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${isEditMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {isEditMode ? (
              <>
                <Layout size={14} /> Done
              </>
            ) : (
              <>
                <Edit3 size={14} /> Edit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-950">
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pb-32">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                key={item.id}
                draggable={isEditMode && !resizing}
                onDragStart={e => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, index)}
                onDragOver={e => handleDragOver(e as unknown as React.DragEvent<HTMLDivElement>, index)}
                onDragEnd={handleDragEnd}
                className={`
                                    ${getSpanClass(item.span)} 
                                    relative group rounded-2xl transition-all duration-200
                                    ${isEditMode ? "hover:ring-2 hover:ring-brand-500/50 cursor-grab active:cursor-grabbing" : ""}
                                    ${draggedItemIndex === index ? "opacity-40 scale-95" : "opacity-100"}
                                    bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden
                                `}
              >
                {/* Delete Controls */}
                {isEditMode && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md rounded-full p-1 z-30">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="h-full">
                  {item.type === "text" && (
                    <div className="p-4 h-full">
                      {isEditMode ? (
                        <textarea
                          value={item.content}
                          onChange={e => updateItemContent(item.id, { content: e.target.value })}
                          className={`w-full h-full min-h-[100px] bg-transparent resize-none outline-none placeholder:text-slate-300
                                                        ${item.fontSize === "2xl" ? "text-2xl font-medium" : item.fontSize === "lg" ? "text-lg font-medium" : "text-sm text-slate-600"}
                                                    `}
                          placeholder="Type something..."
                        />
                      ) : (
                        <p
                          className={`whitespace-pre-wrap
                                                    ${item.fontSize === "2xl" ? "text-2xl font-medium text-slate-900 dark:text-white" : item.fontSize === "lg" ? "text-lg font-medium text-slate-800 dark:text-slate-200" : "text-sm text-slate-600 dark:text-slate-400"}
                                                `}
                        >
                          {item.content}
                        </p>
                      )}
                    </div>
                  )}

                  {item.type === "image" && (
                    <div className="h-64 bg-slate-100 dark:bg-slate-900 relative">
                      <Image src={item.content} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" alt="VPD Asset" />
                    </div>
                  )}

                  {item.type === "project" && (
                    <div className="h-64 relative group/card cursor-pointer overflow-hidden">
                      <Image
                        src={item.content}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        alt={item.title ?? "Project"}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity p-6 flex flex-col justify-end text-white">
                        <h3 className="font-medium text-lg">{item.title}</h3>
                        <p className="text-xs opacity-80">{item.description}</p>
                      </div>
                    </div>
                  )}

                  {item.type === "video" && (
                    <div className="h-64 bg-slate-900 flex items-center justify-center text-white relative group/video">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover/video:scale-110 transition-transform">
                        <PlayCircle size={24} />
                      </div>
                    </div>
                  )}

                  {item.type === "link" && (
                    <div className="p-6 h-full flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer group/link">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-lg">
                          <LinkIcon size={20} />
                        </div>
                        <ExternalLink size={16} className="text-slate-400 group-hover/link:text-brand-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">External Link</h4>
                        <p className="text-xs text-slate-500 mt-1">unimad.ai</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Drag/Resize Handles */}
                {isEditMode && (
                  <>
                    <div
                      className="absolute left-2 top-2 text-slate-400 cursor-grab opacity-0 group-hover:opacity-100 p-1 bg-white/80 rounded"
                      title="Drag"
                    >
                      <GripVertical size={14} />
                    </div>
                    <div
                      className="absolute right-2 bottom-2 text-white cursor-ew-resize opacity-0 group-hover:opacity-100 p-1 bg-slate-800 rounded shadow-sm"
                      onMouseDown={e => initResize(e, item)}
                      title="Resize"
                    >
                      <MoveHorizontal size={14} />
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 flex items-center gap-2 z-40">
        <button
          onClick={() => addItem("text")}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
          title="Add Text"
        >
          <Type size={20} />
        </button>
        <button
          onClick={() => addItem("image")}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
          title="Add Image"
        >
          <ImageIcon size={20} />
        </button>
        <button
          onClick={() => addItem("project")}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
          title="Add Project"
        >
          <FolderPlus size={20} />
        </button>
        <button
          onClick={() => addItem("video")}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
          title="Add Video"
        >
          <Video size={20} />
        </button>
        <button
          onClick={() => addItem("link")}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
          title="Add Link"
        >
          <LinkIcon size={20} />
        </button>
      </div>
    </div>
  );
};

export default VPDEditor;
