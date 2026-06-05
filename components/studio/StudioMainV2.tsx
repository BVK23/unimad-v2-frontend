import React, { useState, useEffect } from 'react';
import { Copy, ThumbsUp, MessageSquare, Repeat, Send, MoreHorizontal, Globe, Wand2, ExternalLink, Download, Plus, ChevronLeft, History, Image as ImageIcon, Video, FileSpreadsheet, ChevronDown, ChevronUp, Upload, Check, Info } from 'lucide-react';
import PostSchedulerModal from './PostSchedulerModal';
import AllPostsModal from './AllPostsModal';
import AllDocumentsModal from './AllDocumentsModal';
import AllVPDsModal from './AllVPDsModal';
import DocumentListCard from './DocumentListCard';
import LinkedInOptimizeBanner from './LinkedInOptimizeBanner';
import LinkedInPostListCard, { LinkedInListItem } from './LinkedInPostListCard';
import StudioListDeleteButton from './StudioListDeleteButton';
import StudioSectionDot from './StudioSectionDot';
import { DocumentLibraryItem } from './documentLibraryTypes';
import VpdLibraryCard from './VpdLibraryCard';
import VpdEditorWindow from './VpdEditorWindow';
import VpdPreview from './VpdPreview';
import RichTextEditor from '../RichTextEditor';
import { GeneratorContext } from '../../types/jobs';
import { PortfolioItem } from '../../types';

interface StudioMainProps {
    initialContext?: GeneratorContext | null;
}

const ALL_TOPICS = [
    { id: 'linkedin-post', label: 'LinkedIn Post' },
    { id: 'referral', label: 'Referral Request' },
    { id: 'cover-letter', label: 'Cover Letter' },
    { id: 'cold-email', label: 'Cold Email' },
    { id: 'vpd', label: 'Value Prop Doc' },
] as const;

const TOPIC_DESCRIPTIONS: Record<string, string> = {
    'linkedin-post': 'Craft and schedule LinkedIn posts that build your personal brand.',
    referral: 'Ask for warm introductions with tailored referral messages.',
    'cover-letter': 'Generate tailored cover letters for each application.',
    'cold-email': 'Write professional outreach emails to hiring managers.',
    vpd: 'Document your strengths with a clear value proposition.',
};

const TOPIC_GROUPS: { topics: { id: string; label: string }[]; blueStroke: boolean }[] = [
    {
        topics: [
            { id: 'linkedin-post', label: 'LinkedIn Post' },
            { id: 'referral', label: 'Referral Request' },
        ],
        blueStroke: true,
    },
    {
        topics: [
            { id: 'cover-letter', label: 'Cover Letter' },
            { id: 'cold-email', label: 'Cold Email' },
            { id: 'vpd', label: 'Value Prop Doc' },
        ],
        blueStroke: false,
    },
];

const MOODS = ['Professional', 'Casual', 'Enthusiastic', 'Thought Leadership', 'Storytelling'];
const CONTENT_TYPES = ['Career Update', 'Industry Insight', 'Personal Story', 'Project Showcase', 'Advice'];

type VpdListItem = {
    id: string | number;
    title: string;
    date: string;
    isTemplate?: boolean;
    project: PortfolioItem;
};

const makeVpdListItem = (
    id: string,
    title: string,
    date: string,
    detailedBlocks: PortfolioItem[],
    isTemplate?: boolean,
): VpdListItem => ({
    id,
    title,
    date,
    isTemplate,
    project: {
        id,
        type: 'project',
        span: 3,
        title,
        description: isTemplate ? 'Starter layout for your pitch' : '',
        content: '',
        detailedBlocks,
    },
});

