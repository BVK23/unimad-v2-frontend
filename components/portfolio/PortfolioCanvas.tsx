"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Layout, Settings, Eye, Edit3, Share2, Trash2, GripVertical, Search, MousePointer2 } from 'lucide-react';
import { PortfolioPageSchema, PortfolioBlock, PortfolioBlockType } from '../../types';
import BrandBlock from './BrandBlock';
import LibraryDrawer from './LibraryDrawer';
import { PORTFOLIO_TEMPLATES } from './TemplateData';

const INITIAL_SCHEMA: PortfolioPageSchema = PORTFOLIO_TEMPLATES['Creative'];

const PortfolioCanvas: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(true);
  const [schema, setSchema] = useState<PortfolioPageSchema>(INITIAL_SCHEMA);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('Creative');

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number, y: number } | null>(null);
  const [ghostBlock, setGhostBlock] = useState<{ type: PortfolioBlockType, variant: string } | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isEditMode) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Hide default drag image to use custom ghost if needed, 
    // but for now native is often better for performance.
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    if (draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    const items = [...schema.blocks];
    const item = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, item);
    
    setSchema({ ...schema, blocks: items });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Handle ghost image for library drag
    const type = e.dataTransfer.getData('blockType') as PortfolioBlockType;
    const variant = e.dataTransfer.getData('variant');
    
    if (type && variant) {
      setGhostBlock({ type, variant });
      setGhostPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const addBlock = (type: PortfolioBlockType, variant: string) => {
    const newBlock: PortfolioBlock = {
      id: `block_${Date.now()}`,
      type,
      variant,
      data: {} 
    };
    
    setSchema({
      ...schema,
      blocks: [...schema.blocks, newBlock]
    });
    setIsLibraryOpen(false);
  };

  const removeBlock = (id: string) => {
    setSchema({
      ...schema,
      blocks: schema.blocks.filter(b => b.id !== id)
    });
  };

  const switchTemplate = (name: string) => {
    if (PORTFOLIO_TEMPLATES[name]) {
      setSchema(PORTFOLIO_TEMPLATES[name]);
      setActiveTemplate(name);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0a] overflow-hidden">
      {/* Top Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-[100]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold animate-pulse">U</div>
            <span className="font-bold text-slate-900 dark:text-white text-lg">Portfolio Studio</span>
          </div>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
          
          {/* Template Switcher */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {Object.keys(PORTFOLIO_TEMPLATES).map(name => (
              <button
                key={name}
                onClick={() => switchTemplate(name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTemplate === name ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${isEditMode ? 'bg-slate-900 text-white shadow-xl translate-y-[-1px]' : 'bg-brand-50 text-brand-600'}`}
          >
            {isEditMode ? <><Eye size={16} /> Preview Mode</> : <><Edit3 size={16} /> Edit Mode</>}
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-sm font-bold shadow-lg shadow-brand-500/20 transition-all active:scale-95">
            Publish
          </button>
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto no-scrollbar relative"
        onDragOver={handleGlobalDragOver}
        onDragLeave={() => { setGhostPosition(null); setGhostBlock(null); }}
        onDrop={(e) => {
          const type = e.dataTransfer.getData('blockType') as PortfolioBlockType;
          const variant = e.dataTransfer.getData('variant');
          if (type && variant) {
             addBlock(type, variant);
          }
          setGhostPosition(null);
          setGhostBlock(null);
        }}
      >
        {/* Main Canvas */}
        <div ref={canvasRef} className={`transition-all duration-700 mx-auto ease-in-out ${isEditMode ? 'max-w-6xl py-12 px-8' : 'max-w-none p-0'}`}>
          <div className={`flex flex-col gap-8 min-h-[70vh] ${isEditMode ? 'pb-40' : ''}`}>
            {schema.blocks.map((block, index) => (
              <div
                key={block.id}
                draggable={isEditMode}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
                className={`
                  relative group transition-all duration-300
                  ${isEditMode ? 'rounded-[2.5rem] bg-white dark:bg-slate-950/40 border border-transparent hover:border-brand-500/30 hover:shadow-2xl hover:shadow-brand-500/5' : ''}
                  ${draggedIndex === index ? 'opacity-30 scale-[0.98] blur-sm' : 'opacity-100'}
                  ${dragOverIndex === index ? 'border-t-4 border-t-brand-500 pt-8' : ''}
                `}
              >
                {/* Block Controls */}
                {isEditMode && (
                  <div className="absolute -left-16 top-0 bottom-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3">
                    <div className="p-2.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-brand-600 bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <GripVertical size={18} />
                    </div>
                    <button 
                      onClick={() => removeBlock(block.id)}
                      className="p-2.5 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 rounded-2xl"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button className="p-2.5 text-slate-400 hover:text-brand-500 bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <Settings size={18} />
                    </button>
                  </div>
                )}

                {/* Block Content Container */}
                <div className={`${isEditMode ? 'p-1 overflow-hidden rounded-[2.5rem]' : ''}`}>
                  <BrandBlock block={block} isEditMode={isEditMode} />
                </div>

                {/* Insertion Marker Button */}
                {isEditMode && (
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all z-20">
                    <button 
                      onClick={() => setIsLibraryOpen(true)}
                      className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all border-4 border-white dark:border-slate-950"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {schema.blocks.length === 0 && (
              <div className="h-[60vh] flex flex-col items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[4rem] space-y-8 p-12 text-center bg-white/30 backdrop-blur-sm">
                <div className="p-8 bg-slate-100 dark:bg-slate-800 rounded-[2rem] animate-bounce">
                  <Layout size={60} className="text-slate-300" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Design Your Space</h3>
                  <p className="text-lg text-slate-500 max-w-md mx-auto">Drop sections from the library to build your modular portfolio showcase.</p>
                </div>
                <button 
                  onClick={() => setIsLibraryOpen(true)}
                  className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-2xl flex items-center gap-3 hover:scale-105 transition-all text-lg"
                >
                  <Plus size={24} /> Browse Library
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ghost Image Preview Overlay */}
      {ghostPosition && ghostBlock && (
        <div 
          className="fixed pointer-events-none z-[200] opacity-60 scale-90 mix-blend-multiply dark:mix-blend-screen transition-transform duration-75"
          style={{ 
            left: ghostPosition.x - 200, 
            top: ghostPosition.y - 100,
            width: '400px'
          }}
        >
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-brand-500 shadow-2xl overflow-hidden aspect-video flex flex-col justify-center items-center gap-4">
             <div className="p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-2xl">
                <Layout size={32} />
             </div>
             <p className="font-bold text-slate-900 dark:text-white">Dropping: {ghostBlock.type}</p>
          </div>
        </div>
      )}

      {/* Floating Library Button */}
      {isEditMode && !isLibraryOpen && (
        <button 
          onClick={() => setIsLibraryOpen(true)}
          className="fixed bottom-10 right-10 flex items-center gap-3 px-8 py-4 bg-brand-600 text-white rounded-full font-black shadow-[0_20px_50px_rgba(244,63,94,0.3)] hover:scale-105 active:scale-95 transition-all z-[90]"
        >
          <Layout size={20} /> Library
        </button>
      )}

      {/* Library Drawer (Zone B) */}
      <LibraryDrawer 
        isOpen={isLibraryOpen} 
        onClose={() => setIsLibraryOpen(false)} 
        onAddBlock={addBlock} 
      />
    </div>
  );
};

export default PortfolioCanvas;
