import React, { useState } from 'react';
import { Plus, Clock, MoreVertical, FilePlus, Copy, Trash2, Link, ExternalLink, ArrowLeft, Star, Monitor, LayoutTemplate } from 'lucide-react';
import { PortfolioData } from '../types';

interface PortfolioDashboardProps {
    onEditPortfolio: (portfolio: PortfolioData) => void;
    onCreatePortfolio: (type: 'scratch' | 'template') => void;
}

// Mock Data Initial State
const INITIAL_PORTFOLIOS: PortfolioData[] = [
    {
        id: '1',
        title: 'Product Design Portfolio',
        lastModified: new Date('2023-10-15'),
        isBase: true,
        slug: 'alex-morgan-design',
        themeMode: 'light',
        profile: {
            name: 'Alex Morgan',
            email: 'alex@unimad.dev',
            phone: '+1 (555) 012-3456',
            location: 'San Francisco, CA',
            bio: '',
            tagline: 'Product Designer & Creative Technologist',
            website: 'alexmorgan.design',
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            coverUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80',
            experience: [],
            education: [],
            layout: 'standard',
            profileAlignment: 'center',
            infoAlignment: 'left',
            showAvatar: true,
            showCover: true,
            showProfileSection: true,
            itemsAboveProfileCount: 0,
        },
        items: []
    }
];

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ onEditPortfolio, onCreatePortfolio }) => {
    const [portfolios, setPortfolios] = useState<PortfolioData[]>(INITIAL_PORTFOLIOS);
    const [createModalState, setCreateModalState] = useState<'closed' | 'menu'>('closed');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const handleDuplicate = (e: React.MouseEvent, portfolio: PortfolioData) => {
        e.stopPropagation();
        const newPortfolio: PortfolioData = {
            ...portfolio,
            id: Date.now().toString(),
            title: `${portfolio.title} (Copy)`,
            lastModified: new Date(),
            isBase: false,
            slug: `${portfolio.slug}-copy`
        };
        setPortfolios([newPortfolio, ...portfolios]);
        setActiveMenuId(null);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this portfolio?')) {
            setPortfolios(portfolios.filter(p => p.id !== id));
        }
        setActiveMenuId(null);
    };
 
    const handleSetBase = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setPortfolios(portfolios.map(p => ({
            ...p,
            isBase: p.id === id
        })));
        setActiveMenuId(null);
    };

    const handleCopyLink = (e: React.MouseEvent, portfolio: PortfolioData) => {
        e.stopPropagation();
        const identifier = portfolio.customDomain || portfolio.slug || portfolio.id;
        navigator.clipboard.writeText(`https://unimad.ai/${identifier}`);
        alert("Link copied to clipboard!");
        setActiveMenuId(null);
    };

    return (
        <div className="flex-1 bg-slate-50 h-full overflow-y-auto p-8 relative" onClick={() => setActiveMenuId(null)}>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-normal text-slate-900">Portfolios</h1>
                    <p className="text-slate-500 mt-1">Manage and tailor your portfolios for different opportunities or niches.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* Create New Card (Visual Shortcut) */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setCreateModalState('menu'); }}
                        className="group flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-xl hover:border-brand-400 hover:bg-brand-50/50 transition-all cursor-pointer bg-white"
                    >
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600 mb-3 transition-colors">
                            <Plus size={24} />
                        </div>
                        <span className="font-medium text-slate-600 group-hover:text-brand-600">New Portfolio</span>
                    </button>

                    {/* Portfolio Cards */}
                    {portfolios.map(portfolio => (
                        <div
                            key={portfolio.id}
                            onClick={() => onEditPortfolio(portfolio)}
                            className={`
                        bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 cursor-pointer transition-all hover:-translate-y-1 group relative
                        ${activeMenuId === portfolio.id ? 'z-30 ring-2 ring-brand-100' : 'z-0'}
                    `}
                        >
                            {/* Preview Thumbnail Area */}
                            <div className="h-40 relative overflow-hidden flex items-center justify-center rounded-t-xl bg-cover bg-center" style={{ backgroundImage: `url(${portfolio.profile.coverUrl})`}}>
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                {portfolio.isBase && (
                                    <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-brand-600 border border-brand-100 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                        <Star size={10} fill="currentColor" /> Base Portfolio
                                    </div>
                                )}
                                {/* Mockup of website interface */}
                                <div className="w-40 h-28 bg-white/95 backdrop-blur-md rounded-lg shadow-xl relative overflow-hidden border border-white/20 transform group-hover:scale-105 transition-transform duration-300">
                                   <div className="h-3 bg-slate-100 border-b border-slate-200 flex items-center px-1.5 gap-0.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                   </div>
                                   <div className="p-2">
                                       <div className="w-4 h-4 rounded-full bg-slate-200 mx-auto mt-1 mb-1.5"></div>
                                       <div className="w-16 h-1 bg-slate-800 mx-auto rounded-full mb-1"></div>
                                       <div className="w-12 h-0.5 bg-slate-400 mx-auto rounded-full mb-3"></div>
                                       
                                       <div className="grid grid-cols-3 gap-1 px-1">
                                           <div className="h-6 bg-slate-100 rounded"></div>
                                           <div className="h-6 bg-slate-100 rounded"></div>
                                           <div className="h-6 bg-slate-100 rounded"></div>
                                       </div>
                                   </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4 rounded-b-xl relative border-t border-slate-100">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h3 className="font-medium text-slate-900 mb-1 truncate">{portfolio.title}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                            <Clock size={12} />
                                            <span>Edited {portfolio.lastModified.toLocaleDateString('en-US')}</span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            className={`p-1 rounded transition-colors ${activeMenuId === portfolio.id ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === portfolio.id ? null : portfolio.id);
                                            }}
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {activeMenuId === portfolio.id && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEditPortfolio(portfolio); }}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors"
                                                >
                                                    <Monitor size={14} /> Open Editor
                                                </button>
                                                <button
                                                    onClick={(e) => handleDuplicate(e, portfolio)}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors"
                                                >
                                                    <Copy size={14} /> Duplicate
                                                </button>
                                                <button
                                                    onClick={(e) => handleCopyLink(e, portfolio)}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors"
                                                >
                                                    <Link size={14} /> Copy Link
                                                </button>
                                                {!portfolio.isBase && (
                                                    <button
                                                        onClick={(e) => handleSetBase(e, portfolio.id)}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors"
                                                    >
                                                        <Star size={14} /> Set as Base
                                                    </button>
                                                )}
                                                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                                <button
                                                    onClick={(e) => handleDelete(e, portfolio.id)}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2.5 transition-colors"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Modal */}
            {createModalState !== 'closed' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative">

                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 relative">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-normal text-slate-900">
                                    Create New Portfolio
                                </h2>
                            </div>
                            <button onClick={() => setCreateModalState('closed')} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
                                <Plus className="rotate-45" size={20} />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={() => { setCreateModalState('closed'); onCreatePortfolio('scratch'); }}
                                    className="flex flex-col items-center text-center p-8 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all group"
                                >
                                    <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <FilePlus size={28} />
                                    </div>
                                    <h3 className="font-medium text-slate-900 mb-2">Blank Canvas</h3>
                                    <p className="text-sm text-slate-500">Start from scratch with a completely empty structured grid framework.</p>
                                </button>

                                <button
                                    onClick={() => { setCreateModalState('closed'); onCreatePortfolio('template'); }}
                                    className="flex flex-col items-center text-center p-8 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all group"
                                >
                                    <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <LayoutTemplate size={28} />
                                    </div>
                                    <h3 className="font-medium text-slate-900 mb-2">Browse Templates</h3>
                                    <p className="text-sm text-slate-500">Start with a pre-designed layout tailored to different creative disciplines.</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioDashboard;
