import React from 'react';
import { Home, Compass, Plus, User, Bookmark, MessageCircle } from 'lucide-react';
import { MY_COMMUNITIES } from './Feed/FeedHelper';

interface NavigationSidebarProps {
    onSeeAllClick?: () => void;
    onSelectCommunity?: (communityId: string) => void;
    onMessagesClick?: () => void; // Added for Chat
    activeTab?: 'home' | 'popular' | 'saved' | 'messages'; // Added for highlight state
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
    onSeeAllClick,
    onSelectCommunity,
    onMessagesClick,
    activeTab = 'home'
}) => {
    return (
        <div className="space-y-6">

            {/* Simplified User Profile & Navigation */}
            <div>
                <div className="px-2 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5">
                            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 overflow-hidden">
                                <User size={20} />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-medium text-xs text-slate-900 dark:text-white leading-tight whitespace-nowrap">Alex Morgan</h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">Product Designer</p>
                        </div>
                    </div>

                    <div className="flex gap-4 text-xs">
                        <div className="flex gap-1.5 items-center">
                            <span className="font-semibold text-slate-900 dark:text-white">248</span>
                            <span className="text-slate-500">conn</span>
                        </div>
                        <div className="flex gap-1.5 items-center">
                            <span className="font-semibold text-slate-900 dark:text-white">12</span>
                            <span className="text-slate-500">posts</span>
                        </div>
                    </div>
                </div>

                <div className="px-0 pb-2">
                    <nav className="space-y-0.5">
                        <NavItem icon={Home} label="Home" isActive={activeTab === 'home'} />
                        <NavItem icon={Compass} label="Popular" isActive={activeTab === 'popular'} />
                        <NavItem
                            icon={MessageCircle}
                            label="Messages"
                            isActive={activeTab === 'messages'}
                            onClick={onMessagesClick}
                            badge={3}
                        />
                        <NavItem icon={Bookmark} label="Saved Posts" isActive={activeTab === 'saved'} />
                    </nav>
                </div>
            </div>

            {/* Communities List - Minimal */}
            <div className="px-0">
                <div className="flex items-center justify-between mb-2 px-2">
                    <h4 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Communities</h4>
                    <button onClick={onSeeAllClick} className="text-slate-400 hover:text-brand-500 transition-colors">
                        <Plus size={14} />
                    </button>
                </div>

                <ul className="space-y-0.5">
                    {MY_COMMUNITIES.map(comm => (
                        <CommunityItem
                            key={comm.id}
                            name={comm.name}
                            icon={comm.icon}
                            isNew={comm.isNew}
                            onClick={() => onSelectCommunity && onSelectCommunity(comm.id)}
                        />
                    ))}
                </ul>
                <button
                    onClick={onSeeAllClick}
                    className="w-full mt-2 text-[11px] text-zinc-500 hover:text-slate-900 dark:hover:text-white transition-colors text-left flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
                >
                    Show more
                </button>
            </div>

            <div className="px-2 text-[10px] text-slate-400 pt-2 opacity-60">
                <p>© 2026 Unimad Inc.</p>
            </div>
        </div>
    );
};

const NavItem = ({ icon: Icon, label, isActive = false, onClick, badge }: { icon: any, label: string, isActive?: boolean, onClick?: () => void, badge?: number }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive
            ? 'bg-slate-50 dark:bg-brand-500/10 text-slate-900 dark:text-brand-400'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
            }`}>
        <div className="flex items-center gap-3">
            <Icon size={16} className={isActive ? 'text-slate-900 dark:text-brand-400' : 'text-slate-400'} />
            {label}
        </div>
        {badge && (
            <span className="bg-brand-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {badge}
            </span>
        )}
    </button>
);

const CommunityItem = ({ name, icon, isNew, onClick }: { name: string, icon: string, isNew?: boolean, onClick?: () => void }) => (
    <li
        onClick={onClick}
        className="flex items-center justify-between group cursor-pointer px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2">
            <span className="text-base leading-none">{icon}</span>
            <span className="text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate max-w-[140px]">
                {name}
            </span>
        </div>
        {isNew && <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>}
    </li>
);

export default NavigationSidebar;
