"use client";
import React, { useState } from "react";
import { X, Search, Plus, Layout, Grid, BarChart3, List, User, Calendar, Mail, Image as ImageIcon } from "lucide-react";
import { PortfolioBlockType } from "../../types";

interface BlockLibraryItem {
  id: string;
  type: PortfolioBlockType;
  variant: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
}

const LIBRARY_BLOCKS: BlockLibraryItem[] = [
  // Start / Hero
  {
    id: "h1",
    type: "hero",
    variant: "centered",
    name: "Centered Hero",
    description: "Bold text centered on the page",
    category: "Start",
    icon: <Layout size={20} />,
  },
  {
    id: "h2",
    type: "hero",
    variant: "split",
    name: "Split Hero",
    description: "Text on left, image on right",
    category: "Start",
    icon: <Grid size={20} />,
  },
  {
    id: "h3",
    type: "hero",
    variant: "full-bg",
    name: "Impact Hero",
    description: "Full-screen background image",
    category: "Start",
    icon: <ImageIcon size={20} />,
  },

  // Proof
  {
    id: "p1",
    type: "proof_gallery",
    variant: "grid_3col",
    name: "Project Grid",
    description: "3-column visual card grid",
    category: "Proof",
    icon: <Grid size={20} />,
  },
  {
    id: "p2",
    type: "proof_casestudy",
    variant: "list",
    name: "Case Study List",
    description: "Text-based project summaries",
    category: "Proof",
    icon: <List size={20} />,
  },

  // Authority
  {
    id: "a1",
    type: "authority_metrics",
    variant: "grid",
    name: "ROI Metrics",
    description: "Bold numbers and impact",
    category: "Authority",
    icon: <BarChart3 size={20} />,
  },
  {
    id: "a2",
    type: "authority_stack",
    variant: "grid",
    name: "Tech Stack",
    description: "Logo grid of your tools",
    category: "Authority",
    icon: <Layout size={20} />,
  },

  // Narrative
  {
    id: "n1",
    type: "narrative_bio",
    variant: "standard",
    name: "Clean Bio",
    description: "Story-focused personal intro",
    category: "Narrative",
    icon: <User size={20} />,
  },
  {
    id: "n2",
    type: "narrative_timeline",
    variant: "vertical",
    name: "Career Timeline",
    description: "Interactive time-indexed path",
    category: "Narrative",
    icon: <List size={20} />,
  },

  // CTA
  {
    id: "c1",
    type: "cta_contact",
    variant: "contact",
    name: "Contact Form",
    description: "Modern lead capture section",
    category: "CTA",
    icon: <Mail size={20} />,
  },
  {
    id: "c2",
    type: "cta_calendly",
    variant: "calendly",
    name: "Calendly Embed",
    description: "Direct booking scheduler",
    category: "CTA",
    icon: <Calendar size={20} />,
  },
];

interface LibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (type: PortfolioBlockType, variant: string) => void;
}

const LibraryDrawer: React.FC<LibraryDrawerProps> = ({ isOpen, onClose, onAddBlock }) => {
  const [search, setSearch] = useState("");

  const categories = ["All", "Start", "Proof", "Authority", "Narrative", "CTA"];
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredBlocks = LIBRARY_BLOCKS.filter(block => {
    const matchesSearch =
      block.name.toLowerCase().includes(search.toLowerCase()) || block.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || block.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-950 shadow-2xl transition-transform duration-300 transform pointer-events-auto border-l border-slate-200 dark:border-slate-800 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Section</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 pt-6 mb-4">
            <div className="relative group">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors"
              />
              <input
                type="text"
                placeholder="Search components..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 rounded-xl outline-none transition-all text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="px-6 mb-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 no-scrollbar">
            {filteredBlocks.map(block => (
              <div
                key={block.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData("blockType", block.type);
                  e.dataTransfer.setData("variant", block.variant);
                }}
                className="group p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-brand-500 transition-all cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-brand-500/5"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 rounded-xl shadow-sm">
                    {block.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{block.name}</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{block.category}</p>
                  </div>
                  <button
                    onClick={() => onAddBlock(block.type, block.variant)}
                    className="p-1.5 bg-white dark:bg-slate-800 rounded-lg hover:bg-brand-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {/* Visual Preview Surrogate */}
                <div className="mt-3 aspect-video bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/50 flex items-center justify-center relative">
                  <span className="text-[10px] text-slate-400 font-medium">Layout Preview</span>
                  {/* Abstract representation of the block */}
                  <div className="absolute inset-0 p-4 flex flex-col gap-2 opacity-10">
                    <div className="h-2 w-1/2 bg-slate-400 rounded-full" />
                    <div className="h-1 w-full bg-slate-300 rounded-full" />
                    <div className="h-1 w-3/4 bg-slate-300 rounded-full" />
                    <div className="flex-1 bg-slate-200 rounded-lg mt-1" />
                  </div>
                </div>
              </div>
            ))}

            {filteredBlocks.length === 0 && (
              <div className="py-20 text-center text-slate-400 space-y-4">
                <Search size={40} className="mx-auto text-slate-200" />
                <p>No sections found for "{search}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryDrawer;
