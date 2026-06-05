import React from 'react';
import { X, Search } from 'lucide-react';
import { MY_COMMUNITIES, SUGGESTED_GROUPS } from './Feed/FeedHelper';

interface CommunityDiscoveryModalProps {
    onClose: () => void;
}

const ALL_COMMUNITIES = [...MY_COMMUNITIES, ...SUGGESTED_GROUPS.map(g => ({ ...g, icon: g.image }))];

const CommunityDiscoveryModal: React.FC<CommunityDiscoveryModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white dark:bg-[#0F0F0F] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-slate-900 dark:text-white">Discover Communities</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 pb-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find communities..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ALL_COMMUNITIES.map((comm) => (
                        <div key={comm.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all group bg-white dark:bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{comm.icon || '🌍'}</span>
                                <div>
                                    <h4 className="font-medium text-slate-900 dark:text-white text-sm">{comm.name}</h4>
                                    <p className="text-xs text-slate-500">24k members</p>
                                </div>
                            </div>
                            <button className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white text-xs font-medium hover:bg-brand-500 hover:text-white transition-colors">
                                Join
                            </button>
                        </div>
                    ))}
                    {/* Dummy fillers for UI demo */}
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all group bg-white dark:bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🚀</span>
                                <div>
                                    <h4 className="font-medium text-slate-900 dark:text-white text-sm">Startup Life</h4>
                                    <p className="text-xs text-slate-500">12k members</p>
                                </div>
                            </div>
                            <button className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white text-xs font-medium hover:bg-brand-500 hover:text-white transition-colors">
                                Join
                            </button>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default CommunityDiscoveryModal;
