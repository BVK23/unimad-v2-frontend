"use client";
import React, { useState } from 'react';
import NavigationSidebar from './NavigationSidebar';
import CreatePostBox from './Feed/CreatePostBox';
import PostCard from './Feed/PostCard';
import UserProfileView from './Profile/UserProfileView';
import CommunityPage from './CommunityPage';
import CommunityDiscoveryModal from './CommunityDiscoveryModal';
import ChatView from './Chat/ChatView'; // New Import
import { MOCK_POSTS, MY_COMMUNITIES } from './Feed/FeedHelper';
import { Menu, Plus } from 'lucide-react';

const CommunityMain: React.FC = () => {
    // View state now includes 'chat'
    const [view, setView] = useState<'feed' | 'profile' | 'community' | 'chat'>('feed');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
    const [chatTargetUser, setChatTargetUser] = useState<string | null>(null); // For starting chat with specific user
    const [showDiscovery, setShowDiscovery] = useState(false);

    const handleViewProfile = (userId: string) => {
        setSelectedUserId(userId);
        setView('profile');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleViewCommunity = (communityId: string) => {
        setSelectedCommunityId(communityId);
        setView('community');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleViewChat = (userId?: string) => {
        setChatTargetUser(userId || null);
        setView('chat');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToFeed = () => {
        setView('feed');
        setSelectedUserId(null);
        setSelectedCommunityId(null);
        setChatTargetUser(null);
    };

    return (
        <div className="w-full h-full bg-slate-50 dark:bg-[#0a0a0a] overflow-y-auto overflow-x-hidden">

            {showDiscovery && <CommunityDiscoveryModal onClose={() => setShowDiscovery(false)} />}

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN */}
                    <div className="hidden lg:block lg:col-span-2">
                        <div className="sticky top-0 pt-0">
                            <NavigationSidebar
                                onSeeAllClick={() => setShowDiscovery(true)}
                                onSelectCommunity={handleViewCommunity}
                                onMessagesClick={() => handleViewChat()} // Wired Up
                                activeTab={view === 'chat' ? 'messages' : view === 'profile' ? undefined : 'home'}
                            />
                        </div>
                    </div>

                    {/* CENTER COLUMN */}
                    <div className="col-span-1 lg:col-span-10">

                        {view === 'feed' && (
                            <div className="max-w-4xl mx-auto">
                                {/* DESKTOP HEADER */}
                                <div className="hidden lg:block mb-6">
                                    <h1 className="text-2xl font-medium text-slate-900 dark:text-white">Community Feed</h1>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Connect with fellow designers and creative technologists.</p>
                                </div>
                                {/* MOBILE HEADER */}
                                <div className="lg:hidden mb-6 -mx-4 px-4 pb-2 border-b border-slate-200 dark:border-white/5 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                                    <div className="flex items-center justify-between mb-3 pt-2">
                                        <h2 className="font-medium text-slate-900 dark:text-white">Communities</h2>
                                        <button onClick={() => setShowDiscovery(true)} className="p-2 -mr-2 text-brand-500">
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                        {MY_COMMUNITIES.map(comm => (
                                            <button
                                                key={comm.id}
                                                onClick={() => handleViewCommunity(comm.id)}
                                                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-xs font-medium whitespace-nowrap text-slate-700 dark:text-slate-300"
                                            >
                                                <span>{comm.icon}</span>
                                                {comm.name}
                                            </button>
                                        ))}
                                        <button onClick={() => setShowDiscovery(true)} className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-brand-500">
                                            See All
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <CreatePostBox />
                                </div>

                                <div className="flex items-center gap-4 text-sm font-medium mb-0 border-b border-slate-200 dark:border-white/5 pb-0">
                                    <button className="px-3 py-3 border-b-2 border-brand-500 text-slate-900 dark:text-white font-medium">Best</button>
                                    <button className="px-3 py-3 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Hot</button>
                                    <button className="px-3 py-3 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">New</button>
                                    <button className="px-3 py-3 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Top</button>
                                </div>

                                <div className="flex flex-col">
                                    {MOCK_POSTS.map(post => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            onViewProfile={handleViewProfile}
                                            onNavToCommunity={handleViewCommunity}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {view === 'profile' && selectedUserId && (
                            <div className="max-w-4xl mx-auto">
                                <UserProfileView
                                    userId={selectedUserId}
                                    onBack={handleBackToFeed}
                                    onMessage={() => handleViewChat(selectedUserId)} // Wired Up Profile Button
                                />
                            </div>
                        )}

                        {view === 'community' && selectedCommunityId && (
                            <div className="max-w-4xl mx-auto">
                                <CommunityPage
                                    communityId={selectedCommunityId}
                                    onBack={handleBackToFeed}
                                    onViewProfile={handleViewProfile}
                                />
                            </div>
                        )}

                        {view === 'chat' && (
                            <div className="max-w-4xl mx-auto">
                                <ChatView
                                    initialUserId={chatTargetUser} // Pass target user to open specific chat
                                    onBack={handleBackToFeed}
                                />
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityMain;