// Mock Previous VPDs & templates
const MOCK_VPDS: VpdListItem[] = [
    makeVpdListItem('vpd-1', 'Product Designer @ Google', '2 days ago', [
        { id: 'b1', type: 'text', title: 'Core strengths', content: 'Design systems, prototyping, and cross-functional collaboration.', span: 12 },
        { id: 'b2', type: 'text', title: 'Why me', content: 'Shipped onboarding flows that lifted activation by 18%.', span: 6 },
        { id: 'b3', type: 'link-box', title: 'Portfolio', content: 'https://portfolio.example.com', span: 6 },
    ]),
    makeVpdListItem('vpd-2', 'UX Researcher @ Spotify', '1 week ago', [
        { id: 'b1', type: 'text', title: 'Research focus', content: 'Mixed-methods studies for subscription retention.', span: 12 },
        { id: 'b2', type: 'text', title: 'Impact', content: 'Influenced roadmap for discovery personalization.', span: 6 },
        { id: 'b3', type: 'media', title: 'Case study', content: 'https://picsum.photos/seed/vpd2/800/500', span: 6 },
    ]),
    makeVpdListItem('tpl-1', 'General pitch template', 'Template', [
        { id: 'b1', type: 'text', title: 'Headline', content: 'Your value proposition in one clear sentence.', span: 12 },
        { id: 'b2', type: 'text', title: 'Proof points', content: '3 measurable outcomes that match the role.', span: 6 },
        { id: 'b3', type: 'link-box', title: 'Work samples', content: 'https://your-portfolio.com', span: 6 },
    ], true),
    makeVpdListItem('tpl-2', 'Student portfolio template', 'Template', [
        { id: 'b1', type: 'text', title: 'About me', content: 'International student pursuing design with internship experience.', span: 12 },
        { id: 'b2', type: 'text', title: 'Projects', content: 'Highlight 2 academic or freelance projects.', span: 6 },
        { id: 'b3', type: 'link-box', title: 'LinkedIn', content: 'https://linkedin.com/in/you', span: 6 },
    ], true),
];

const createDefaultVpdProject = (): PortfolioItem => ({
    id: `vpd-${Date.now()}`,
    type: 'project',
    span: 3,
    title: 'New Value Prop Doc',
    description: '',
    content: '',
    detailedBlocks: [],
});

const buildVpdProjectFromDraft = (role: string, company: string, draftText: string): PortfolioItem => ({
    id: `vpd-${Date.now()}`,
    type: 'project',
    span: 3,
    title: role && company ? `${role} @ ${company}` : 'Value Proposition Document',
    description: '',
    content: '',
    detailedBlocks: [
        {
            id: 'vpd-b1',
            type: 'text',
            title: 'Core strengths',
            content: draftText.split('\n\n')[0] || draftText,
            span: 12,
        },
        {
            id: 'vpd-b2',
            type: 'text',
            title: 'Why me',
            content: 'Relevant experience and outcomes aligned with the role requirements.',
            span: 6,
        },
        {
            id: 'vpd-b3',
            type: 'link-box',
            title: 'Portfolio',
            content: 'https://portfolio.example.com',
            span: 6,
        },
    ],
});

// Mock Scheduled Posts
const MOCK_SCHEDULED: LinkedInListItem[] = [
    { id: 's1', content: "Just finished a great workshop on Design Systems! 🎨 #UX #Design", date: "Tomorrow, 10:00 AM" },
    { id: 's2', content: "Looking for recommendations on the best prototyping tools for 2024. 👇", date: "Fri, 2:00 PM" },
];

// Mock History
const MOCK_HISTORY: any[] = [
    { id: 'h1', content: "Excited to share that I've joined Unimad as a Product Designer! 🚀", stats: "1.2k views • 45 likes", date: "2 days ago", status: "Posted" },
    { id: 'h2', content: "My top 3 takeaways from Config 2023. A thread 🧵", stats: "3.5k views • 120 likes", date: "1 week ago", status: "Draft" },
];

const DOCUMENT_TOPIC_LABELS: Record<'cover-letter' | 'cold-email' | 'referral', string> = {
    'cover-letter': 'Cover Letters',
    'cold-email': 'Cold Emails',
    referral: 'Referral Requests',
};

const MOCK_SAVED_DOCUMENTS: DocumentLibraryItem[] = [
    {
        id: 'cl-1',
        topic: 'cover-letter',
        kind: 'recent',
        title: 'Product Designer @ Google',
        date: '2 days ago',
        content:
            'Dear Hiring Manager,\n\nI am writing to express my strong interest in the Product Designer position at Google...',
    },
    {
        id: 'cl-h1',
        topic: 'cover-letter',
        kind: 'history',
        title: 'UX Intern @ Figma',
        date: '2 weeks ago',
        status: 'Sent',
        content: 'Dear Hiring Manager,\n\nThank you for considering my application for the UX Intern role...',
    },
    {
        id: 'ce-1',
        topic: 'cold-email',
        kind: 'recent',
        title: 'PM @ Notion',
        date: '3 days ago',
        content: "Hi Sarah,\n\nI've been following the work your team is doing at Notion and I'm impressed by...",
    },
    {
        id: 'ce-h1',
        topic: 'cold-email',
        kind: 'history',
        title: 'Designer @ Linear',
        date: '1 month ago',
        status: 'Sent',
        content: 'Hi Alex,\n\nI hope this message finds you well. I wanted to reach out about design opportunities...',
    },
    {
        id: 'rf-1',
        topic: 'referral',
        kind: 'recent',
        title: 'Engineer @ Stripe',
        date: 'Yesterday',
        content: 'Hi Jamie,\n\nI hope you are doing well! I saw an opening for Software Engineer at Stripe...',
    },
    {
        id: 'rf-h1',
        topic: 'referral',
        kind: 'history',
        title: 'Designer @ Airbnb',
        date: '3 weeks ago',
        status: 'Sent',
        content: 'Hi Morgan,\n\nThank you again for passing my profile along to the design team...',
    },
];

