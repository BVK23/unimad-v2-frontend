import React, { useState } from 'react';
import { Terminal, X, ChevronRight, ChevronLeft, Plus, Layers } from 'lucide-react';

interface PopupAction {
    id: string;
    label: string;
    onClick: () => void;
}

interface DebugConsoleProps {
    context: string;
    popups: PopupAction[];
    onAddPopup?: () => void;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ context, popups, onAddPopup }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'main' | 'list'>('main');

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-slate-900 text-white p-3 rounded-full shadow-lg z-[100] hover:bg-slate-800 transition-all hover:scale-105"
                title="Open Debug Console"
            >
                <Terminal size={20} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-slate-200 w-72 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-bottom-4 border border-slate-700 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    {view === 'list' ? (
                        <button onClick={() => setView('main')} className="text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                    ) : (
                        <Terminal size={14} className="text-brand-400" />
                    )}
                    <span className="text-xs font-medium uppercase tracking-wider">
                        {view === 'list' ? 'Available Popups' : 'Dev Console'}
                    </span>
                </div>
                <button
                    onClick={() => { setIsOpen(false); setView('main'); }}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Content */}
            <div className="p-2 space-y-1">
                {view === 'main' ? (
                    <button
                        onClick={() => setView('list')}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3">
                            <Layers size={16} className="text-slate-400 group-hover:text-brand-400 transition-colors" />
                            <span>Pop ups</span>
                        </div>
                        <ChevronRight size={14} className="text-slate-500" />
                    </button>
                ) : (
                    <div className="space-y-1 animate-in fade-in slide-in-from-right-4 duration-200">
                        {popups.length > 0 ? (
                            popups.map((popup) => (
                                <button
                                    key={popup.id}
                                    onClick={popup.onClick}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg text-xs font-medium transition-colors text-left"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                                    {popup.label}
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-xs text-slate-500 italic">
                                No popups for {context}
                            </div>
                        )}

                        <div className="h-px bg-slate-700 my-2"></div>

                        <button
                            onClick={onAddPopup || (() => alert("Add Popup Logic Implementation"))}
                            className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-slate-600 hover:border-brand-500 hover:text-brand-400 rounded-lg text-xs transition-colors text-slate-400"
                        >
                            <Plus size={14} /> Add Pop up
                        </button>
                    </div>
                )}
            </div>

            {view === 'main' && (
                <div className="p-2 bg-slate-800/50 text-[10px] text-slate-500 text-center">
                    Context: <span className="text-brand-400 uppercase">{context}</span>
                </div>
            )}
        </div>
    );
};

export default DebugConsole;