const isDocumentTopic = (topic: string): topic is 'cover-letter' | 'cold-email' | 'referral' =>
    topic === 'cover-letter' || topic === 'cold-email' || topic === 'referral';

const StudioMainV2: React.FC<StudioMainProps> = ({ initialContext }) => {
    // V2 Force Refresh
    const [selectedTopic, setSelectedTopic] = useState<string>('linkedin-post');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // LinkedIn specific state
    const [mood, setMood] = useState('Professional');
    const [contentType, setContentType] = useState('Career Update');
    const [topicIdea, setTopicIdea] = useState('');

    // Specific Form States
    const [role, setRole] = useState('');
    const [company, setCompany] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [managerName, setManagerName] = useState('');
    const [connectionName, setConnectionName] = useState('');

    // VPD Specific State
    const [showVpdEditor, setShowVpdEditor] = useState(false);
    const [vpdProject, setVpdProject] = useState<PortfolioItem>(createDefaultVpdProject);
    const [savedVpds, setSavedVpds] = useState<VpdListItem[]>(MOCK_VPDS);
    const [vpdLibraryTab, setVpdLibraryTab] = useState<'recents' | 'templates'>('recents');

    // Scheduler State
    const [showScheduler, setShowScheduler] = useState(false);
    const [scheduledPosts, setScheduledPosts] = useState<LinkedInListItem[]>(MOCK_SCHEDULED);
    const [postHistory, setPostHistory] = useState(MOCK_HISTORY);


    // "All Posts" Modal State
    const [showAllPostsModal, setShowAllPostsModal] = useState(false);
    const [allPostsInitialTab, setAllPostsInitialTab] = useState<'scheduled' | 'history'>('scheduled');

    // "All VPDs" Modal State
    const [showAllVPDsModal, setShowAllVPDsModal] = useState(false);

    // Cover letter / cold email / referral library
    const [savedDocuments, setSavedDocuments] = useState<DocumentLibraryItem[]>(MOCK_SAVED_DOCUMENTS);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | number | null>(null);
    const [showAllDocumentsModal, setShowAllDocumentsModal] = useState(false);

    // Edit/View Post State
    const [selectedPostData, setSelectedPostData] = useState<any>(null); // For editing/viewing existing posts

    // Initialize/Reset
    useEffect(() => {
        if (initialContext) {
            setSelectedTopic(initialContext.type);
            // Assuming initialContext might have role/company, but description is now split
            setRole(initialContext.role || '');
            setCompany(initialContext.company || '');
            // For other fields, we'd need more specific mapping from initialContext.description
            // For now, we'll leave them empty or infer if possible.
        }
    }, [initialContext, selectedTopic]);

    useEffect(() => {
        setSelectedDocumentId(null);
    }, [selectedTopic]);


    const handlePost = (finalContent: string, isScheduled: boolean, scheduleDate?: Date) => {
        // Optimistic update for demo purposes
        // In real app, we might check if we are UPDATING an existing post (selectedPostData) or creating NEW

        if (isScheduled && scheduleDate) {
            // Add to scheduled
            const newScheduled = {
                id: selectedPostData?.id || Date.now(), // Keep ID if editing
                content: finalContent,
                date: scheduleDate.toLocaleString()
            };

            if (selectedPostData?.isScheduled) {
                // Update existing
                setScheduledPosts(scheduledPosts.map(p => p.id === newScheduled.id ? newScheduled : p));
            } else {
                // Add new
                setScheduledPosts([newScheduled, ...scheduledPosts]);
            }
        } else {
            // Add to history
            const newPost = {
                id: Date.now(), // History always new entry effectively? Or update if editing draft? Let's say new for now.
                content: finalContent,
                stats: "0 views • 0 likes",
                date: "Just now"
            };
            setPostHistory([newPost, ...postHistory]);
        }
        setShowScheduler(false);
        setSelectedPostData(null); // Clear selected data
    };

    const handlePostClick = (post: any, type: 'scheduled' | 'history') => {
        // Open modal with data
        setGeneratedContent(post.content); // Pre-fill content

        // Prepare initial data for modal
        let initialData = undefined;
        if (type === 'scheduled') {
            // Parse date string (very basic parsing for mock)
            // Mock date string is "Tomorrow, 10:00 AM" etc. real app would have ISO dates. 
            // For this UI demo, we'll just pass a dummy date or try to parse if possible, or just boolean.
            initialData = { isScheduled: true, date: new Date() };
        } else {
            initialData = { isScheduled: false };
        }

        setSelectedPostData({ ...post, isScheduled: type === 'scheduled' });
        setShowScheduler(true);
    };

    const handleViewAll = (tab: 'scheduled' | 'history') => {
        setAllPostsInitialTab(tab);
        setShowAllPostsModal(true);
    };

    const handleEditPostToPreview = (content: string) => {
        setGeneratedContent(content);
        setShowScheduler(false);
        setSelectedPostData(null);
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            const content = generateMockContent();
            setGeneratedContent(content);
            if (selectedTopic === 'vpd') {
                const nextProject = buildVpdProjectFromDraft(role, company, content);
                setVpdProject(nextProject);
                setSavedVpds((prev) => {
                    const exists = prev.some((v) => v.title === nextProject.title);
                    if (exists) return prev;
                    return [
                        {
                            id: nextProject.id,
                            title: nextProject.title || 'Value Proposition Document',
                            date: 'Just now',
                            project: nextProject,
                        },
                        ...prev,
                    ];
                });
            } else if (isDocumentTopic(selectedTopic)) {
                const title =
                    role && company ? `${role} @ ${company}` : DOCUMENT_TOPIC_LABELS[selectedTopic].slice(0, -1);
                const newId = `doc-${Date.now()}`;
                setSavedDocuments((prev) => {
                    const exists = prev.some(
                        (d) => d.topic === selectedTopic && d.kind === 'recent' && d.title === title,
                    );
                    if (exists) return prev;
                    return [
                        {
                            id: newId,
                            topic: selectedTopic,
                            kind: 'recent',
                            title,
                            date: 'Just now',
                            content,
                        },
                        ...prev,
                    ];
                });
                setSelectedDocumentId(newId);
            }
            setIsGenerating(false);
        }, 1500);
    };

    const handleOpenVpdEditor = () => setShowVpdEditor(true);

    const handleSelectVpd = (vpd: VpdListItem) => {
        setVpdProject({ ...vpd.project, id: String(vpd.id), title: vpd.title });
        setGeneratedContent(vpd.project.detailedBlocks?.[0]?.content?.toString() || '');
    };

    const handleCreateNewVpd = () => {
        const fresh = createDefaultVpdProject();
        setVpdProject(fresh);
        setGeneratedContent('');
        setShowVpdEditor(true);
    };

    const handleSelectDocument = (doc: DocumentLibraryItem) => {
        setSelectedDocumentId(doc.id);
        setGeneratedContent(doc.content);
        if (doc.title.includes(' @ ')) {
            const [r, c] = doc.title.split(' @ ');
            setRole(r?.trim() || '');
            setCompany(c?.trim() || '');
        }
    };

    const handleDeleteDocument = (id: string | number) => {
        setSavedDocuments((prev) => prev.filter((d) => d.id !== id));
        if (selectedDocumentId === id) {
            setSelectedDocumentId(null);
            setGeneratedContent('');
        }
    };

    const handleViewAllDocuments = () => {
        setShowAllDocumentsModal(true);
    };

    const generateMockContent = () => {
        if (selectedTopic === 'linkedin-post') {
            return `🚀 Excited to announce my next chapter!\n\nI'm thrilled to share that I'm diving deeper into Product Design. The journey hasn't been valid linear, but every step taught me something valuable about user empathy and systems thinking.\n\nBig thanks to everyone who supported me along the way. Can't wait to build amazing things! 🎨✨\n\n#ProductDesign #CareerUpdate #NewBeginnings #UX`;
        }
        if (selectedTopic === 'cover-letter') {
            return `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${role || '[Role]'} position at ${company || '[Company]'}. Having followed ${company || '[Company]'}'s work in...`;
        }
        if (selectedTopic === 'cold-email') {
            return `Hi ${managerName || '[Manager Name]'},\n\nI've been following the work your team is doing at ${company || '[Company]'} and I'm impressed by...\n\nI'm a ${role || '[Role]'} with experience in...`;
        }
        if (selectedTopic === 'referral') {
            return `Hi ${connectionName || '[Name]'},\n\nI hope you're doing well! I saw an opening for ${role || '[Role]'} at ${company || '[Company]'} and was wondering if you could share some insights...`;
        }
        return `Title: Value Proposition Document\nRole: ${role}\nCompany: ${company}\n\n1. Core Strengths...\n2. Relevant Experience...\n3. Why Me?`;
    };

    const selectedTopicMeta = ALL_TOPICS.find((t) => t.id === selectedTopic) ?? ALL_TOPICS[0];
    const selectedTopicDescription =
        TOPIC_DESCRIPTIONS[selectedTopic] ?? 'Generate high-quality application materials in seconds.';

    const renderVpdSavedCards = () => {
        const recents = savedVpds.filter((v) => !v.isTemplate);
        const templates = savedVpds.filter((v) => v.isTemplate);
        const activeList = vpdLibraryTab === 'recents' ? recents : templates;

        return (
            <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="inline-flex rounded-full bg-slate-100 p-0.5 dark:bg-slate-900">
                        <button
                            type="button"
                            onClick={() => setVpdLibraryTab('recents')}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                                vpdLibraryTab === 'recents'
                                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            Recents
                        </button>
                        <button
                            type="button"
                            onClick={() => setVpdLibraryTab('templates')}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                                vpdLibraryTab === 'templates'
                                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            Templates
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAllVPDsModal(true)}
                        className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                    >
                        See all
                    </button>
                </div>

                {activeList.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2.5">
                        {activeList.slice(0, 6).map((vpd) => (
                            <VpdLibraryCard key={vpd.id} vpd={vpd} onClick={() => handleSelectVpd(vpd)} />
                        ))}
                    </div>
                ) : (
                    <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400 dark:border-slate-700">
                        {vpdLibraryTab === 'recents'
                            ? 'No recent VPDs yet. Generate a draft to create one.'
                            : 'No templates available yet.'}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleCreateNewVpd}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition-all hover:border-brand-500 hover:text-brand-600 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
                >
                    <Plus size={18} />
                    Create blank VPD
                </button>
            </div>
        );
    };

    const renderDocumentSavedCards = () => {
        if (!isDocumentTopic(selectedTopic)) return null;

        const topicDocs = savedDocuments.filter((d) => d.topic === selectedTopic);
        const recents = topicDocs.filter((d) => d.kind === 'recent');
        const history = topicDocs.filter((d) => d.kind === 'history');
        const combinedList = [...recents, ...history];

        return (
            <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                <div className="mb-3 flex min-w-0 flex-1 items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">Recents</h3>
                    {combinedList.length > 0 && (
                        <span className="shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {combinedList.length}
                        </span>
                    )}
                </div>

                <div className="flex max-h-[min(42vh,360px)] flex-col gap-2 overflow-y-auto pr-1">
                    {combinedList.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400 dark:border-slate-700">
                            No recent drafts yet. Generate one to get started.
                        </p>
                    ) : (
                        combinedList.slice(0, 5).map((doc) => (
                            <DocumentListCard
                                key={doc.id}
                                doc={doc}
                                isSelected={selectedDocumentId === doc.id}
                                onClick={() => handleSelectDocument(doc)}
                                onDelete={handleDeleteDocument}
                            />
                        ))
                    )}
                </div>

                {combinedList.length > 0 && (
                    <div className="flex shrink-0 justify-center pt-3">
                        <button
                            type="button"
                            onClick={handleViewAllDocuments}
                            className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                            View all
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderInputs = () => {
        return (
            <div className="space-y-5">
                {/* LinkedIn Inputs */}
                {selectedTopic === 'linkedin-post' && (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-2">Topic Generator</label>
                            <div className="flex gap-2">
                                <input
                                    value={topicIdea}
                                    onChange={(e) => setTopicIdea(e.target.value)}
                                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="e.g. Learnings from my first design sprint..."
                                />
                                <button className="px-4 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-medium">
                                    <Wand2 size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-2">Mood</label>
                                <select
                                    value={mood}
                                    onChange={(e) => setMood(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none bg-white dark:bg-slate-900"
                                >
                                    {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <label className="block text-xs font-medium text-slate-500">Content Type</label>
                                    <div className="relative group/tooltip">
                                        <Info size={14} className="text-slate-400 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-xl border border-slate-700">
                                            <div className="space-y-2">
                                                <p><strong>Top of Funnel:</strong> Broad appeal content to drive awareness and views.</p>
                                                <p><strong>Middle of Funnel:</strong> Demonstrating expertise to build trust and authority.</p>
                                                <p><strong>Bottom of Funnel:</strong> Direct conversion content (e.g., looking for roles).</p>
                                            </div>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                        </div>
                                    </div>
                                </div>
                                <select
                                    value={contentType}
                                    onChange={(e) => setContentType(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                                >
                                    <option value="Top of Funnel">Top of Funnel</option>
                                    <option value="Middle of Funnel">Middle of Funnel</option>
                                    <option value="Bottom of Funnel">Bottom of Funnel</option>
                                </select>
                            </div>
                        </div>

                        {/* Media Upload Options */}
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-2">Media Attachment</label>
                            <button className="w-full py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group">
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                    <Upload size={20} />
                                </div>
                                <span className="text-xs font-medium">Click to upload media</span>
                            </button>
                        </div>

                        {/* Generate first, then full scheduled list (LinkedIn only) */}
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="mt-2 w-full rounded-xl bg-blue-600 py-4 font-medium text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                            ) : (
                                <Wand2 size={18} />
                            )}
                            {isGenerating ? ' crafting...' : 'Generate Draft'}
                        </button>

                        <div className="mt-5 flex min-h-[min(58vh,560px)] flex-1 flex-col border-t border-slate-100 pt-5 dark:border-slate-800">
                            <div className="mb-3 flex items-center gap-3">
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                    <StudioSectionDot />
                                    <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        Scheduled posts
                                    </h3>
                                    <span className="shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                        {scheduledPosts.length}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleViewAll('history')}
                                    title="Post history"
                                    aria-label={`Post history, ${postHistory.length} entries`}
                                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-orange-600 shadow-sm transition-all hover:border-orange-300 hover:bg-orange-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-orange-600/50 dark:hover:bg-orange-950/30"
                                >
                                    <History size={18} />
                                </button>
                            </div>

                            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                                {scheduledPosts.length === 0 ? (
                                    <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400 dark:border-slate-700">
                                        Nothing scheduled yet. Generate a draft, then schedule it from the preview.
                                    </p>
                                ) : (
                                    scheduledPosts.map((post) => (
                                        <LinkedInPostListCard
                                            key={post.id}
                                            post={post}
                                            onClick={() => handlePostClick(post, 'scheduled')}
                                            onDelete={(id) =>
                                                setScheduledPosts((prev) => prev.filter((p) => p.id !== id))
                                            }
                                        />
                                    ))
                                )}
                            </div>

                            <div className="flex shrink-0 justify-center pt-3">
                                <button
                                    type="button"
                                    onClick={() => handleViewAll('scheduled')}
                                    className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    View all
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Shared Inputs (Role, Company) for Non-LinkedIn */}
                {
                    selectedTopic !== 'linkedin-post' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Role</label>
                                <input
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="e.g. Product Designer"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Company</label>
                                <input
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="e.g. Spotify"
                                />
                            </div>
                        </div>
                    )
                }

                {/* Specific 3rd Inputs */}
                {
                    (selectedTopic === 'cover-letter' || selectedTopic === 'vpd') && (
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Job Description</label>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium h-32 resize-none outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Paste the JD here..."
                            />
                        </div>
                    )
                }

                {
                    selectedTopic === 'cold-email' && (
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Hiring Manager Name</label>
                            <input
                                value={managerName}
                                onChange={(e) => setManagerName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="e.g. John Doe"
                            />
                        </div>
                    )
                }

                {
                    selectedTopic === 'referral' && (
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Connection Name</label>
                            <input
                                value={connectionName}
                                onChange={(e) => setConnectionName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="e.g. Jane Smith"
                            />
                        </div>
                    )
                }

                {/* Generate Button (LinkedIn generates above scheduled list) */}
                {selectedTopic !== 'linkedin-post' && (
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-medium text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isGenerating ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                        ) : (
                            <Wand2 size={18} />
                        )}
                        {isGenerating ? ' crafting...' : 'Generate Draft'}
                    </button>
                )}

                {selectedTopic === 'vpd' && renderVpdSavedCards()}
                {isDocumentTopic(selectedTopic) && renderDocumentSavedCards()}
            </div >
        );
    };

    const isVpdTopic = selectedTopic === 'vpd';
    const showLinkedInOptimizeBanner =
        selectedTopic === 'linkedin-post' || selectedTopic === 'referral';

    return (
        <div className="flex-1 bg-white dark:bg-[#0a0a0a] h-full overflow-hidden font-sans flex flex-col">
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

                {/* LEFT: Input / Generator */}
                <div className="w-full lg:w-[45%] h-1/2 lg:h-full bg-white dark:bg-[#111] border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 p-8 overflow-y-auto">
                    <div className="mb-8">
                        <h1 className="mb-2 font-['Onest'] text-2xl font-medium text-slate-900 transition-colors dark:text-white">
                            {selectedTopicMeta.label}
                        </h1>
                        <p className="text-[14px] text-slate-500 transition-colors dark:text-slate-400">
                            {selectedTopicDescription}
                        </p>
                    </div>

                    {renderInputs()}
                </div>

                {/* RIGHT: Preview + Tabs */}
                <div className="flex-1 bg-slate-100 dark:bg-[#050505] flex flex-col relative">

                    {/* Top Bar for Tabs - Sticky */}
                    <div className="w-full px-8 py-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-100/50 dark:bg-[#050505] backdrop-blur-sm sticky top-0 z-20">
                        {/* Pill Tabs - Fully Rounded */}
                        <div className="flex flex-wrap items-center gap-3">
                            {TOPIC_GROUPS.map((group, gi) => (
                                <div
                                    key={gi}
                                    className={`inline-flex rounded-full p-1 bg-slate-200/50 dark:bg-slate-900 ${
                                        group.blueStroke
                                            ? 'border border-brand-500/25 dark:border-brand-400/30'
                                            : 'border border-transparent'
                                    }`}
                                >
                                    {group.topics.map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setSelectedTopic(t.id)}
                                            className={`
                                                px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                                                ${selectedTopic === t.id
                                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
                                            `}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        className={`relative flex min-h-0 flex-1 flex-col ${
                            showLinkedInOptimizeBanner ? '' : 'overflow-y-auto'
                        }`}
                    >
                        <div
                            className={`flex flex-1 items-start justify-center p-8 ${
                                showLinkedInOptimizeBanner ? 'min-h-0 overflow-y-auto pb-28' : 'overflow-y-auto'
                            }`}
                        >
                        {isVpdTopic ? (
                            <div className="flex h-full min-h-[min(70vh,640px)] w-full max-w-3xl flex-col">
                                <VpdPreview project={vpdProject} onOpenEditor={handleOpenVpdEditor} variant="panel" />
                            </div>
                        ) : (
                        <div className="relative w-full max-w-2xl group/preview">

                            {/* Improve / Actions */}
                            <div className="absolute -top-12 right-0 opacity-0 group-hover/preview:opacity-100 transition-opacity flex gap-2">
                                {selectedTopic === 'cover-letter' && (
                                    <button className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2 rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-all">
                                        <Download size={14} /> PDF
                                    </button>
                                )}
                            </div>
                            {/* Conditional Preview Rendering */}
                            {selectedTopic === 'linkedin-post' ? (
                                /* LinkedIn Card Preview */
                                <div className="flex min-h-[min(68vh,580px)] w-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex gap-3">
                                            <div className="w-12 h-12 rounded-full bg-[#3b82f6] flex items-center justify-center text-white font-medium text-lg shrink-0">AB</div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 text-sm leading-tight hover:text-blue-600 hover:underline cursor-pointer">Abhi B.</h3>
                                                <p className="text-xs text-slate-500 leading-tight mt-0.5">Product Designer @ Unimad</p>
                                                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1"><span>1h</span> • <Globe size={10} /></div>
                                            </div>
                                        </div>
                                        <button className="text-slate-500 hover:bg-slate-100 p-1 rounded-full"><MoreHorizontal size={20} /></button>
                                    </div>
                                    <textarea
                                        value={generatedContent}
                                        onChange={(e) => setGeneratedContent(e.target.value)}
                                        placeholder="Your content preview will appear here..."
                                        className="mb-2 min-h-[min(42vh,360px)] w-full flex-1 resize-none border-none bg-transparent text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-300"
                                    />
                                    <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3 mt-2">
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 hover:underline">
                                            <div className="flex -space-x-1">
                                                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white"><ThumbsUp size={8} className="text-white fill-current" /></div>
                                                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-white"><span className="text-[6px] text-white">❤️</span></div>
                                            </div>
                                            <span>1,245</span>
                                        </div>
                                        <div className="hover:text-blue-600 hover:underline cursor-pointer">88 comments • 12 reposts</div>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 px-2">
                                        <button className="py-3 px-2 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-600 text-sm font-semibold transition-colors"><ThumbsUp size={18} /> <span className="hidden sm:inline">Like</span></button>
                                        <button className="py-3 px-2 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-600 text-sm font-semibold transition-colors"><MessageSquare size={18} /> <span className="hidden sm:inline">Comment</span></button>
                                        <button className="py-3 px-2 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-600 text-sm font-semibold transition-colors"><Repeat size={18} /> <span className="hidden sm:inline">Repost</span></button>
                                        <button className="py-3 px-2 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-600 text-sm font-semibold transition-colors"><Send size={18} /> <span className="hidden sm:inline">Send</span></button>
                                    </div>
                                    <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedPostData(null);
                                                setShowScheduler(true);
                                            }}
                                            className="inline-flex items-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-[0.99]"
                                        >
                                            Schedule / Post
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Plain Text / Document Preview for Others */
                                <div className="mx-auto flex min-h-[min(68vh,580px)] w-full max-w-xl flex-col rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-[#111]">
                                    {/* Document Header (PDF Button) */}
                                    {['cover-letter', 'cold-email', 'referral'].includes(selectedTopic) && (
                                        <div className="border-b border-slate-100 dark:border-slate-800 p-4 flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    // Quick strip HTML for clipboard if it's rich text
                                                    const plain = generatedContent.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
                                                    navigator.clipboard.writeText(plain);
                                                    alert("Copied to clipboard!");
                                                }}
                                                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                                <Copy size={14} /> Copy
                                            </button>
                                            <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                                <Download size={14} /> Download as PDF
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex-1 p-12 overflow-y-auto">
                                        <RichTextEditor
                                            value={generatedContent}
                                            onChange={(val) => setGeneratedContent(val)}
                                            placeholder={`Your ${selectedTopic.replace('-', ' ')} draft will appear here...`}
                                            className="w-full min-h-full text-base text-slate-900 dark:text-slate-100 leading-relaxed bg-transparent border-none outline-none font-serif prose dark:prose-invert max-w-none"
                                        />
                                    </div>
                                </div>
                            )}

                        </div>
                        )}
                        </div>

                        {showLinkedInOptimizeBanner && (
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent px-8 pb-6 pt-10 dark:from-[#050505] dark:via-[#050505]/95">
                                <div className="pointer-events-auto">
                                    <LinkedInOptimizeBanner />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showScheduler && (
                <PostSchedulerModal
                    content={generatedContent}
                    onClose={() => setShowScheduler(false)}
                    onPost={handlePost}
                    onEditToPreview={handleEditPostToPreview}
                    initialData={selectedPostData ? { isScheduled: selectedPostData.isScheduled, date: new Date() } : undefined}
                />
            )}

            {showAllPostsModal && (
                <AllPostsModal
                    initialTab={allPostsInitialTab}
                    scheduledPosts={scheduledPosts}
                    historyPosts={postHistory}
                    onClose={() => setShowAllPostsModal(false)}
                    onPostClick={(post, type) => {
                        setShowAllPostsModal(false);
                        handlePostClick(post, type);
                    }}
                    onDeletePost={(id, type) => {
                        if (type === 'scheduled') {
                            setScheduledPosts((prev) => prev.filter((p) => p.id !== id));
                        } else {
                            setPostHistory((prev) => prev.filter((p) => p.id !== id));
                        }
                    }}
                />
            )}

            {showAllVPDsModal && (
                <AllVPDsModal
                    vpds={savedVpds}
                    initialTab={vpdLibraryTab}
                    onClose={() => setShowAllVPDsModal(false)}
                    onVPClick={(vpd) => {
                        setShowAllVPDsModal(false);
                        handleSelectVpd(vpd);
                    }}
                />
            )}

            {showAllDocumentsModal && isDocumentTopic(selectedTopic) && (
                <AllDocumentsModal
                    topicLabel={DOCUMENT_TOPIC_LABELS[selectedTopic]}
                    documents={savedDocuments.filter((d) => d.topic === selectedTopic)}
                    onClose={() => setShowAllDocumentsModal(false)}
                    selectedDocumentId={selectedDocumentId}
                    onDeleteDocument={handleDeleteDocument}
                    onDocumentClick={(doc) => {
                        setShowAllDocumentsModal(false);
                        handleSelectDocument(doc);
                    }}
                />
            )}

            {showVpdEditor && (
                <VpdEditorWindow
                    project={vpdProject}
                    onClose={() => setShowVpdEditor(false)}
                    onUpdateProject={(updated) => setVpdProject(updated)}
                />
            )}
        </div>
    );
};

export default StudioMainV2;
